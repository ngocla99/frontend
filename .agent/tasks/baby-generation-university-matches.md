# Baby Generation for University Matches

**Feature:** Enable AI baby generation from university match pairs in the frontend

**Status:** In Progress

**Created:** 2025-10-15

---

## Overview

This feature connects the existing baby generation backend API to the frontend university match flow, allowing users to generate AI baby images from their university matches using FAL.AI.

## Current State

### What Already Exists
- ✅ Backend API endpoints for baby generation (`/api/v1/baby`)
- ✅ `babies` table in PostgreSQL database
- ✅ FAL.AI integration in backend (`app/services/baby_service.py`)
- ✅ `BabyGenerator` component in frontend (using placeholder images)
- ✅ `MatchDialog` component shell
- ✅ Zustand store for managing dialog state (`user-matches.ts`)
- ✅ University match cards with "View Baby" button

### What's Missing
1. **Frontend API integration** - No API client functions for baby generation
2. **Real AI generation** - BabyGenerator uses canvas placeholders instead of real API
3. **Match ID flow** - Dialog doesn't receive/pass match IDs to enable API calls
4. **Type definitions** - Missing TypeScript types for baby API responses
5. **State management** - Store doesn't track which match is selected for baby generation

---

## Requirements

### Functional Requirements
1. User clicks "View Baby" on a university match card
2. Dialog opens showing the two matched users
3. User clicks "Generate Our Baby's Face" button
4. System calls backend API with match_id
5. Loading state shows for ~3-5 seconds during AI generation
6. Generated baby image displays with participant info
7. User can share, save, or regenerate the baby
8. Error handling for API failures

### Technical Requirements
1. TypeScript type safety for all API responses
2. React Query for data fetching and caching
3. Proper loading and error states
4. Match ID passed through component hierarchy
5. Zustand store updated with match context
6. Follow existing API pattern (queryOptions + hooks)

---

## Implementation Plan

### Phase 1: Type Definitions & API Layer

#### 1.1 Add BabyApi Type (`src/types/api.ts`)
```typescript
export type BabyApi = {
  id: string;
  image_url: string;
  me: {
    id: string;
    name: string;
    image: string;
    school: string;
  };
  other: {
    id: string;
    name: string;
    image: string;
    school: string;
  };
  created_at: string;
};
```

#### 1.2 Create Baby API Integration (`src/features/matching/api/generate-baby.ts`)
```typescript
// API Functions
- generateBabyApi(matchId: string): Promise<BabyApi>
- getBabyForMatchApi(matchId: string): Promise<BabyApi | null>

// Query Options
- generateBabyQueryOptions(matchId: string)
- getBabyForMatchQueryOptions(matchId: string)

// Hooks
- useGenerateBaby() // mutation hook
- useBabyForMatch(matchId: string) // query hook
```

**Endpoints:**
- `POST /api/v1/baby?match_id=<uuid>` - Generate baby
- `GET /api/v1/baby?match_id=<uuid>` - Get existing baby

---

### Phase 2: State Management

#### 2.1 Update Zustand Store (`src/features/matching/store/user-matches.ts`)
**Changes:**
```typescript
// Add matchId to store
type UserMatchesStore = {
  open: boolean;
  userMatches: UserMatchesType | null;
  matchId: string | null; // NEW
  actions: {
    onOpen: (userMatches: UserMatchesType, matchId: string) => void; // UPDATED
    onClose: () => void;
    onOpenChange: (open: boolean) => void;
  };
};

// Add selector
export const useMatchId = () => useUserMatchesStore((state) => state.matchId);
```

---

### Phase 3: Component Updates

#### 3.1 Update UniversityMatchCard (`university-match-card.tsx`)
**Current:** Button exists but doesn't connect to dialog properly
**Changes:**
- Import `useUserMatchesActions` from store
- Update "View Baby" button onClick to call `onOpen()` with match data and match ID
- Pass both users' info and the match ID

```typescript
const { onOpen } = useUserMatchesActions();

<Button onClick={() => {
  onOpen(
    {
      user1: { name: match.me.name, photo: match.me.image },
      user2: { name: match.other.name, photo: match.other.image }
    },
    match.id // Pass match ID
  );
}}>
  View Baby
</Button>
```

#### 3.2 Update MatchDialog (`match-dialog.tsx`)
**Current:** Only passes user photos/names, no match ID
**Changes:**
- Get matchId from store using `useMatchId()`
- Pass matchId as prop to BabyGenerator

```typescript
const matchId = useMatchId();

<BabyGenerator
  matchId={matchId} // NEW PROP
  userPhoto={userMatches?.user1.photo}
  matchPhoto={userMatches?.user2.photo}
  matchName={userMatches?.user2.name}
  onBack={() => onOpenChange(false)}
/>
```

#### 3.3 Update BabyGenerator (`baby-generator.tsx`)
**Current:** Uses canvas placeholder, fake scores, mock predictions
**Major Changes:**

1. **Add Props:**
```typescript
interface BabyGeneratorProps {
  matchId?: string; // NEW
  userPhoto?: string;
  matchPhoto?: string;
  matchName?: string;
  onBack?: () => void;
}
```

2. **Replace Canvas Logic with API Calls:**
```typescript
const { mutate: generateBaby, isPending } = useGenerateBaby();
const { data: existingBaby } = useBabyForMatch(matchId);

const handleGenerate = () => {
  if (!matchId) return;
  generateBaby(matchId, {
    onSuccess: (data) => {
      setBabyImage(data.image_url);
      toast.success("Your baby is ready! 🎉");
    },
    onError: () => {
      toast.error("Failed to generate baby. Try again!");
    }
  });
};
```

3. **Remove Mock Features:**
- ❌ Remove canvas drawing code
- ❌ Remove fake compatibility score
- ❌ Remove fake predictions (eyes, hair, personality)
- ❌ Remove localStorage tracking (use backend data)

4. **Update UI:**
- Show loading state during API call (~3-5 seconds)
- Display real baby image from `data.image_url`
- Keep share/save/retry functionality
- Show error states properly

---

## API Integration Details

### Backend Endpoints (Already Implemented)

#### Generate Baby
```
POST /api/v1/baby?match_id=<uuid>
Authorization: Bearer <token>

Response 200:
{
  "id": "match-uuid",
  "image_url": "https://fal.media/.../baby.jpeg",
  "me": {
    "id": "user-uuid",
    "name": "John",
    "image": "https://...",
    "school": "MIT"
  },
  "other": {
    "id": "user-uuid",
    "name": "Jane",
    "image": "https://...",
    "school": "Stanford"
  },
  "created_at": "2025-10-15T10:30:00Z"
}

Response 404:
{ "error": "Match not found" }

Response 500:
{ "error": "Baby generation failed" }
```

#### Get Existing Baby
```
GET /api/v1/baby?match_id=<uuid>
Authorization: Bearer <token>

Response 200: (same as above)
Response 404: { "error": "No baby found for this match" }
```

---

## File Structure

```
src/features/matching/
├── api/
│   ├── generate-baby.ts           # NEW - Baby API integration
│   ├── get-user-match.ts          # Existing
│   └── react-to-match.ts          # Existing
├── components/
│   ├── match-dialog/
│   │   ├── baby-generator.tsx     # UPDATED - Real API integration
│   │   └── match-dialog.tsx       # UPDATED - Pass match ID
│   └── user-match/
│       └── university-match/
│           └── university-match-card.tsx  # UPDATED - Connect to dialog
└── store/
    └── user-matches.ts            # UPDATED - Add match ID

src/types/
└── api.ts                         # UPDATED - Add BabyApi type
```

---

## Testing Checklist

### Manual Testing
- [ ] Click "View Baby" on university match card
- [ ] Dialog opens with correct user names/photos
- [ ] Click "Generate Our Baby's Face" button
- [ ] Loading state shows for 3-5 seconds
- [ ] Baby image displays correctly
- [ ] Retry generation works
- [ ] Share functionality works
- [ ] Save functionality works
- [ ] Error states display properly
- [ ] Dialog closes correctly

### Edge Cases
- [ ] No match ID provided
- [ ] Backend API returns error
- [ ] Network timeout
- [ ] Invalid match ID
- [ ] User not authorized for match

---

## Dependencies

### Existing Dependencies (No New Installs Needed)
- `@tanstack/react-query` - Data fetching
- `zustand` - State management
- `axios` - HTTP client
- `framer-motion` - Animations
- `sonner` - Toast notifications

---

## Rollout Plan

### Phase 1: Backend Verification ✅
- Backend API endpoints already implemented
- Database schema already in place
- FAL.AI integration working

### Phase 2: Frontend Implementation (This Task)
1. Add type definitions
2. Create API integration layer
3. Update state management
4. Connect components
5. Replace placeholder with real generation

### Phase 3: Testing & Refinement
1. Manual testing on development
2. Fix any bugs
3. Optimize loading states
4. Polish animations

### Phase 4: Documentation Update
1. Update `.agent/system/project_architecture.md`
2. Update `.agent/README.md`
3. Add SOP for baby generation if needed

---

## Success Criteria

✅ User can generate AI baby from university match
✅ Real FAL.AI generated images display
✅ Loading states are smooth and informative
✅ Error handling is robust
✅ No placeholder/mock data remains
✅ Type safety maintained throughout
✅ Follows existing code patterns

---

## Related Documentation

- [Project Architecture](../system/project_architecture.md)
- [Database Schema](../system/database_schema.md)
- [README](../README.md)

---

## Notes

- FAL.AI generation takes ~3-5 seconds
- Images are hosted externally (FAL.AI CDN)
- Multiple babies per match are supported
- Baby gallery feature exists in backend but not in scope for this task
- Celebrity matches baby generation is out of scope for now (university matches only)

---

**Last Updated:** 2025-10-15
**Assigned To:** AI Assistant
**Priority:** High
