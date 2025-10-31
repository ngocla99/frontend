# Auto-Match Generation - Deployment Guide

This guide walks through deploying the automatic face matching system that generates matches in the background when users upload photos.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- [x] Supabase CLI installed (`npm install -g supabase`)
- [x] Supabase project with pgvector extension enabled
- [x] Python AI service running (for face embedding extraction)
- [x] Access to Supabase Dashboard (for configuration)

---

## 🚀 Deployment Steps

### Step 1: Deploy Database Migration

Run the SQL migration to create the job queue and matching functions:

```bash
cd D:\Code\Practice\Freelancer\ai-matching\web

# Push migration to Supabase
supabase db push
```

**What this creates:**
- ✅ `match_jobs` table for job queue
- ✅ `find_similar_faces_filtered()` SQL function
- ✅ Performance indexes for school/gender filtering
- ✅ pg_cron jobs for automated processing
- ✅ Cleanup function for old jobs

**Verify migration:**
```sql
-- In Supabase SQL Editor
SELECT * FROM cron.job WHERE jobname IN ('process-match-jobs', 'cleanup-match-jobs');
```

---

### Step 2: Configure pg_cron URLs

The migration contains a placeholder that must be updated:

1. Open Supabase Dashboard → Settings → API
2. Copy your **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
3. Update the migration file or run this SQL:

```sql
-- Update the pg_cron job with your actual project URL
SELECT cron.unschedule('process-match-jobs');

SELECT cron.schedule(
  'process-match-jobs',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/match-generator',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('source', 'pg_cron', 'triggered_at', now())
    ) as request_id;
  $$
);
```

**Replace `YOUR_PROJECT_REF` with your actual project reference!**

---

### Step 3: Set Service Role Key for pg_cron

pg_cron needs access to your service role key to call the Edge Function:

```sql
-- Run this in Supabase SQL Editor
ALTER DATABASE postgres
SET app.settings.service_role_key TO 'YOUR_SERVICE_ROLE_KEY_HERE';

-- Verify it's set
SELECT current_setting('app.settings.service_role_key');
```

**Get your service role key:**
1. Supabase Dashboard → Settings → API
2. Copy **service_role** key (starts with `eyJ...`)
3. Paste it in the SQL above

**⚠️ Security Note:** The service role key has admin privileges. Only use it in secure database settings, never expose it in client code.

---

### Step 4: Deploy Edge Function

Deploy the match-generator Edge Function:

```bash
cd D:\Code\Practice\Freelancer\ai-matching\web

# Deploy Edge Function
supabase functions deploy match-generator

# Set required secrets
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Verify deployment:**
```bash
# Check function is deployed
supabase functions list

# View recent logs
supabase functions logs match-generator --tail
```

---

### Step 5: Deploy Updated Next.js API

The face upload API has been updated to queue matching jobs. Deploy your Next.js app:

```bash
# If using Vercel
vercel --prod

# Or build locally
bun run build
```

**Key changes:**
- `POST /api/faces` now queues a job in `match_jobs` table
- Returns **202 Accepted** (was 201 Created)
- Response includes: `"message": "Photo uploaded! Matches generating in background..."`

---

## ✅ Testing & Verification

### Test 1: Upload Photo & Check Job Queue

1. Upload a photo via your app or API:
```bash
curl -X POST http://localhost:3000/api/faces \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -F "file=@/path/to/photo.jpg"
```

2. Check job was queued:
```sql
SELECT * FROM match_jobs ORDER BY created_at DESC LIMIT 5;
```

Expected result: Status = 'pending'

---

### Test 2: Verify pg_cron Triggers

Wait 60 seconds, then check:

```sql
-- Check job status changed
SELECT id, status, created_at, completed_at
FROM match_jobs
ORDER BY created_at DESC
LIMIT 5;
```

Expected: Status changed from 'pending' → 'completed'

```sql
-- Check matches were created
SELECT * FROM matches
WHERE face_a_id IN (SELECT face_id FROM match_jobs ORDER BY created_at DESC LIMIT 1)
   OR face_b_id IN (SELECT face_id FROM match_jobs ORDER BY created_at DESC LIMIT 1);
```

Expected: 0-20 new match records

---

### Test 3: Verify Realtime Updates

1. Open your app's live match feed page
2. Upload a photo from another user account (same school, opposite gender)
3. Wait 10-60 seconds
4. **Expected:** New matches appear automatically without refresh

---

### Test 4: Manual Edge Function Trigger

Test the Edge Function directly:

```bash
curl -i --location --request POST \
  'https://your-project.supabase.co/functions/v1/match-generator' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"source":"manual_test"}'
```

**Expected response:**
```json
{
  "success": true,
  "message": "Matches generated successfully" or "No pending jobs",
  "processed": true,
  "matchCount": 15
}
```

---

## 📊 Monitoring

### Dashboard Monitoring

**Supabase Dashboard:**
- Functions → match-generator → Invocations (view logs)
- Table Editor → match_jobs (check queue status)
- Database → Extensions → pg_cron (verify schedule)

### SQL Monitoring Queries

```sql
-- Job queue statistics
SELECT status, COUNT(*) as count
FROM match_jobs
GROUP BY status;

-- Recent jobs
SELECT
  id,
  status,
  attempts,
  created_at,
  completed_at,
  completed_at - created_at as processing_time
FROM match_jobs
ORDER BY created_at DESC
LIMIT 10;

-- Failed jobs (for debugging)
SELECT * FROM match_jobs
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Average processing time
SELECT
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds
FROM match_jobs
WHERE status = 'completed'
  AND completed_at IS NOT NULL;

-- pg_cron job status
SELECT * FROM cron.job;

-- pg_cron run history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### Edge Function Logs

```bash
# View real-time logs
supabase functions logs match-generator --tail

# View last 100 logs
supabase functions logs match-generator --limit 100
```

---

## 🔧 Troubleshooting

### Issue: Jobs stuck in 'pending' status

**Possible causes:**
1. pg_cron not triggering
2. Edge Function URL incorrect
3. Service role key not set

**Solution:**
```sql
-- Check pg_cron job exists
SELECT * FROM cron.job WHERE jobname = 'process-match-jobs';

-- Check service role key is set
SELECT current_setting('app.settings.service_role_key');

-- Manually trigger Edge Function to test
SELECT net.http_post(
  url := 'https://YOUR_PROJECT.supabase.co/functions/v1/match-generator',
  headers := jsonb_build_object('Content-Type', 'application/json')
);
```

---

### Issue: Edge Function returns 500 error

**Check logs:**
```bash
supabase functions logs match-generator --tail
```

**Common errors:**
- "Profile not found" → User deleted after job created
- "Search failed" → pgvector index issue
- "Insert failed" → Duplicate match constraint

**Solution:** Check error_message in match_jobs table:
```sql
SELECT id, error_message FROM match_jobs WHERE status = 'failed';
```

---

### Issue: No matches generated (matchCount = 0)

**This is not an error!** It means:
- No users match the filters (same school + opposite gender)
- Or no faces have >50% similarity

**Verify filters:**
```sql
SELECT school, gender FROM profiles WHERE id = 'USER_ID';

-- Check how many potential matches exist
SELECT COUNT(*) FROM profiles
WHERE school = 'UIT'
  AND gender = 'female'
  AND profile_type = 'user';
```

---

### Issue: Matches appear slowly

**Expected latency:** 10-60 seconds from upload to match visibility

**Breakdown:**
- Upload API: <500ms
- Job queued: <50ms
- Wait for pg_cron: 0-60s (runs every minute)
- Edge Function processing: 2-10s
- Realtime broadcast: <1s

**To reduce latency:**
- Increase pg_cron frequency (e.g., every 30 seconds)
- Optimize HNSW index parameters
- Add database connection pooling

---

## 🎯 Performance Tuning

### Adjust pg_cron Frequency

```sql
-- Process jobs every 30 seconds (instead of 60)
SELECT cron.unschedule('process-match-jobs');
SELECT cron.schedule(
  'process-match-jobs',
  '*/30 * * * * *',  -- Every 30 seconds (uses seconds field)
  $$ ... $$
);
```

**Note:** More frequent = higher database load

---

### Tune Similarity Threshold

Default: 0.5 (50% similarity)

**Lower threshold = more matches:**
```sql
-- In Edge Function or SQL function
match_threshold: 0.4  -- 40% similarity (more lenient)
```

**Higher threshold = fewer, better matches:**
```sql
match_threshold: 0.65  -- 65% similarity (stricter)
```

---

### Optimize Vector Search

```sql
-- Increase HNSW index parameters for faster search
ALTER INDEX faces_embedding_hnsw_idx SET (ef_search = 100);

-- Or rebuild with better parameters
DROP INDEX faces_embedding_hnsw_idx;
CREATE INDEX faces_embedding_hnsw_idx
ON faces USING hnsw (embedding vector_cosine_ops)
WITH (m = 32, ef_construction = 128);
```

---

## 📈 Scaling Considerations

### Current Capacity

- **Users:** 1,000-10,000
- **Jobs/minute:** 60 (one per cron run)
- **Concurrent uploads:** Unlimited (queued)

### If You Exceed Capacity

**Symptoms:**
- Jobs piling up in 'pending' status
- Matches taking >5 minutes to appear

**Solutions:**

1. **Process multiple jobs per cron run:**
```typescript
// In Edge Function
for (let i = 0; i < 10; i++) {
  const job = await fetchNextJob();
  if (!job) break;
  await processJob(job);
}
```

2. **Run pg_cron more frequently:**
```sql
'*/30 * * * * *'  -- Every 30 seconds
```

3. **Add more Edge Function instances:**
```sql
-- Schedule multiple workers
SELECT cron.schedule('process-match-jobs-1', ...);
SELECT cron.schedule('process-match-jobs-2', ...);
```

4. **Use database connection pooling** (Supavisor)

---

## 🔒 Security Checklist

- [x] Service role key stored in database settings (not code)
- [x] Edge Function uses service role authentication
- [x] RLS policies enabled on match_jobs table
- [x] Users can only view their own jobs
- [x] No sensitive data in Edge Function logs

---

## 🎉 Success Criteria

You'll know it's working when:

✅ User uploads photo → Gets 202 response immediately
✅ Job appears in match_jobs table with status='pending'
✅ Within 60 seconds, status changes to 'completed'
✅ Matches appear in matches table (0-20 records)
✅ Live match feed updates automatically (no refresh)
✅ Matches are same school + opposite gender
✅ Edge Function logs show successful processing

---

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [pg_cron Extension Guide](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [pgvector Performance Tuning](https://supabase.com/docs/guides/ai/vector-columns)
- [Task Documentation](.agent/tasks/auto-match-generation.md)

---

## 🆘 Getting Help

If you encounter issues:

1. Check Edge Function logs first
2. Query match_jobs table for error messages
3. Verify pg_cron is running
4. Test Edge Function manually
5. Check Supabase Dashboard for alerts

**Still stuck?** Create an issue with:
- Error message from logs
- SQL query showing job status
- Steps to reproduce
