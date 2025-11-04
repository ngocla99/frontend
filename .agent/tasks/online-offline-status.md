# Online/Offline Status Feature

**Status**: ✅ Frontend Implementation Complete
**Created**: 2025-11-02
**Last Updated**: 2025-11-04

## Overview

Add real-time online/offline status indicators to the chat feature, allowing users to see when their connections are active or when they were last seen.

## Implementation Summary

### Architecture Decision: Global Presence Store with Single Subscription

Instead of multiple hooks subscribing to the same Supabase channel, we implemented a centralized approach:

1. **Single Subscription**: `usePresenceTracker` hook (called once in root layout) subscribes to `connections:presence` channel
2. **Global State**: Zustand store (`presence-store.ts`) maintains online/offline status for all users
3. **Atomic Selectors**: Components use `useIsUserOnline(userId)` for optimal re-render performance
4. **No Privacy Filtering**: Per requirements, all users can see each other's presence (privacy removed for simplification)

### Key Components

- **Database**: `profiles.last_seen` column with index for efficient querying
- **API**: `PATCH /api/presence` endpoint to update `last_seen` timestamp
- **Store**: `src/features/presence/store/presence-store.ts` - Zustand store with atomic selectors
- **Hooks**:
  - `usePresenceTracker` - Tracks current user + updates global store
  - `usePresenceStatus` - Gets formatted status for any user from store
- **Components**:
  - `ConnectionItem` - Shows online indicator + status text in chat list
  - `ChatHeader` - Shows online status in chat view
  - `OnlineIndicator` - Reusable green/gray dot indicator

### Technical Highlights

- ✅ Single Supabase Realtime subscription (avoids duplicate connections)
- ✅ Zustand store with atomic selectors (optimal performance)
- ✅ Last seen formatting: "Just now", "5m ago", "2h ago", "3d ago"
- ✅ Automatic `last_seen` update on disconnect
- ✅ Full TypeScript type safety
- ✅ Clean barrel exports for easy imports

## Requirements

### Functional Requirements

1. **Display Locations**
   - Chat list (connections list): Show online indicator next to each connection
   - Chat header: Show online status when viewing an active conversation

2. **Status Detail Levels**
   - **Online**: User is currently active (green indicator)
   - **Last seen**: Show "Last seen X ago" when user is offline (gray indicator)

3. **Privacy Settings**
   - Only show online status to users with mutual connections
   - Users who are not connected cannot see each other's presence

4. **Data Persistence**
   - Store `last_seen` timestamp in database for historical reference
   - Update timestamp when user disconnects or closes app

### Non-Functional Requirements

1. **Real-time Performance**
   - Online status should update within 1-2 seconds
   - Use Supabase Realtime Presence API for low latency

2. **Scalability**
   - Minimize database writes (use Supabase Presence for real-time, DB only for last_seen)
   - Efficient querying with proper indexing

3. **Consistency**
   - Follow existing patterns from notifications and chat features
   - Use TanStack Query + Zustand for state management

## Database Schema Changes

### Migration: `017_add_presence_to_profiles.sql`

```sql
-- Add last_seen column to profiles table
ALTER TABLE profiles
ADD COLUMN last_seen timestamptz;

-- Add index for efficient querying
CREATE INDEX idx_profiles_last_seen ON profiles(last_seen);

-- Add comment
COMMENT ON COLUMN profiles.last_seen IS 'Timestamp when user was last seen online (updated on disconnect)';
```

### Updated `profiles` Table Schema

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  gender text,
  school text,
  default_face_id uuid REFERENCES face_images(id),
  last_seen timestamptz,           -- NEW
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## API Specifications

### New Endpoint: Update Presence

**Endpoint**: `PATCH /api/presence`

**Purpose**: Update user's last_seen timestamp when they disconnect or become inactive

**Request Body**:
```typescript
{
  last_seen: string; // ISO 8601 timestamp
}
```

**Response**:
```typescript
{
  success: boolean;
  last_seen: string;
}
```

**Implementation**:
```typescript
// src/app/api/presence/route.ts
export async function PATCH(request: Request) {
  const user = await getUserFromRequest(request);
  const { last_seen } = await request.json();

  // Update last_seen in profiles table
  const { data, error } = await supabase
    .from('profiles')
    .update({ last_seen })
    .eq('id', user.id)
    .select()
    .single();

  return NextResponse.json({ success: true, last_seen: data.last_seen });
}
```

### Updated Endpoints

#### `GET /api/connections`

**Changes**: Include `last_seen` in `other_user` object

**Updated Response**:
```typescript
{
  connections: [
    {
      id: string;
      other_user: {
        id: string;
        name: string;
        profile_image: string | null;
        last_seen: string | null;  // NEW
      };
      baby_image: string | null;
      last_message: Message | null;
      unread_count: number;
      created_at: string;
    }
  ]
}
```

#### `GET /api/connections/:id`

**Changes**: Include `last_seen` in `other_user` object

**Updated Response**:
```typescript
{
  id: string;
  other_user: {
    id: string;
    name: string;
    profile_image: string | null;
    last_seen: string | null;  // NEW
  };
  // ... other fields
}
```

## Component Architecture

### New Feature: `src/features/presence/`

```
src/features/presence/
├── hooks/
│   ├── use-presence-tracker.ts         # Track current user's presence
│   ├── use-connection-presence.ts      # Subscribe to presence for connection user IDs
│   ├── use-presence-status.ts          # Get formatted status for a user
│   └── index.ts
├── api/
│   ├── update-last-seen.ts             # TanStack Query mutation
│   └── index.ts
├── utils/
│   ├── format-last-seen.ts             # Format timestamp to "Last seen X ago"
│   └── index.ts
└── types/
    └── index.ts                        # Presence type definitions
```

### Updated Components

#### `src/features/chat/components/chat-list.tsx`

**Changes**:
- Add online indicator (green/gray dot) next to user avatar
- Show "Online" or "Last seen X ago" text below user name
- Use `use-connection-presence` hook to subscribe to presence

**UI Layout**:
```
┌─────────────────────────────────────┐
│ [●] [Avatar] Alice Smith            │ ← Green dot = online
│              Online                  │
│              Hey, how are you?       │
├─────────────────────────────────────┤
│ [○] [Avatar] Bob Johnson            │ ← Gray dot = offline
│              Last seen 5 minutes ago │
│              See you tomorrow!       │
└─────────────────────────────────────┘
```

#### `src/features/chat/components/chat-header.tsx`

**Changes**:
- Add online status text below user name
- Use `use-presence-status` hook to get formatted status

**UI Layout**:
```
┌─────────────────────────────────────┐
│ [← Back] [Avatar] Alice Smith       │
│                   Online             │ ← New status line
│                   [⋮ Menu]           │
└─────────────────────────────────────┘
```

## Technical Implementation

### 1. Supabase Realtime Presence

**Channel Strategy**:
- Use a single shared channel: `connections:presence`
- All online users join this channel
- Track presence with metadata: `{ user_id, online_at }`

**Presence Tracking Hook** (`use-presence-tracker.ts`):
```typescript
export function usePresenceTracker() {
  const { user } = useAuth();
  const updateLastSeen = useUpdateLastSeen();

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('connections:presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        // Presence state synced
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Update last_seen on disconnect
    return () => {
      updateLastSeen.mutate({ last_seen: new Date().toISOString() });
      channel.unsubscribe();
    };
  }, [user]);
}
```

**Presence Subscription Hook** (`use-connection-presence.ts`):
```typescript
export function useConnectionPresence(userIds: string[]) {
  const [presenceState, setPresenceState] = useState<Record<string, PresenceData>>({});

  useEffect(() => {
    const channel = supabase.channel('connections:presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Filter to only include users in userIds (privacy)
        const filtered = Object.entries(state)
          .filter(([_, presence]) =>
            userIds.includes(presence[0]?.user_id)
          )
          .reduce((acc, [key, val]) => ({ ...acc, [key]: val[0] }), {});

        setPresenceState(filtered);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // User came online
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // User went offline
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userIds]);

  return presenceState;
}
```

**Status Helper Hook** (`use-presence-status.ts`):
```typescript
export function usePresenceStatus(userId: string, lastSeen: string | null) {
  const presenceState = useConnectionPresence([userId]);

  const isOnline = useMemo(() => {
    return !!presenceState[userId];
  }, [presenceState, userId]);

  const statusText = useMemo(() => {
    if (isOnline) return 'Online';
    if (!lastSeen) return 'Offline';
    return formatLastSeen(lastSeen);
  }, [isOnline, lastSeen]);

  return { isOnline, statusText };
}
```

### 2. Last Seen Formatting

**Utility Function** (`format-last-seen.ts`):
```typescript
export function formatLastSeen(lastSeenISO: string): string {
  const now = new Date();
  const lastSeen = new Date(lastSeenISO);
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Last seen just now';
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Last seen ${diffDays}d ago`;

  return `Last seen ${new Date(lastSeenISO).toLocaleDateString()}`;
}
```

### 3. API Client

**Update Last Seen** (`api/update-last-seen.ts`):
```typescript
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface UpdateLastSeenInput {
  last_seen: string;
}

export function useUpdateLastSeen() {
  return useMutation({
    mutationFn: async (input: UpdateLastSeenInput) => {
      const response = await apiClient.patch('/api/presence', input);
      return response.data;
    },
  });
}
```

### 4. TypeScript Types

**Types** (`types/index.ts`):
```typescript
export interface PresenceData {
  user_id: string;
  online_at: string;
}

export interface PresenceState {
  [key: string]: PresenceData;
}

export interface UserPresenceStatus {
  isOnline: boolean;
  statusText: string;
}
```

## Privacy Implementation

**Strategy**: Filter presence state to only show users in current user's connections

**Implementation**:
1. Fetch user's connections list (already available via `useConnections` hook)
2. Extract `other_user.id` from each connection
3. Pass array of user IDs to `useConnectionPresence` hook
4. Hook filters presence state to only include these user IDs

**Example**:
```typescript
// In chat-list.tsx
const { data: connections } = useConnections();
const userIds = connections?.map(c => c.other_user.id) ?? [];
const presenceState = useConnectionPresence(userIds);

// presenceState will only contain presence data for connected users
```

## UI/UX Specifications

### Online Indicator

**Visual Design**:
- **Online**: Green dot (8px diameter, `bg-green-500`)
- **Offline**: Gray dot (8px diameter, `bg-gray-400`)
- Position: Left of avatar (absolute positioning)

**Status Text**:
- **Online**: "Online" in green (`text-green-600`)
- **Offline**: "Last seen X ago" in gray (`text-gray-500`)
- Font size: `text-sm`
- Position: Below user name

### Animation

**Presence Changes**:
- Fade in/out transition when status changes (200ms duration)
- Use Framer Motion for smooth animations (consistent with existing UI)

## Testing Plan

### Manual Testing

1. **Single User**:
   - [ ] Open app → Verify presence channel joined
   - [ ] Close app → Verify last_seen updated in database
   - [ ] Reopen app → Verify last_seen displayed correctly

2. **Multiple Users**:
   - [ ] User A and B both online → Both see green indicators
   - [ ] User A closes app → User B sees "Last seen just now"
   - [ ] Wait 5 minutes → User B sees "Last seen 5m ago"

3. **Privacy**:
   - [ ] User A and B are connected → Can see each other's status
   - [ ] User A and C are NOT connected → Cannot see each other's status
   - [ ] User A views chat list → Only sees status for connected users

4. **Real-time Updates**:
   - [ ] User B comes online → User A sees status change to "Online" immediately
   - [ ] User B goes offline → User A sees status change to "Last seen X ago" within 2 seconds

### Edge Cases

- [ ] User with no connections → Empty presence state
- [ ] User with slow internet → Handle connection timeouts gracefully
- [ ] User switches tabs → Presence should persist
- [ ] User's last_seen is null → Show "Offline" (no timestamp)

## Implementation Checklist

### Phase 1: Database & Backend ✅ COMPLETED
- [x] Create migration file `017_add_presence_to_profiles.sql`
- [x] Run migration on development database
- [x] Verify `last_seen` column added successfully
- [x] Create `src/app/api/presence/route.ts` (PATCH endpoint)
- [ ] Test API endpoint with Postman/curl
- [x] Update `GET /api/connections` to include `last_seen`
- [x] Update `GET /api/connections/:id` to include `last_seen`

### Phase 2: Presence Feature ✅ COMPLETED
- [x] Create `src/features/presence/` directory structure
- [x] Implement `types/index.ts` (TypeScript types)
- [x] Implement `utils/format-last-seen.ts` with tests
- [x] Implement `api/update-last-seen.ts` (TanStack Query mutation)
- [x] Implement `hooks/use-presence-tracker.ts` (track current user)
- [x] Implement `store/presence-store.ts` (Zustand store with atomic selectors)
- [x] Implement `hooks/use-presence-status.ts` (status helper)
- [x] Integrate presence tracker with global store

### Phase 3: UI Integration ✅ COMPLETED
- [x] Create `ConnectionItem` component with online indicator
  - [x] Add online indicator dot (green/gray)
  - [x] Add status text below user name
  - [x] Integrate `use-presence-status` hook
- [x] Update `chat-list.tsx`:
  - [x] Use `ConnectionItem` component
  - [x] Remove duplicate code
- [x] Update `chat-header.tsx`:
  - [x] Add status text with color coding
  - [x] Integrate `use-presence-status` hook
- [x] Add `use-presence-tracker` to root layout
- [x] Add `last_seen` to chat types

### Phase 4: Testing & Polish (IN PROGRESS)
- [ ] Test presence tracking across multiple browser tabs
- [ ] Test "Last seen" timestamp updates on disconnect
- [x] Verify TypeScript types are correct (Build passes)
- [ ] Test on mobile viewport
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

**Note:** Privacy filtering removed per requirements - all users can see each other's presence

### Phase 5: Documentation
- [ ] Update `.agent/system/database_schema.md` with `last_seen` column
- [ ] Update `.agent/README.md` to reference this PRD
- [x] Add code comments to complex presence logic
- [x] Update component documentation

## Future Enhancements

### v2.0 (Not in Current Scope)
- [ ] User privacy settings ("Who can see my online status?")
- [ ] "Typing..." indicator when user is actively typing
- [ ] "Away" status when user is inactive for X minutes
- [ ] Custom status messages ("At work", "Busy", etc.)
- [ ] Online status history/analytics
- [ ] Desktop notifications when connection comes online

## Dependencies

### Required
- Supabase Realtime (✅ Already integrated)
- TanStack Query (✅ Already integrated)
- Zustand (✅ Already integrated)
- Framer Motion (✅ Already integrated for animations)

### New Dependencies
None - all required packages are already installed

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| High database load from frequent last_seen updates | Medium | Only update on disconnect, not on every activity |
| Presence state not syncing in real-time | High | Use Supabase Presence API (battle-tested, reliable) |
| Privacy leaks (showing status to non-connections) | High | Filter presence state by connection user IDs |
| Users always appear offline due to connection issues | Medium | Add retry logic and connection status indicator |
| Inconsistent timestamp formatting across timezones | Low | Use ISO 8601 timestamps, format on client side |

## Success Metrics

- [ ] 95%+ users can see accurate online status for connections
- [ ] <2 second latency for presence updates
- [ ] Zero privacy leaks (non-connections cannot see status)
- [ ] <1% error rate on last_seen updates
- [ ] User satisfaction feedback (future survey)

## Related Documentation

- [Mutual Chat Feature PRD](.agent/tasks/mutual-chat-feature.md)
- [Project Architecture](.agent/system/project_architecture.md)
- [Database Schema](.agent/system/database_schema.md)
- [API Organization SOP](.agent/sop/api-organization.md)

## Notes

- Follow existing real-time patterns from notifications feature
- Reuse TanStack Query patterns from chat API
- Maintain consistency with UI design system (Tailwind classes, Framer Motion)
- Test thoroughly with multiple users to ensure privacy is enforced
