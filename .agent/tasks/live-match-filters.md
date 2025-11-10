# Live Match Filters Implementation

**Status:** ✅ Completed 2025-11-10
**Created:** 2025-11-10
**Priority:** High
**Related Docs:** [Database Schema](../system/database_schema.md) | [Project Architecture](../system/project_architecture.md)

---

## Overview

Implement filtering functionality for the live-match page to allow users to filter matches by:
- **All** - Show all matches (default)
- **New** - Show matches created within the last 5 minutes (time-based)
- **Viewed** - Show matches the user has already viewed (persistent across sessions)

---

## Current State

### What's Implemented ✅
- Filter tab UI with badges showing counts
- Filter state management (`activeFilter` state)
- Filter logic (useMemo) that checks `isNew` and `isViewed` flags
- "NEW" and "VIEWED" badges on match cards
- `reactions` table with `reaction_type` column (currently used for "like")

### What's Broken ❌
- **"New" filter:** All matches hardcoded as `isNew: true` in `transform-api-data.ts:21`
- **"Viewed" filter:** All matches hardcoded as `isViewed: false` in `transform-api-data.ts:22`
- No time-based calculation for 5-minute threshold
- No tracking of viewed status

---

## Requirements

### Functional Requirements

1. **"New" Filter (Time-based)**
   - Definition: Match created within last 5 minutes
   - Calculation: Frontend-only (check `created_at` timestamp)
   - Updates: On page load/refresh only (no auto-refresh)
   - Behavior: Time-based only (not dependent on view status)

2. **"Viewed" Filter (Backend-tracked)**
   - Definition: User clicked "View Baby" button
   - Storage: Persistent in database (survives sessions/devices)
   - Trigger: When user clicks "View Baby" link
   - Backend: Use existing `reactions` table

3. **Filter Counts**
   - Display accurate counts for each filter in badges
   - Update counts on page load/refresh (no real-time updates)

### Non-Functional Requirements

- Zero UI blocking - view tracking should be fire-and-forget
- Optimistic updates for better UX
- Reuse existing `reactions` table (no new tables)
- Maintain backward compatibility with existing "like" reactions

---

## Technical Design

### Database: Extend `reactions` Table

**Current Schema:**
```sql
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id),
  user_profile_id UUID NOT NULL REFERENCES profiles(id),
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, user_profile_id) -- ⚠️ PROBLEM: Only one reaction per match
);
```

**Problem:** The UNIQUE constraint allows only ONE reaction type per user per match. We need to support both "like" AND "viewed" for the same match.

**Solution:** Update UNIQUE constraint to include `reaction_type`:

```sql
-- Drop old constraint
ALTER TABLE reactions DROP CONSTRAINT reactions_match_id_user_profile_id_key;

-- Add new constraint (allows multiple reaction types per match)
ALTER TABLE reactions ADD CONSTRAINT reactions_match_user_type_unique
  UNIQUE(match_id, user_profile_id, reaction_type);

-- Add indexes for performance
CREATE INDEX idx_reactions_type ON reactions(reaction_type);
CREATE INDEX idx_reactions_user_type ON reactions(user_profile_id, reaction_type);
```

**Supported Reaction Types:**
- `"like"` - User favorited the match (existing)
- `"viewed"` - User viewed the match (new)

**Example Data:**
```
| id   | match_id | user_profile_id | reaction_type | created_at          |
|------|----------|-----------------|---------------|---------------------|
| uuid1| match-1  | user-a          | like          | 2025-11-10 10:00:00 |
| uuid2| match-1  | user-a          | viewed        | 2025-11-10 10:05:00 |
```

---

### Backend: API Changes

#### 1. Update `GET /api/matches/top` (Fetch Matches)

**Current:** Returns `my_reaction` as array of reaction types (empty or `["favorite"]`)

**Change:** Return ALL reaction types for current user:

```typescript
// In route.ts
const { data: matches } = await supabase
  .from("matches")
  .select(`
    *,
    reactions!inner(reaction_type)
  `)
  .eq("reactions.user_profile_id", session.profile.id);

// Transform to include reaction_types array
const formattedMatches = matches.map(match => ({
  ...match,
  my_reaction: match.reactions?.map(r => r.reaction_type) || []
}));
```

**Response Example:**
```json
{
  "id": "match-123",
  "created_at": "2025-11-10T10:00:00Z",
  "my_reaction": ["like", "viewed"],
  ...
}
```

#### 2. Update `POST /api/matches/[matchId]/react` (Add Reaction)

**Current Behavior:**
- If reaction exists → Update it
- If not → Insert new

**Problem:** This prevents having multiple reaction types per match.

**New Behavior:**
- Always INSERT (let UNIQUE constraint prevent duplicates per type)
- Remove the "update existing reaction" logic

**Code Changes:**
```typescript
// REMOVE lines 34-64 (the "update existing" logic)

// Keep only the INSERT logic:
const { data: reaction, error } = await supabase
  .from("reactions")
  .insert({
    match_id: matchId,
    user_profile_id: session.profile.id,
    reaction_type, // Can be "like", "viewed", etc.
  })
  .select()
  .single();

// Handle duplicate error gracefully (409 Conflict)
if (error?.code === '23505') {
  return NextResponse.json(
    { message: "Reaction already exists" },
    { status: 409 }
  );
}
```

#### 3. Create `POST /api/matches/[matchId]/view` (Track View)

**New Endpoint:** Convenience endpoint for tracking views.

**File:** `src/app/api/matches/[matchId]/view/route.ts`

```typescript
import { NextResponse } from "next/server";
import { withSession } from "@/lib/middleware/with-session";

/**
 * POST /api/matches/[matchId]/view - Mark match as viewed
 */
export const POST = withSession(async ({ params, session, supabase }) => {
  const matchId = params.matchId;

  // Insert "viewed" reaction (idempotent - fails silently if exists)
  const { error } = await supabase
    .from("reactions")
    .insert({
      match_id: matchId,
      user_profile_id: session.profile.id,
      reaction_type: "viewed",
    });

  // Ignore duplicate errors (already viewed)
  if (error && error.code !== '23505') {
    throw error;
  }

  return NextResponse.json({
    success: true,
    match_id: matchId,
    already_viewed: error?.code === '23505'
  });
});
```

---

### Frontend: Data Transformation

#### Update `transform-api-data.ts`

**File:** `src/features/matching/utils/transform-api-data.ts`

**Current (Lines 20-22):**
```typescript
isNew: true, // ❌ HARDCODED
isViewed: false, // ❌ HARDCODED
```

**Fixed:**
```typescript
const transformApiMatchToDisplayData = (apiMatch: LiveMatchApi): MatchCardData => {
  // Calculate if match is "new" (created within last 5 minutes)
  const now = Date.now();
  const createdAt = new Date(apiMatch.created_at).getTime();
  const fiveMinutesInMs = 5 * 60 * 1000;
  const isNew = (now - createdAt) < fiveMinutesInMs;

  // Check if user has viewed this match
  const isViewed = apiMatch.my_reaction?.includes("viewed") ?? false;

  // Check if user has favorited this match
  const isFavorited = apiMatch.my_reaction?.includes("like") ?? false;

  return {
    id: apiMatch.id,
    user1: { /* ... */ },
    user2: { /* ... */ },
    matchPercentage: apiMatch.similarity_percentage,
    timestamp: getTimeAgo(apiMatch.created_at),
    isNew,
    isViewed,
    isFavorited,
  };
};
```

---

### Frontend: View Tracking

#### 1. Create API Client

**File:** `src/features/matching/api/mark-match-viewed.ts`

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";

export const markMatchViewedApi = (matchId: string) => {
  return api.post(`/matches/${matchId}/view`);
};

export const useMarkMatchViewed = (
  config?: MutationConfig<typeof markMatchViewedApi>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markMatchViewedApi,
    onSuccess: () => {
      // Invalidate queries to refresh viewed status
      queryClient.invalidateQueries({
        queryKey: ["matching", "top"],
      });
    },
    ...config,
  });
};
```

#### 2. Update Match Card

**File:** `src/features/matching/components/live-match/match-card.tsx`

**Add hook:**
```typescript
import { useMarkMatchViewed } from "@/features/matching/api/mark-match-viewed";

// Inside component
const { mutate: markViewed } = useMarkMatchViewed();
```

**Update "View Baby" onClick:**
```typescript
const handleViewBaby = () => {
  // Fire-and-forget view tracking
  markViewed(data.id);

  // Existing logic to open baby dialog
  setMatchId(data.id);
};
```

---

### Frontend: Badge Update Strategy

#### Decision: No Auto-Refresh (Simpler Implementation)

**Behavior:**
- "NEW" badge calculated on page load based on `created_at` timestamp
- Badge stays visible until user manually refreshes the page
- Filter counts update on data refresh only

**Trade-offs:**
- ✅ Simpler code (no timers, no background tasks)
- ✅ Better performance (no periodic re-renders)
- ✅ Easier to maintain
- ⚠️ Badge may become stale if page left open for >5 minutes
- ⚠️ User must pull-to-refresh to see accurate "NEW" status

**User Experience:**
- Most users refresh/scroll frequently on mobile
- Pull-to-refresh pattern is intuitive
- Infinite scroll will fetch fresh data with accurate timestamps

**Future Enhancement:**
If real-time updates are needed, implement Supabase Realtime subscriptions to push new matches as they're created (better than polling with intervals).

---

## Implementation Steps

### Phase 1: Database Migration ✅ COMPLETED
- [x] Create migration file `update_reactions_table_for_multiple_types`
- [x] Drop old UNIQUE constraint
- [x] Add new UNIQUE constraint with `reaction_type`
- [x] Add performance indexes
- [x] Test migration on development database

### Phase 2: Backend API ✅ COMPLETED
- [x] Update `GET /api/matches/top` to return `my_reaction` array
- [x] Update `POST /api/matches/[matchId]/react` to allow multiple reactions
- [x] Create `POST /api/matches/[matchId]/view` endpoint
- [x] Update DELETE and GET endpoints for multiple reactions

### Phase 3: Frontend Data Layer ✅ COMPLETED
- [x] Update `LiveMatchApi` type to use `my_reaction: string[]`
- [x] Fix `transform-api-data.ts` with time-based `isNew` calculation (5 minutes)
- [x] Fix `isViewed` to check `my_reaction.includes("viewed")`
- [x] Fix `isFavorited` to check `my_reaction.includes("like")`

### Phase 4: Frontend UI ✅ COMPLETED
- [x] Create `mark-match-viewed.ts` API client
- [x] Add `useMarkMatchViewed` hook to match-card
- [x] Call `markViewed()` on "View Baby" click
- [x] Build passes with zero TypeScript errors

### Phase 5: Testing Filter Logic ⚠️ MANUAL TESTING REQUIRED
- [ ] Test "New" filter calculation with different timestamps
- [ ] Test "Viewed" filter after marking match as viewed
- [ ] Test "All" filter shows all matches

### Phase 6: Testing ⚠️ MANUAL TESTING REQUIRED
- [ ] Create new match, verify NEW badge appears
- [ ] Wait 5+ minutes (or refresh page), verify NEW badge disappears
- [ ] Click "View Baby", verify VIEWED badge appears
- [ ] Refresh page, verify viewed status persists
- [ ] Test filter counts update correctly
- [ ] Test all three filters show correct matches
- [ ] Test favorite still works (backward compatibility)
- [ ] Test on mobile devices

### Phase 7: Documentation ✅ COMPLETED
- [x] Update `.agent/system/database_schema.md`
- [x] Document new `reactions` constraint
- [x] List supported reaction types
- [x] Update this task doc with completion date

---

## Testing Scenarios

### Test Case 1: New Match Badge
**Given:** A match was created 2 minutes ago
**When:** User opens live-match page
**Then:** Match should display "NEW" badge
**And:** "New (1)" filter should show count of 1

### Test Case 2: Expired New Badge
**Given:** A match was created 7 minutes ago
**When:** User opens/refreshes live-match page
**Then:** Match should NOT display "NEW" badge
**And:** "New (0)" filter should show count of 0

### Test Case 3: View Tracking
**Given:** User has not viewed a match yet
**When:** User clicks "View Baby" button
**Then:** "VIEWED" badge should appear on the card
**And:** "Viewed (1)" filter should increment

### Test Case 4: Viewed Persistence
**Given:** User viewed a match in previous session
**When:** User closes browser and reopens app
**Then:** Match should still show "VIEWED" badge
**And:** "Viewed" filter should still include the match

### Test Case 5: Multiple Reactions
**Given:** User viewed and favorited the same match
**When:** User opens live-match page
**Then:** Match should show both "VIEWED" badge AND heart icon
**And:** Both reactions should be in database

### Test Case 6: Pull-to-Refresh
**Given:** User has page open with stale "NEW" badges
**When:** User pulls down to refresh the page
**Then:** NEW badges should update based on current time
**And:** Filter counts should reflect accurate numbers

---

## Edge Cases

### Edge Case 1: Race Condition
**Scenario:** User clicks "View Baby" twice rapidly
**Expected:** Only one "viewed" reaction created (UNIQUE constraint prevents duplicates)
**Handling:** API returns 409 Conflict on second request (handled gracefully)

### Edge Case 2: Clock Skew
**Scenario:** Server clock ahead of client by 2 minutes
**Impact:** Match might not show as "NEW" even though recently created
**Mitigation:** Use server timestamp (`created_at`) for calculations, not client time

### Edge Case 3: Timezone Issues
**Scenario:** User in different timezone
**Handling:** All timestamps stored as UTC in database (`timestamptz`)

---

## Performance Considerations

### Database
- **Indexes:** Added on `reaction_type` and `(user_profile_id, reaction_type)` for fast lookups
- **Query Cost:** JOIN with reactions table adds minimal overhead (indexed foreign keys)
- **Growth:** Reactions table will grow 2x (like + viewed), still manageable

### Frontend
- **Filter Calculation:** O(n) where n = number of matches (acceptable for <1000 matches)
- **Optimistic Updates:** Used in `useMarkMatchViewed` for instant UI feedback
- **No Background Tasks:** No timers or intervals running (better battery life on mobile)

---

## Breaking Changes

### API Changes
- ⚠️ `my_reaction` changes from `string[]` → may affect existing code
- ⚠️ POST `/api/matches/[matchId]/react` no longer updates existing reactions

### Database Changes
- ⚠️ UNIQUE constraint changed - migration required
- ✅ Backward compatible - existing "like" reactions preserved

---

## Rollback Plan

If issues arise post-deployment:

1. **Revert Migration:**
   ```sql
   ALTER TABLE reactions DROP CONSTRAINT reactions_match_user_type_unique;
   ALTER TABLE reactions ADD CONSTRAINT reactions_match_id_user_profile_id_key
     UNIQUE(match_id, user_profile_id);
   DELETE FROM reactions WHERE reaction_type = 'viewed';
   ```

2. **Revert Code:**
   - Restore `transform-api-data.ts` to hardcoded values
   - Remove view tracking endpoint
   - Revert API changes

---

## Future Enhancements

### Real-time "New" Matches
- Use Supabase Realtime subscriptions to push new matches
- Eliminate need for pull-to-refresh

### Additional Reaction Types
- `"hide"` - User dismissed match
- `"report"` - User reported inappropriate content
- `"super_like"` - Premium reaction

### Analytics
- Track view-to-favorite conversion rate
- Measure time-to-view for matches
- Identify most engaging match types

---

## Related Documentation

- [Database Schema](../system/database_schema.md) - Full schema reference
- [Project Architecture](../system/project_architecture.md) - System overview
- [API Organization SOP](../sop/api-organization.md) - API file structure guidelines

---

## Changelog

| Date | Author | Changes |
|------|--------|---------|
| 2025-11-10 | Claude | Initial task creation |
| 2025-11-10 | Claude | Implementation completed - all phases done except manual testing |
| 2025-11-10 | Claude | Fixed badge count display bug - "All" now shows `totalMatches` instead of `newMatches + viewedMatches` |
| 2025-11-10 | Claude | Fixed API error handling in view endpoint + added optimistic updates for instant UI feedback |

---

## Implementation Summary

### ✅ Completed Changes

**Database (Migration: `update_reactions_table_for_multiple_types`):**
- Updated `reactions` table UNIQUE constraint to allow multiple reaction types per match
- Added indexes for `reaction_type` and `(user_profile_id, reaction_type)`
- Supports reaction types: "like", "viewed"

**Backend API:**
- Updated `GET /api/matches/top` to return `my_reaction: string[]` with user's reactions
- Updated `POST /api/matches/[matchId]/react` to support multiple reactions (no longer updates existing)
- Created `POST /api/matches/[matchId]/view` endpoint for tracking viewed status
- Updated DELETE endpoint to support reaction_type query param
- Updated GET endpoint to return all reactions for a match

**Frontend Types:**
- Updated `LiveMatchApi` type: `my_reaction` now `string[]` instead of `Reaction[]`
- Added `ReactionType` type: `"like" | "viewed"`

**Frontend Logic:**
- Fixed `transform-api-data.ts`:
  - `isNew`: Calculated as `(now - created_at) < 5 minutes`
  - `isViewed`: Checks `my_reaction.includes("viewed")`
  - `isFavorited`: Checks `my_reaction.includes("like")`
- Created `mark-match-viewed.ts` API client with `useMarkMatchViewed()` hook
- Updated `match-card.tsx` to call `markViewed(id)` when "View Baby" clicked

**Documentation:**
- Updated `.agent/system/database_schema.md` with new reactions schema
- Updated `.agent/tasks/live-match-filters.md` with implementation details

### ⚠️ Manual Testing Required

Please test the following:
1. Open live-match page and verify filters work correctly
2. Create/view a recent match (<5 min) - should show NEW badge
3. Wait 5+ minutes and refresh - NEW badge should disappear
4. Click "View Baby" - VIEWED badge should appear
5. Refresh page - viewed status should persist
6. Test all three filters: All, New, Viewed
7. Verify filter counts are accurate
8. Test that favorites still work

### 🚀 How to Test

```bash
# Run development server
bun run dev

# Navigate to http://localhost:3000/live-matches
# Test the filters and badges
```

---

**Status:** ✅ Implementation Complete - Ready for Manual Testing
