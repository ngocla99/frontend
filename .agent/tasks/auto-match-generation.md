# Auto-Match Generation on Photo Upload

**Status:** In Progress
**Priority:** High
**Created:** 2025-10-30
**Approach:** Supabase Edge Functions + pg_cron

---

## Overview

Automatically generate face similarity matches when users upload new photos. System searches for similar faces from users in the same school with opposite gender, creates match records, and updates the live match feed in real-time.

---

## Architecture: Supabase-Native Background Jobs

### Components

1. **Job Queue Table** (`match_jobs`) - Stores pending matching tasks in PostgreSQL
2. **pg_cron Extension** - Schedules Edge Function to run every minute
3. **Supabase Edge Function** (`match-generator`) - Processes jobs in Deno runtime
4. **SQL Function** (`find_similar_faces_filtered`) - Filtered vector similarity search
5. **Supabase Realtime** - Broadcasts new matches to frontend (already implemented)

### Why This Approach

✅ **No Redis needed** - Everything in Supabase PostgreSQL
✅ **Native integration** - Edge Functions have direct database access
✅ **Auto-scaling** - Edge Functions scale globally
✅ **Simpler deployment** - No separate worker processes
✅ **Built-in observability** - Supabase dashboard shows logs
✅ **Lower cost** - No additional infrastructure

---

## Requirements

### Functional Requirements

- **Automatic matching** on photo upload
- **Filter by:** Same school + opposite gender
- **Similarity threshold:** 0.5+ (50%)
- **Match limit:** Top 20 matches per upload
- **Background processing:** Non-blocking (<500ms upload response)
- **Real-time updates:** Matches appear in feed automatically
- **Silent updates:** No toast notifications

### Performance Targets

- Upload API response: <500ms
- Job processing: <10 seconds per upload
- Realtime broadcast: <1 second
- Support 1,000+ concurrent users

---

## Database Schema

### New Table: match_jobs

```sql
CREATE TABLE match_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  face_id uuid NOT NULL REFERENCES faces(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  embedding vector(512) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  error_message text,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_match_jobs_pending ON match_jobs(created_at)
WHERE status = 'pending';
```

### New SQL Function: find_similar_faces_filtered

```sql
CREATE FUNCTION find_similar_faces_filtered(
  query_embedding vector(512),
  user_school text,
  user_gender text,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 20
) RETURNS TABLE (face_id uuid, profile_id uuid, similarity float, ...)
```

Filters candidates by school/gender BEFORE similarity search for performance.

### New Index

```sql
CREATE INDEX idx_profiles_school_gender
ON profiles(school, gender)
WHERE profile_type = 'user';
```

---

## Implementation Flow

```
User uploads photo
    ↓
POST /api/faces (202 Accepted in <500ms)
    ↓
INSERT into match_jobs table (status='pending')
    ↓
[pg_cron triggers every minute]
    ↓
HTTP POST to Edge Function: match-generator
    ↓
Edge Function:
  1. Fetch next pending job
  2. Mark as 'processing'
  3. Get user profile (school, gender)
  4. Call find_similar_faces_filtered()
  5. Batch INSERT matches (upsert to handle duplicates)
  6. Mark job as 'completed'
    ↓
Supabase Realtime broadcasts INSERT on matches table
    ↓
Frontend: use-live-match-realtime.ts receives event
    ↓
Query invalidation → Auto-refetch → UI updates
```

---

## Files Created/Modified

### New Files

1. **`supabase/migrations/010_auto_matching_system.sql`**
   - Enable pg_cron extension
   - Create match_jobs table
   - Create find_similar_faces_filtered() function
   - Add performance indexes
   - Schedule pg_cron job

2. **`supabase/functions/match-generator/index.ts`**
   - Deno Edge Function
   - Processes match jobs
   - Handles retries and error logging

3. **`.agent/tasks/auto-match-generation.md`**
   - This documentation file

### Modified Files

1. **`src/app/api/faces/route.ts`** (POST handler)
   - Add: Insert job into match_jobs table after saving face
   - Change response: 202 Accepted (was 200 OK)

### No Changes Needed (Already Working)

- `src/features/matching/hooks/use-live-match-realtime.ts` - Realtime subscription
- `src/features/matching/api/get-live-match.ts` - Fetch matches
- Frontend components - Auto-update on realtime events

---

## Implementation Steps

### Step 1: Database Migration

Create `supabase/migrations/010_auto_matching_system.sql` with:
- pg_cron extension
- match_jobs table + indexes
- find_similar_faces_filtered() function
- idx_profiles_school_gender index
- pg_cron schedule (runs every minute)

### Step 2: Edge Function

Create `supabase/functions/match-generator/index.ts`:
- Fetch next pending job (LIMIT 1, ORDER BY created_at)
- Mark as processing
- Get user profile for filtering
- Call find_similar_faces_filtered RPC
- Batch upsert matches (ignore duplicates)
- Mark job as completed/failed
- Handle retry logic (max 3 attempts)

### Step 3: Update Face Upload API

Modify `src/app/api/faces/route.ts`:
- After saving face, insert into match_jobs
- Return 202 Accepted with message

### Step 4: Deploy

```bash
# Deploy migration
supabase db push

# Deploy Edge Function
supabase functions deploy match-generator

# Set secrets
supabase secrets set SUPABASE_URL=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

### Step 5: Update pg_cron with Project URL

In migration, replace placeholder with actual Supabase project URL.

---

## Testing Checklist

- [ ] Deploy migration successfully
- [ ] Deploy Edge Function successfully
- [ ] Upload photo as User A (school: UIT, gender: male)
- [ ] Verify job created in match_jobs table (status='pending')
- [ ] Wait 60 seconds for pg_cron
- [ ] Verify job status changed to 'completed'
- [ ] Verify matches created in matches table
- [ ] Check matches are only UIT females
- [ ] Verify live match feed auto-updates (no refresh)
- [ ] Upload 5+ photos concurrently → No race conditions
- [ ] Test failed job retry logic
- [ ] Monitor Edge Function logs in Supabase dashboard

---

## Error Handling

### Retry Logic
- Max attempts: 3
- Exponential backoff: 1min, 2min, 4min
- Failed jobs stay in database for debugging

### Error Scenarios
1. **No candidates found:** Job completes with 0 matches (not an error)
2. **Database error:** Retry up to 3 times
3. **Profile not found:** Mark as failed immediately
4. **Duplicate matches:** Silent skip (upsert with ignoreDuplicates)

---

## Monitoring

### Supabase Dashboard

- **Edge Function Logs:** Functions → match-generator → Invocations
- **Database:** Table Editor → match_jobs (check status distribution)

### SQL Queries

```sql
-- Check pg_cron schedule
SELECT * FROM cron.job;

-- Job queue stats
SELECT status, COUNT(*) FROM match_jobs GROUP BY status;

-- Recent jobs
SELECT * FROM match_jobs ORDER BY created_at DESC LIMIT 10;

-- Failed jobs
SELECT * FROM match_jobs WHERE status = 'failed';
```

---

## Performance Benchmarks

| Metric | Target | Measured |
|--------|--------|----------|
| Upload API response | <500ms | TBD |
| Job enqueue time | <50ms | TBD |
| Match generation | <10s | TBD |
| Vector search | <3s | TBD |
| Batch insert | <2s | TBD |
| Realtime broadcast | <1s | TBD |

---

## Success Criteria

✅ Upload photo → 202 response in <500ms
✅ Matches generate within 10 seconds
✅ Live match feed auto-updates
✅ Only same school + opposite gender
✅ Top 20 matches with 50%+ similarity
✅ No duplicate matches
✅ Handles 10+ concurrent uploads
✅ Failed jobs retry automatically

---

## Future Enhancements

1. **Batch re-matching:** Periodically regenerate all matches
2. **Smart ranking:** ML-based scoring beyond similarity
3. **Match notifications:** Optional push notifications
4. **Analytics:** Track match quality and engagement
5. **A/B testing:** Test different thresholds

---

## Related Tasks

- [Backend Migration to Next.js + Supabase](./backend-migration-nextjs-supabase-vector.md)
- [Match List by Face](./match-list-by-face.md)
- [Mutual Chat Feature](./mutual-chat-feature.md)

---

## References

- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- pg_cron: https://supabase.com/docs/guides/database/extensions/pg_cron
- pgvector: https://supabase.com/docs/guides/ai/vector-columns
