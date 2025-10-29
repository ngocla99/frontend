# Mutual Chat Feature - PRD & Implementation Plan

**Feature Name:** Mutual Chat with Baby Generation
**Status:** 🚧 In Progress
**Created:** 2025-10-29
**Last Updated:** 2025-10-29

---

## Table of Contents

1. [Overview](#overview)
2. [Goals & Success Criteria](#goals--success-criteria)
3. [User Flow](#user-flow)
4. [Technical Requirements](#technical-requirements)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Implementation Plan](#implementation-plan)
9. [Testing Strategy](#testing-strategy)
10. [Dependencies & Blockers](#dependencies--blockers)

---

## Overview

### Problem Statement

Currently, users can generate AI baby images with their matches, but there's no way to communicate or connect beyond viewing the generated baby. This limits user engagement and relationship building on the platform.

### Solution

Implement a mutual connection system where:
1. When User A generates a baby with User B, User B receives an anonymous notification
2. When User B also generates a baby with the same match, a mutual connection is created
3. A real-time chat feature automatically unlocks between the two users
4. The generated baby image serves as the chat header
5. An AI-generated icebreaker message starts the conversation

### Key Features

- **Anonymous Notifications:** Users are notified when someone generates a baby with them (without revealing who)
- **Mutual Connection Detection:** System recognizes when both users have generated babies
- **Real-time Chat:** Supabase Realtime-powered messaging
- **AI Icebreakers:** Fun, predefined conversation starters
- **Baby Header:** Generated baby image displayed prominently in chat
- **Unlimited Connections:** Users can chat with multiple mutual matches

---

## Goals & Success Criteria

### Primary Goals

1. **Increase User Engagement:** Enable meaningful connections between matched users
2. **Leverage Baby Generation:** Use the baby as a conversation catalyst
3. **Maintain Privacy:** Keep matches anonymous until mutual interest is established
4. **Real-time Communication:** Provide instant messaging capabilities

### Success Metrics

- ✅ Users receive notifications within 1 second of baby generation
- ✅ Mutual connections created automatically when both users generate baby
- ✅ Chat messages delivered in real-time (<500ms latency)
- ✅ At least 50% of mutual connections result in at least one message exchange
- ✅ Zero false positives in mutual connection detection

### Non-Goals (Out of Scope)

- Video/voice calling
- Message encryption (can be added later)
- Read receipts (v2 feature)
- Typing indicators (v2 feature)
- Message reactions/emojis (v2 feature)
- Block/report functionality (v2 feature)

---

## User Flow

### Step 1: User A Generates Baby

```
┌─────────────┐
│   User A    │
│  (Profile)  │
└──────┬──────┘
       │
       │ 1. Views match with User B
       │ 2. Clicks "View Baby" button
       │
       ▼
┌─────────────────────┐
│  Baby Generator     │
│  Component          │
└──────┬──────────────┘
       │
       │ 3. POST /api/baby {match_id}
       │
       ▼
┌─────────────────────┐
│  Backend API        │
│  - Generate baby    │
│  - Save to DB       │
│  - Create notif     │
└──────┬──────────────┘
       │
       │ 4. Realtime broadcast
       │
       ▼
┌─────────────────────┐
│   User B            │
│  Notification:      │
│  "Someone generated │
│   a baby with you!" │
└─────────────────────┘
```

### Step 2: User B Responds (Mutual Connection)

```
┌─────────────┐
│   User B    │
│  (Profile)  │
└──────┬──────┘
       │
       │ 1. Sees notification
       │ 2. Clicks "View Baby"
       │
       ▼
┌─────────────────────┐
│  Baby Generator     │
│  Component          │
└──────┬──────────────┘
       │
       │ 3. POST /api/baby {match_id}
       │
       ▼
┌─────────────────────┐
│  Backend API        │
│  - Generate baby    │
│  - Check mutual     │
│  - Create connection│
│  - Send icebreaker  │
└──────┬──────────────┘
       │
       │ 4. Realtime broadcast
       │
       ▼
┌─────────────────────┐
│  Both Users         │
│  Notification:      │
│  "Chat unlocked!"   │
│  → Redirect to chat │
└─────────────────────┘
```

### Step 3: Chat Interaction

```
┌─────────────────────┐
│  Chat Interface     │
│  ┌───────────────┐  │
│  │  Baby Image   │  │ ← Header with generated baby
│  └───────────────┘  │
│                     │
│  🤖 AI Icebreaker:  │
│  "Looks like your  │
│   baby has your    │
│   smile 😄"        │
│                     │
│  User A: Hi! ...    │
│  User B: Hey! ...   │
│                     │
│  [Message Input]    │
└─────────────────────┘
```

---

## Technical Requirements

### Tech Stack

- **Frontend:** React 19 + Next.js 16 + TypeScript
- **Backend:** Next.js API Routes (TypeScript)
- **Database:** PostgreSQL (Supabase)
- **Real-time:** Supabase Realtime
- **State Management:** TanStack Query + Zustand
- **UI Components:** Radix UI + Tailwind CSS

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Notification Trigger** | Both users always notified | Maximizes engagement, keeps both parties informed |
| **Notification Timeout** | No expiration | Allows organic connection timing, no pressure |
| **Icebreaker Generation** | Predefined templates | Simple, fast, no API costs, reliable |
| **Connection Limit** | Unlimited | Encourages multiple connections, better engagement |
| **Real-time Provider** | Supabase Realtime | Already integrated, reliable, low latency |

### Performance Requirements

- Notification delivery: <1 second
- Message delivery: <500ms
- Chat history load: <2 seconds for last 50 messages
- Database queries: <100ms (indexed)
- Real-time connection: Auto-reconnect on failure

### Security Requirements

- Row Level Security (RLS) on all tables
- Users can only see their own notifications
- Users can only access messages from their connections
- No access to other users' connection data
- Rate limiting on baby generation (prevent spam)

---

## Database Schema

### New Tables

#### 1. `notifications` Table

Persistent notification system for user-specific events.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'baby_generated',
    'mutual_match',
    'new_message'
  )),
  title TEXT NOT NULL,
  message TEXT,
  related_id UUID,  -- ID of related entity (baby, match, message)
  related_type TEXT CHECK (related_type IN ('baby', 'match', 'message', 'connection')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

#### 2. `mutual_connections` Table

Tracks mutual matches where both users have generated babies.

```sql
CREATE TABLE mutual_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  baby_id UUID REFERENCES babies(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'blocked',
    'archived'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure no duplicate connections (order-independent)
  CONSTRAINT unique_connection CHECK (profile_a_id < profile_b_id),
  CONSTRAINT different_profiles CHECK (profile_a_id != profile_b_id)
);

-- Indexes
CREATE INDEX idx_mutual_connections_profile_a ON mutual_connections(profile_a_id);
CREATE INDEX idx_mutual_connections_profile_b ON mutual_connections(profile_b_id);
CREATE INDEX idx_mutual_connections_match_id ON mutual_connections(match_id);
CREATE INDEX idx_mutual_connections_status ON mutual_connections(status);

-- RLS Policies
ALTER TABLE mutual_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON mutual_connections FOR SELECT
  USING (
    auth.uid() = profile_a_id OR
    auth.uid() = profile_b_id
  );

CREATE POLICY "System can create connections"
  ON mutual_connections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own connections"
  ON mutual_connections FOR UPDATE
  USING (
    auth.uid() = profile_a_id OR
    auth.uid() = profile_b_id
  );
```

#### 3. `messages` Table

Stores chat messages between mutual connections.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES mutual_connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN (
    'text',
    'image',
    'icebreaker'
  )),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_connection_id ON messages(connection_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_read_at ON messages(read_at) WHERE read_at IS NULL;

-- RLS Policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own connections"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mutual_connections
      WHERE id = messages.connection_id
      AND (profile_a_id = auth.uid() OR profile_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to own connections"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM mutual_connections
      WHERE id = connection_id
      AND (profile_a_id = auth.uid() OR profile_b_id = auth.uid())
      AND status = 'active'
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());
```

### Schema Modifications

No modifications to existing tables required. The new tables integrate cleanly with existing `profiles`, `matches`, and `babies` tables.

---

## API Endpoints

### Notifications API

#### `POST /api/notifications`

Create a new notification for a user.

**Request:**
```typescript
{
  user_id: string;        // UUID of user to notify
  type: 'baby_generated' | 'mutual_match' | 'new_message';
  title: string;
  message?: string;
  related_id?: string;    // UUID of related entity
  related_type?: 'baby' | 'match' | 'message' | 'connection';
}
```

**Response:**
```typescript
{
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  related_id: string | null;
  related_type: string | null;
  read_at: string | null;
  created_at: string;
}
```

#### `GET /api/notifications`

Get user's notifications (paginated, unread first).

**Query Params:**
- `unread_only?: boolean` (default: false)
- `limit?: number` (default: 50)
- `offset?: number` (default: 0)

**Response:**
```typescript
{
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string | null;
    related_id: string | null;
    related_type: string | null;
    read_at: string | null;
    created_at: string;
  }>;
  total: number;
  unread_count: number;
}
```

#### `PATCH /api/notifications/[id]/read`

Mark notification as read.

**Response:**
```typescript
{
  id: string;
  read_at: string;
}
```

---

### Connections API

#### `POST /api/connections/check`

Check if mutual connection exists for a match.

**Request:**
```typescript
{
  match_id: string;
}
```

**Response:**
```typescript
{
  exists: boolean;
  connection?: {
    id: string;
    profile_a_id: string;
    profile_b_id: string;
    match_id: string;
    baby_id: string | null;
    status: 'active' | 'blocked' | 'archived';
    created_at: string;
  };
}
```

#### `GET /api/connections`

Get user's mutual connections (sorted by latest activity).

**Query Params:**
- `status?: 'active' | 'blocked' | 'archived'` (default: 'active')
- `limit?: number` (default: 50)
- `offset?: number` (default: 0)

**Response:**
```typescript
{
  connections: Array<{
    id: string;
    other_user: {
      id: string;
      name: string;
      profile_image: string | null;
    };
    baby_image: string | null;
    last_message: {
      content: string;
      created_at: string;
      is_mine: boolean;
    } | null;
    unread_count: number;
    created_at: string;
  }>;
  total: number;
}
```

#### `GET /api/connections/[id]`

Get specific connection details.

**Response:**
```typescript
{
  id: string;
  profile_a: { id: string; name: string; profile_image: string | null; };
  profile_b: { id: string; name: string; profile_image: string | null; };
  match_id: string;
  baby_image: string | null;
  status: string;
  created_at: string;
}
```

---

### Messages API

#### `GET /api/messages/[connectionId]`

Get messages for a connection (paginated, newest first).

**Query Params:**
- `limit?: number` (default: 50)
- `before?: string` (cursor for pagination)

**Response:**
```typescript
{
  messages: Array<{
    id: string;
    sender_id: string;
    sender_name: string;
    content: string;
    message_type: 'text' | 'image' | 'icebreaker';
    read_at: string | null;
    created_at: string;
  }>;
  has_more: boolean;
  next_cursor: string | null;
}
```

#### `POST /api/messages`

Send a new message.

**Request:**
```typescript
{
  connection_id: string;
  content: string;
  message_type?: 'text' | 'image';  // default: 'text'
}
```

**Response:**
```typescript
{
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
}
```

#### `PATCH /api/messages/[id]/read`

Mark message as read.

**Response:**
```typescript
{
  id: string;
  read_at: string;
}
```

---

### Modified API: Baby Generation

#### `POST /api/baby` (Enhanced)

Enhanced to include notification and mutual connection logic.

**New Logic:**
1. Generate baby image
2. Save baby to database
3. Find the other user in the match
4. Create notification for other user: "Someone generated a baby with you!"
5. Check if other user also generated baby for same match
6. If yes (mutual):
   - Create `mutual_connections` record
   - Create notifications for both users: "Chat unlocked!"
   - Generate random icebreaker message
   - Insert icebreaker as first message
   - Broadcast realtime events
7. Broadcast notification via Supabase Realtime

**Response (Enhanced):**
```typescript
{
  baby: {
    id: string;
    image_url: string;
    parent_a_id: string;
    parent_b_id: string;
    created_at: string;
  };
  mutual_connection?: {
    id: string;
    created_at: string;
    icebreaker: string;
  };
}
```

---

## Frontend Components

### Component Structure

```
src/
├── features/
│   ├── notifications/
│   │   ├── components/
│   │   │   ├── notification-center.tsx        # Bell icon + dropdown
│   │   │   ├── notification-list.tsx          # Scrollable notification list
│   │   │   └── notification-item.tsx          # Individual notification card
│   │   ├── hooks/
│   │   │   ├── use-notifications.ts           # Fetch notifications
│   │   │   ├── use-notifications-realtime.ts  # Subscribe to realtime updates
│   │   │   └── use-mark-as-read.ts            # Mark notification read
│   │   └── api/
│   │       ├── get-notifications.ts
│   │       └── mark-notification-read.ts
│   │
│   ├── chat/
│   │   ├── components/
│   │   │   ├── chat-list.tsx                  # List of all connections
│   │   │   ├── chat-room.tsx                  # Full chat interface
│   │   │   ├── chat-header.tsx                # Baby image + user info
│   │   │   ├── message-list.tsx               # Virtualized message list
│   │   │   ├── message-item.tsx               # Single message bubble
│   │   │   └── message-input.tsx              # Textarea + send button
│   │   ├── hooks/
│   │   │   ├── use-connections.ts             # Fetch connections
│   │   │   ├── use-messages.ts                # Fetch messages
│   │   │   ├── use-chat-realtime.ts           # Subscribe to new messages
│   │   │   └── use-send-message.ts            # Send message mutation
│   │   └── api/
│   │       ├── get-connections.ts
│   │       ├── get-messages.ts
│   │       └── send-message.ts
│   │
│   └── matching/
│       └── components/
│           └── match-dialog/
│               └── baby-generator.tsx         # (Modified) Add notification logic
│
└── app/
    ├── chat/
    │   ├── page.tsx                           # Chat list page
    │   └── [connectionId]/
    │       └── page.tsx                       # Chat room page
    └── (authenticated)/
        └── layout.tsx                         # (Modified) Add notification center
```

### Key Component Details

#### `notification-center.tsx`

- Bell icon with unread badge in header
- Dropdown/sidebar with notification list
- Real-time updates via Supabase
- Click notification → Navigate to related entity
- Mark as read on click

#### `chat-list.tsx`

- Grid/list of all mutual connections
- Shows baby image, other user name, last message preview
- Unread message count badge
- Sorted by latest activity
- Empty state: "No connections yet"

#### `chat-room.tsx`

- Full-screen chat interface
- Baby image in header (prominent)
- Virtualized message list (react-window or similar)
- Auto-scroll to latest message
- Message input at bottom
- Real-time message updates

#### `baby-generator.tsx` (Modified)

**Changes:**
1. After baby generation, show success toast: "Baby generated! Notification sent."
2. If API returns `mutual_connection`, show celebration animation
3. Display modal: "It's a match! Chat unlocked 💬"
4. Button: "Start Chatting" → Navigate to `/chat/[connectionId]`

---

## Implementation Plan

### Phase 1: Database Setup ✅

**Tasks:**
- [ ] Create migration 007: `notifications` table
- [ ] Create migration 008: `mutual_connections` table
- [ ] Create migration 009: `messages` table
- [ ] Apply migrations to local database
- [ ] Test RLS policies locally

**Estimated Time:** 2 hours

---

### Phase 2: Notification System Backend

**Tasks:**
- [ ] Create `src/app/api/notifications/route.ts` (GET, POST)
- [ ] Create `src/app/api/notifications/[id]/read/route.ts` (PATCH)
- [ ] Add notification creation helper in `src/lib/notifications.ts`
- [ ] Set up Supabase Realtime channel: `user:{userId}:notifications`
- [ ] Test notification creation and retrieval

**Estimated Time:** 3 hours

---

### Phase 3: Update Baby Generation API

**Tasks:**
- [ ] Modify `src/app/api/baby/route.ts`:
  - After baby creation, create notification for other user
  - Check if other user has generated baby for same match
  - If mutual: Create `mutual_connections` record
  - Generate random icebreaker message
  - Insert icebreaker as first message in `messages` table
  - Create notifications for both users
  - Broadcast realtime events
- [ ] Create icebreaker template system (`src/lib/icebreakers.ts`)
- [ ] Test baby generation with notification flow

**Estimated Time:** 4 hours

---

### Phase 4: Connection API

**Tasks:**
- [ ] Create `src/app/api/connections/route.ts` (GET)
- [ ] Create `src/app/api/connections/check/route.ts` (POST)
- [ ] Create `src/app/api/connections/[id]/route.ts` (GET)
- [ ] Add helper: `src/lib/connections.ts` (check mutual, create connection)
- [ ] Test connection creation and retrieval

**Estimated Time:** 3 hours

---

### Phase 5: Messages API

**Tasks:**
- [ ] Create `src/app/api/messages/[connectionId]/route.ts` (GET)
- [ ] Create `src/app/api/messages/route.ts` (POST)
- [ ] Create `src/app/api/messages/[id]/read/route.ts` (PATCH)
- [ ] Set up Supabase Realtime channel: `connection:{connectionId}`
- [ ] Add pagination support (cursor-based)
- [ ] Test message sending and retrieval

**Estimated Time:** 4 hours

---

### Phase 6: Notification UI

**Tasks:**
- [ ] Create `notification-center.tsx` component
- [ ] Create `notification-list.tsx` component
- [ ] Create `notification-item.tsx` component
- [ ] Create `use-notifications.ts` hook
- [ ] Create `use-notifications-realtime.ts` hook
- [ ] Create `use-mark-as-read.ts` hook
- [ ] Add notification center to authenticated layout header
- [ ] Style components with Tailwind CSS
- [ ] Add animations (Framer Motion)
- [ ] Test real-time notifications

**Estimated Time:** 5 hours

---

### Phase 7: Update Baby Generator

**Tasks:**
- [ ] Modify `baby-generator.tsx`:
  - Add success message with notification info
  - Handle `mutual_connection` response
  - Show celebration animation if mutual
  - Add "Start Chatting" button
- [ ] Add navigation to chat room
- [ ] Test flow end-to-end

**Estimated Time:** 2 hours

---

### Phase 8: Chat Interface

**Tasks:**
- [ ] Create `chat-list.tsx` (connection list page)
- [ ] Create `chat-room.tsx` (full chat interface)
- [ ] Create `chat-header.tsx` (baby image header)
- [ ] Create `message-list.tsx` (virtualized scrolling)
- [ ] Create `message-item.tsx` (message bubbles)
- [ ] Create `message-input.tsx` (textarea + send)
- [ ] Create `use-connections.ts` hook
- [ ] Create `use-messages.ts` hook
- [ ] Create `use-chat-realtime.ts` hook
- [ ] Create `use-send-message.ts` hook
- [ ] Add pages: `/chat` and `/chat/[connectionId]`
- [ ] Style components (Tailwind CSS)
- [ ] Add animations (message enter/exit, scroll)
- [ ] Add optimistic UI updates
- [ ] Test real-time messaging

**Estimated Time:** 8 hours

---

### Phase 9: AI Icebreaker Templates

**Tasks:**
- [ ] Create `src/lib/icebreakers.ts` with template array
- [ ] Add random selection logic
- [ ] Add emoji support
- [ ] Test icebreaker insertion on mutual connection

**Estimated Time:** 1 hour

---

### Phase 10: Polish & Testing

**Tasks:**
- [ ] Add loading states to all components
- [ ] Add error handling (toast notifications)
- [ ] Add empty states (no notifications, no chats)
- [ ] Add rate limiting on baby generation
- [ ] Test edge cases:
  - Both users generate baby simultaneously
  - User generates multiple babies before other responds
  - Connection exists but no messages
  - Network failures and reconnections
- [ ] Test on mobile devices (responsive design)
- [ ] Accessibility audit (keyboard navigation, ARIA labels)
- [ ] Performance testing (large message lists, many connections)

**Estimated Time:** 6 hours

---

### Phase 11: Documentation

**Tasks:**
- [ ] Update `.agent/system/project_architecture.md` with chat system
- [ ] Update `.agent/system/database_schema.md` with new tables
- [ ] Update `.agent/README.md` with new feature
- [ ] Create SOP for adding real-time features
- [ ] Document icebreaker system

**Estimated Time:** 2 hours

---

**Total Estimated Time:** ~40 hours (5 days at 8 hours/day)

---

## Testing Strategy

### Unit Tests

**Backend:**
- Notification creation logic
- Mutual connection detection
- Icebreaker selection
- RLS policy enforcement

**Frontend:**
- Component rendering (snapshots)
- Hook data fetching
- Message input validation
- Optimistic UI updates

### Integration Tests

- Baby generation → Notification creation
- Mutual baby generation → Connection creation
- Message sending → Realtime delivery
- Notification click → Navigation

### E2E Tests

1. **Full Mutual Connection Flow:**
   - User A generates baby
   - User B receives notification
   - User B generates baby
   - Both users see "Chat unlocked" notification
   - Both can send/receive messages in real-time

2. **Multiple Connections:**
   - User has 3 mutual connections
   - Can switch between chats
   - Each chat maintains separate message history
   - Notifications work for all connections

3. **Edge Cases:**
   - Simultaneous baby generation
   - Network disconnection/reconnection
   - Message send failures
   - Large message lists (performance)

### Manual Testing

- Test on different devices (mobile, tablet, desktop)
- Test with different network conditions (slow 3G, offline)
- Test accessibility (screen readers, keyboard navigation)
- Test with real users (beta testing)

---

## Dependencies & Blockers

### Dependencies

✅ **Existing Infrastructure:**
- Supabase database and authentication
- Supabase Realtime (already used for match feed)
- Baby generation API (working)
- TanStack Query + Zustand (state management)
- Next.js API Routes

✅ **No External Dependencies Required**

### Potential Blockers

1. **Supabase Realtime Limits:**
   - **Risk:** Connection limits or throttling
   - **Mitigation:** Monitor usage, implement connection pooling if needed

2. **Database Performance:**
   - **Risk:** Slow queries with large message history
   - **Mitigation:** Proper indexing, pagination, archiving old messages

3. **Baby Generation Rate Limiting:**
   - **Risk:** Users spam baby generation to trigger notifications
   - **Mitigation:** Rate limit (e.g., 1 generation per match per hour)

4. **Notification Spam:**
   - **Risk:** Too many notifications annoy users
   - **Mitigation:** Batch notifications, user preferences (future)

5. **Real-time Connection Stability:**
   - **Risk:** Network issues cause message loss
   - **Mitigation:** Auto-reconnect, offline queue, retry logic

---

## Future Enhancements (Post-MVP)

### v2 Features

- [ ] Read receipts (show when message was read)
- [ ] Typing indicators (show when other user is typing)
- [ ] Message reactions (emoji reactions)
- [ ] Image/GIF sharing in chat
- [ ] Voice messages
- [ ] Video chat integration
- [ ] Block/report functionality
- [ ] Notification preferences (mute connections)
- [ ] Message search
- [ ] Message editing/deletion
- [ ] Push notifications (mobile)

### v3 Features

- [ ] End-to-end encryption
- [ ] Group chats (multiple users)
- [ ] Chat themes/customization
- [ ] Stickers/GIF integration
- [ ] Voice/video calls
- [ ] Screen sharing
- [ ] Chat bots/AI assistants

---

## Success Metrics (Post-Launch)

### Engagement Metrics

- **Connection Rate:** % of baby generations that result in mutual connections
- **Message Rate:** % of mutual connections that result in at least one message
- **Response Time:** Average time for first message after connection
- **Retention:** % of users who return after first chat

### Technical Metrics

- **Notification Delivery:** <1s latency (99th percentile)
- **Message Delivery:** <500ms latency (99th percentile)
- **Realtime Connection Uptime:** >99.9%
- **API Response Time:** <200ms (95th percentile)

### User Satisfaction

- User feedback surveys
- Net Promoter Score (NPS)
- Feature usage analytics
- Bug reports and complaints

---

## Changelog

### 2025-10-29 - Initial PRD Created
- Defined user flow and requirements
- Designed database schema
- Planned API endpoints
- Created implementation plan
- Estimated 40 hours for full implementation

---

**Status:** 🚧 Ready for Implementation

**Next Steps:**
1. Review PRD with team
2. Approve database schema
3. Begin Phase 1: Database Setup
