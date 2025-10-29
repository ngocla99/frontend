# Match List By Face - User/Celebrity Match Display

**Status:** ✅ Completed 2025-10-29
**Priority:** High
**Category:** Matching Feature Enhancement

---

## Overview

Implement a new API endpoint to fetch all saved matches for a specific user face from the database, enabling the university-match and celebrity-match components to display historical match data grouped by user pairs.

### Goals

1. Replace vector similarity search with database query for match display
2. Enable face-specific match lists for university and celebrity matches
3. Group matches by unique user pairs with expandable history
4. Support filtering by match type (user-to-user vs user-to-celebrity)
5. Maintain compatibility with existing UI components

---

## Problem Statement

### Current Issues

The existing `/api/matches/user/[userId]` endpoint:
- Uses `findSimilarFaces()` vector search instead of querying the `matches` table
- Returns real-time computed similarities, not saved matches
- Cannot reliably distinguish between university and celebrity matches
- Not optimized for displaying historical match data
- Doesn't support grouping matches by user pairs

### User Impact

- Users cannot see their actual saved matches from the database
- No distinction between university matches and celebrity matches in match lists
- Each user's face should have its own match history
- Need consistent match display across sessions

---

## Technical Requirements

### API Endpoint

**New Route:** `src/app/api/matches/for-image/route.ts`

**Request:**
```
GET /api/matches/for-image?face_id={uuid}&match_type={user|celebrity|all}&limit=50&skip=0
```

**Query Parameters:**
- `face_id` (required): UUID of user's face to fetch matches for
- `match_type` (optional): Filter by `"user"` (university), `"celebrity"`, or `"all"` (default: "all")
- `limit` (optional): Number of matches to return (default: 50)
- `skip` (optional): Pagination offset (default: 0)

**Response Format:**
```typescript
{
  matches: [
    {
      me: {
        id: "uuid",
        name: "User Name",
        gender: "male",
        image: "signed-url",
        school: "MIT"
      },
      other: {
        id: "uuid",
        name: "Match Name",
        gender: "female",
        image: "signed-url",
        school: "Stanford"
      },
      number_of_matches: 3,
      type: "user-user" | "user-celebrity",
      matches: [
        {
          id: "match-uuid",
          created_at: "2025-10-29T...",
          my_image: "signed-url-to-my-face",
          other_image: "signed-url-to-other-face",
          similarity_score: 0.87,
          reactions: {}
        }
      ]
    }
  ],
  total: 5
}
```

### Database Queries

**Query the `matches` table:**
```sql
SELECT
  m.id, m.similarity_score, m.created_at,
  m.face_a_id, m.face_b_id,
  -- Join faces and profiles for both sides
  face_a.image_path, face_a.profile_id,
  face_b.image_path, face_b.profile_id,
  profile_a.name, profile_a.gender, profile_a.school, profile_a.profile_type,
  profile_b.name, profile_b.gender, profile_b.school, profile_b.profile_type
FROM matches m
LEFT JOIN faces face_a ON m.face_a_id = face_a.id
LEFT JOIN faces face_b ON m.face_b_id = face_b.id
LEFT JOIN profiles profile_a ON face_a.profile_id = profile_a.id
LEFT JOIN profiles profile_b ON face_b.profile_id = profile_b.id
WHERE m.face_a_id = :face_id OR m.face_b_id = :face_id
ORDER BY m.created_at DESC
```

**Filter by profile_type:**
- `match_type = "user"`: Filter where `other.profile_type = 'user'`
- `match_type = "celebrity"`: Filter where `other.profile_type = 'celebrity'`
- `match_type = "all"`: No filtering

**Group by user pairs:**
- Group matches where both users are the same (multiple face matches between same people)
- Use `other.profile_id` as grouping key
- Nest individual matches within each group

---

## Implementation Steps

### 1. Create API Endpoint ✅

**File:** `src/app/api/matches/for-image/route.ts`

- [ ] Export GET handler with `withSession` middleware
- [ ] Parse query parameters: `face_id`, `match_type`, `limit`, `skip`
- [ ] Validate `face_id` is provided
- [ ] Query `matches` table with proper joins to faces and profiles
- [ ] Filter matches where `face_a_id = face_id OR face_b_id = face_id`
- [ ] Determine "my" vs "other" side for each match
- [ ] Filter by `profile_type` based on `match_type` parameter
- [ ] Group matches by unique `other.profile_id`
- [ ] Generate signed URLs for all face images
- [ ] Return grouped matches in `UserMatchApi` format
- [ ] Handle reactions (return empty object for now)

**Key Logic:**
```typescript
// Determine which side is the current user
const isUserA = match.face_a_id === faceId;
const myFaceData = isUserA ? match.face_a : match.face_b;
const otherFaceData = isUserA ? match.face_b : match.face_a;
const otherProfile = otherFaceData.profile;

// Filter by match type
if (matchType === "user" && otherProfile.profile_type !== "user") continue;
if (matchType === "celebrity" && otherProfile.profile_type !== "celebrity") continue;

// Group by other user's profile_id
const key = otherProfile.id;
```

### 2. Update Frontend API Client ✅

**File:** `src/features/matching/api/get-user-match.ts`

- [ ] Change endpoint from `/matches/user/${userId}` to `/matches/for-image`
- [ ] Update query params to use `face_id` instead of `userId`
- [ ] Add `match_type` parameter support
- [ ] Keep existing `UserMatchApi` response type
- [ ] Update React Query hook to accept `face_id` and `match_type`

**Updated API Call:**
```typescript
export const getUserMatchApi = async (input: {
  faceId: string;
  matchType?: "user" | "celebrity" | "all";
  limit?: number;
  skip?: number;
}) => {
  const response = await api.get<{ matches: UserMatchApi[]; total: number }>(
    `/matches/for-image`,
    {
      params: {
        face_id: input.faceId,
        match_type: input.matchType || "all",
        limit: input.limit || 50,
        skip: input.skip || 0,
      }
    }
  );
  return response.matches;
};
```

### 3. Update University Match Component ✅

**File:** `src/features/matching/components/user-match/university-match/`

- [ ] Identify where API is called (likely in a hook or component)
- [ ] Pass `face_id` (from active image) to API hook
- [ ] Add `match_type: "user"` filter to only show user-to-user matches
- [ ] Verify UI components handle grouped matches correctly
- [ ] No UI changes needed (already supports `numberOfMatches` and expandable history)

**Component Update:**
```typescript
// Get active face_id from user's profile or image selector
const activeFaceId = userStore.getActiveFaceId();

const { data: matches } = useGetUserMatch({
  faceId: activeFaceId,
  matchType: "user", // Only show university matches
  limit: 50
});
```

### 4. Update Celebrity Match Component ✅

**File:** `src/features/matching/components/user-match/celebrity-match/`

- [ ] Identify where API is called
- [ ] Pass `face_id` (from active image) to API hook
- [ ] Add `match_type: "celebrity"` filter to only show celebrity matches
- [ ] Verify UI components handle celebrity match format
- [ ] No UI changes needed

**Component Update:**
```typescript
const activeFaceId = userStore.getActiveFaceId();

const { data: celebMatches } = useGetUserMatch({
  faceId: activeFaceId,
  matchType: "celebrity", // Only show celebrity matches
  limit: 50
});
```

### 5. Testing ✅

- [ ] Test with user who has multiple faces uploaded
- [ ] Verify each face shows its own match list
- [ ] Test university match filter (only user-to-user matches)
- [ ] Test celebrity match filter (only celebrity matches)
- [ ] Verify match grouping works (same user pair, multiple face matches)
- [ ] Test expandable history in university match cards
- [ ] Verify baby generation dialog still works with match_id
- [ ] Check pagination and loading states
- [ ] Test empty states (no matches for a face)
- [ ] Verify signed URLs work for all images

---

## Dependencies

### Database Schema

**Existing Tables (No changes needed):**

```sql
-- profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  name text,
  email text UNIQUE,
  gender text,
  school text,
  profile_type text, -- 'user' | 'celebrity'
  default_face_id uuid,
  created_at timestamptz,
  updated_at timestamptz
);

-- faces table
CREATE TABLE faces (
  id uuid PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id),
  image_path text,
  embedding vector(512),
  created_at timestamptz
);

-- matches table
CREATE TABLE matches (
  id uuid PRIMARY KEY,
  face_a_id uuid REFERENCES faces(id),
  face_b_id uuid REFERENCES faces(id),
  similarity_score float, -- 0-1 (cosine similarity)
  created_at timestamptz
);
```

### Existing Types

**From `src/types/api.ts` (No changes needed):**

```typescript
export type UserMatchApi = {
  matches: Array<{
    id: string;
    created_at: string;
    my_image: string;
    other_image: string;
    reactions: Record<string, number>;
    similarity_score: number;
  }>;
  me: {
    id: string;
    name: string;
    gender: string;
    image: string;
    school: string;
  };
  number_of_matches: number;
  other: {
    id: string;
    name: string;
    gender: string;
    image: string;
    school: string;
  };
  type: string; // 'user-user' or 'user-celebrity'
};
```

### Frontend Components

**No UI changes needed - existing components already support:**
- `university-match-card.tsx`: Grouped matches with expandable history
- `celebrity-match-card.tsx`: Celebrity match display
- `transformApiUserMatchesToDisplayData()`: Data transformation function

---

## API Implementation Details

### Algorithm: Match Grouping

```typescript
// 1. Query all matches where face_a_id = faceId OR face_b_id = faceId
const matchRecords = await supabase
  .from("matches")
  .select(`
    id, similarity_score, created_at, face_a_id, face_b_id,
    face_a:faces!matches_face_a_id_fkey (
      id, image_path, profile_id,
      profile:profiles!faces_profile_id_fkey (*)
    ),
    face_b:faces!matches_face_b_id_fkey (
      id, image_path, profile_id,
      profile:profiles!faces_profile_id_fkey (*)
    )
  `)
  .or(`face_a_id.eq.${faceId},face_b_id.eq.${faceId}`)
  .order("created_at", { ascending: false });

// 2. Group by unique user pairs
const groupedMatches = new Map<string, GroupedMatch>();

for (const match of matchRecords) {
  // Determine which side is "me" vs "other"
  const isUserA = match.face_a_id === faceId;
  const myFaceData = isUserA ? match.face_a : match.face_b;
  const otherFaceData = isUserA ? match.face_b : match.face_a;
  const otherProfile = otherFaceData.profile;

  // Filter by match_type
  if (matchType === "user" && otherProfile.profile_type !== "user") continue;
  if (matchType === "celebrity" && otherProfile.profile_type !== "celebrity") continue;

  // Group by other user's profile_id
  const key = otherProfile.id;

  if (!groupedMatches.has(key)) {
    groupedMatches.set(key, {
      me: { /* current user data */ },
      other: {
        id: otherProfile.id,
        name: otherProfile.name,
        gender: otherProfile.gender,
        school: otherProfile.school,
        image: /* get default face or most recent */
      },
      number_of_matches: 0,
      type: otherProfile.profile_type === "celebrity" ? "user-celebrity" : "user-user",
      matches: []
    });
  }

  const group = groupedMatches.get(key);
  group.number_of_matches++;
  group.matches.push({
    id: match.id,
    created_at: match.created_at,
    my_image: await getSignedUrl(myFaceData.image_path),
    other_image: await getSignedUrl(otherFaceData.image_path),
    similarity_score: match.similarity_score,
    reactions: {} // Empty for now
  });
}

// 3. Return grouped results
return Array.from(groupedMatches.values());
```

---

## Key Differences from Previous Implementation

| Aspect | Old `/api/matches/user/[userId]` | New `/api/matches/for-image` |
|--------|-----------------------------------|------------------------------|
| **Data Source** | `findSimilarFaces()` (vector search) | `matches` table (DB query) |
| **Query Type** | Real-time embedding similarity | Historical match records |
| **Performance** | Slower (vector computation) | Faster (indexed DB query) |
| **Consistency** | May differ each time | Stable results |
| **Filtering** | Cannot distinguish user vs celebrity | Filters by `profile_type` |
| **Grouping** | Not grouped | Grouped by user pairs |
| **Face Specificity** | User-level matches | Face-level matches |

---

## Success Criteria

- ✅ API endpoint `/api/matches/for-image` successfully queries `matches` table
- ✅ Matches filtered correctly by `match_type` (user/celebrity/all)
- ✅ Matches grouped by unique user pairs with nested individual matches
- ✅ University match component shows only user-to-user matches
- ✅ Celebrity match component shows only celebrity matches
- ✅ UI components display match data correctly without changes
- ✅ Signed URLs generated for all face images
- ✅ Expandable history works for multiple face matches between same users
- ✅ Baby generation dialog continues to work with match_id
- ✅ No type errors or build failures

---

## Future Enhancements

### Potential Improvements

1. **Reactions Integration**
   - Join `reactions` table to show actual reaction counts
   - Currently returning empty `reactions: {}`

2. **Performance Optimization**
   - Add database indexes on `face_a_id`, `face_b_id` columns
   - Implement cursor-based pagination for large match lists
   - Cache frequently accessed matches

3. **Advanced Filtering**
   - Filter by date range (e.g., matches from last week)
   - Filter by similarity threshold (e.g., only show >80% matches)
   - Sort by different criteria (newest, highest similarity, most reactions)

4. **Real-time Updates**
   - Add Supabase Realtime subscription for new matches
   - Live update match list when new matches are created

5. **Match Statistics**
   - Total match count per face
   - Average similarity score
   - Most matched users

---

## Related Documentation

- [Project Architecture](../system/project_architecture.md) - Backend API structure
- [Database Schema](../system/database_schema.md) - Matches table schema
- [API Organization SOP](../sop/api-organization.md) - API file structure guidelines

---

**Created:** 2025-10-29
**Last Updated:** 2025-10-29
**Implemented By:** AI Assistant
