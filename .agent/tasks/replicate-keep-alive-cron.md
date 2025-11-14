# Replicate Model Keep-Alive Cron Job

**Status:** Completed
**Priority:** High
**Created:** 2025-11-13
**Approach:** Supabase Edge Function + pg_cron to prevent cold starts

---

## Overview

Implements an automated keep-alive system for the Replicate face-analysis model to eliminate cold starts (3-8 minutes) by sending periodic prediction requests every 2 minutes. This ensures the model container stays warm and provides instant predictions (3-4 seconds) for actual user requests.

### Problem Statement

The Replicate model `ngocla99/face-analysis` has significant cold start times:
- **Cold Start**: 3-8 minutes (when container is shut down)
- **Warm Prediction**: 3-4 seconds (when container is running)
- **Container Idle Timeout**: ~2-5 minutes
- **Actual Prediction Time**: ~300ms per request

Without keep-alive, every user request after idle periods experiences painful 3-8 minute delays.

### Solution

Schedule a lightweight Supabase Edge Function to ping the Replicate API every 2 minutes, keeping the container perpetually warm. The 2-minute interval ensures we ping before the container timeout (2-5 minutes), providing a safety margin while keeping costs minimal.

---

## Requirements

### Functional Requirements

1. Send prediction request to Replicate every 2 minutes
2. Use minimal test image to reduce processing time
3. Run 24/7 without manual intervention
4. Log all requests for monitoring
5. Handle errors gracefully without failing
6. Cost-effective (< $2/month)

### Technical Requirements

1. Supabase Edge Function (Deno runtime)
2. pg_cron extension for scheduling
3. Replicate API token in environment variables
4. CORS-compliant responses
5. Proper error handling and logging

---

## Architecture

```
┌─────────────┐       ┌──────────────┐       ┌─────────────────┐
│  pg_cron    │       │   Supabase   │       │   Replicate     │
│  Scheduler  │──────>│ Edge Function│──────>│  face-analysis  │
│ (every 2min)│       │  (HTTP POST) │       │     Model       │
└─────────────┘       └──────────────┘       └─────────────────┘
                            │
                            ▼
                      ┌──────────────┐
                      │  Logs &      │
                      │  Monitoring  │
                      └──────────────┘
```

---

## Implementation

### Files Created

1. **Edge Function**: `web/supabase/functions/replicate-keep-alive/index.ts`
2. **Migration**: `web/supabase/migrations/025_replicate_keep_alive.sql`
3. **Documentation**: `web/.agent/tasks/replicate-keep-alive-cron.md` (this file)

### Edge Function Logic

```typescript
// Key components:
- CORS handling for preflight requests
- Replicate API authentication via REPLICATE_API_TOKEN
- Minimal test image for quick processing
- Comprehensive error handling
- Detailed logging for monitoring
- JSON response with success/error status
```

### Cron Schedule

```sql
-- Pattern: */2 * * * * (every 2 minutes)
-- Frequency: 720 times per day (30 times per hour)
-- Uses: net.http_post to call Edge Function
-- Authentication: Hardcoded service_role JWT token (valid until 2035-05-25)
-- Note: Token is embedded directly in SQL, not via app.settings (which doesn't work in pg_cron context)
-- Rationale: 2-minute interval ensures ping before container timeout (2-5 min window)
```

### Model Information

- **Model**: `ngocla99/face-analysis`
- **Version**: `eca7af967ef6eb1d8b3c02274421eaff1ebaa9a5ab9a1404d9b0eccfb29a8e48`
- **Test Image**: Lightweight face photo for minimal processing
- **Performance**: ~3.7 seconds per prediction when warm

---

## Deployment Steps

### 1. Deploy Edge Function

```bash
cd web
supabase functions deploy replicate-keep-alive
```

Expected output:
```
Deploying function replicate-keep-alive...
✓ Function deployed successfully
```

### 2. Set Environment Variables

```bash
# Get your Replicate API token from https://replicate.com/account/api-tokens
supabase secrets set REPLICATE_API_TOKEN=r8_your_token_here
```

Verify:
```bash
supabase secrets list
```

### 3. Apply Migration

```bash
# Push migration to database
supabase db push

# Or apply specific migration
psql -f supabase/migrations/025_replicate_keep_alive.sql
```

### 4. Verify Cron Job

```sql
-- Check cron job is scheduled
SELECT jobname, schedule, active, command
FROM cron.job
WHERE jobname = 'replicate-keep-alive';
```

Expected result:
```
jobname              | schedule      | active | command
---------------------|---------------|--------|------------------
replicate-keep-alive | */3 * * * *   | t      | SELECT net.http...
```

### 5. Test Manually

```bash
# Test Edge Function directly
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://lsbzbltpmmtplakdrjvq.supabase.co/functions/v1/replicate-keep-alive
```

Expected response:
```json
{
  "success": true,
  "message": "Keep-alive ping sent successfully",
  "prediction": {
    "id": "abc123...",
    "status": "starting",
    "model": "ngocla99/face-analysis"
  },
  "timestamp": "2025-11-13T10:30:00.000Z",
  "duration_ms": 1234
}
```

### 6. Monitor Logs

```bash
# Real-time logs
supabase functions logs replicate-keep-alive --tail

# Last 100 lines
supabase functions logs replicate-keep-alive --limit 100
```

---

## Monitoring

### SQL Queries

#### View Recent Executions

```sql
SELECT
  start_time,
  end_time,
  status,
  return_message,
  (end_time - start_time) as duration
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'replicate-keep-alive')
ORDER BY start_time DESC
LIMIT 20;
```

#### Check Execution Frequency

```sql
SELECT
  COUNT(*) as executions_last_hour,
  MIN(start_time) as first_run,
  MAX(start_time) as last_run
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'replicate-keep-alive')
  AND start_time > now() - interval '1 hour';
```

Expected: ~30 executions per hour (every 2 minutes)

#### View Failed Executions

```sql
SELECT
  start_time,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'replicate-keep-alive')
  AND status = 'failed'
ORDER BY start_time DESC
LIMIT 10;
```

### Supabase Dashboard

1. Go to **Functions** → **replicate-keep-alive**
2. View **Invocations** tab for execution history
3. Check **Logs** for detailed output
4. Monitor **Error Rate** graph

### Replicate Dashboard

1. Visit https://replicate.com/ngocla99/face-analysis
2. Check **Predictions** tab
3. Verify predictions are running every 2 minutes
4. Monitor costs in **Billing** section (expect ~$1.46/month)

---

## Cost Analysis

### Breakdown

- **Prediction Time**: ~300ms (0.3 seconds) per call
- **Replicate Cost**: $0.000225/second (GPU T4)
- **Cost Per Call**: 0.3s × $0.000225 = **$0.0000675**
- **Frequency**: 720 calls/day (every 2 minutes × 24 hours)
- **Daily Cost**: 720 × $0.0000675 = **$0.0486/day**
- **Monthly Cost**: $0.0486 × 30 = **~$1.46/month**

### Interval Comparison

| Interval | Calls/Day | Cost/Month | Cold Start Risk |
|----------|-----------|------------|----------------|
| `*/3` (3 min) | 480 | $0.97 | HIGH - Container may timeout |
| `*/2` (2 min) | 720 | $1.46 | LOW - Safe margin before timeout |
| `*/1.5` (90 sec) | 960 | $1.94 | VERY LOW - Maximum reliability |
| `*/1` (1 min) | 1,440 | $2.92 | MINIMAL - Overkill but cheap |

### Full Comparison

| Option | Cost/Month | Cold Starts | Notes |
|--------|------------|-------------|-------|
| No keep-alive | $0 | Every request after 2-5 min idle | Unacceptable UX |
| 2-min keep-alive | **$1.46** | None | **CHOSEN - Best cost/reliability** |
| 1-min keep-alive | $2.92 | None | Overkill but still very affordable |
| Always-on deployment | ~$583 | None | 400x more expensive |

**Chosen**: 2-minute interval for optimal cost/reliability balance at < $2/month

---

## Error Handling

### Edge Function Errors

1. **Missing API Token**
   - Error: "REPLICATE_API_TOKEN environment variable not set"
   - Fix: Run `supabase secrets set REPLICATE_API_TOKEN=...`

2. **Replicate API Error**
   - Error: "Replicate API error (401): Unauthorized"
   - Fix: Verify API token is valid

3. **Network Timeout**
   - Error: Request timeout after 30 seconds
   - Fix: Increase timeout in migration or investigate Replicate status

4. **Invalid Model Version**
   - Error: "Model version not found"
   - Fix: Update version ID in Edge Function

### Cron Job Errors

1. **Job Not Running**
   - Check: `SELECT * FROM cron.job WHERE jobname = 'replicate-keep-alive'`
   - Fix: Ensure `active = true`

2. **No Executions**
   - Check: `SELECT * FROM cron.job_run_details WHERE jobid = ...`
   - Fix: Verify pg_cron extension is enabled

3. **HTTP Post Failures**
   - Check: `return_message` in `cron.job_run_details`
   - Fix: Verify service role JWT token is valid and not expired

4. **Configuration Parameter Error**
   - Error: `unrecognized configuration parameter "app.settings.service_role_key"`
   - Cause: Trying to use `current_setting()` which doesn't work in pg_cron context
   - Fix: Use hardcoded JWT token directly in the SQL (as implemented in migration)

---

## Testing Checklist

- [x] Edge Function deploys successfully
- [x] Secrets are set correctly
- [x] Manual test returns success
- [x] Cron job is scheduled
- [x] Cron job executes every 3 minutes
- [x] Replicate predictions are created
- [x] Logs show successful pings
- [x] Error handling works (test with invalid token)
- [x] CORS headers allow browser requests
- [x] Cost tracking shows expected usage

---

## Troubleshooting

### Model Still Has Cold Starts

**Symptoms**: First prediction still takes 3-8 minutes

**Possible Causes**:
1. Cron job not running (check `cron.job`)
2. Edge Function failing silently (check logs)
3. Replicate changed idle timeout (< 3 minutes)

**Solutions**:
1. Verify cron executions in last hour (should be ~20)
2. Check Edge Function logs for errors
3. Reduce interval to 2 minutes if needed

### High Replicate Costs

**Symptoms**: Monthly bill > $15

**Possible Causes**:
1. Predictions taking longer than 3.7 seconds
2. Additional user traffic beyond keep-alive
3. Using more expensive GPU

**Solutions**:
1. Check prediction duration in Replicate dashboard
2. Separate keep-alive costs from user costs
3. Verify GPU is T4 (not A100)

### Supabase Timeout Errors

**Symptoms**: "Request timeout after 30 seconds"

**Possible Causes**:
1. Replicate API slow to respond
2. Cold start still happening
3. Network issues

**Solutions**:
1. Increase timeout to 60 seconds in migration
2. Check Replicate status page
3. Add retry logic to Edge Function

---

## Success Criteria

- [x] Edge Function deployed and callable
- [x] Cron job scheduled every 3 minutes
- [x] Model stays warm (predictions < 5 seconds)
- [x] No cold starts during normal usage
- [x] Costs under $15/month
- [x] Monitoring queries work
- [x] Error handling tested
- [x] Documentation complete

---

## Future Enhancements

1. **Dynamic Scheduling**
   - Disable keep-alive during low-traffic hours (e.g., 2-6 AM)
   - Save ~17% cost by reducing to 360 calls/day

2. **Adaptive Interval**
   - Monitor actual idle timeout
   - Adjust interval based on empirical data
   - Optimize cost vs reliability

3. **Health Check Endpoint**
   - Create separate endpoint to check model warmth
   - Return "warm" or "cold" status
   - Use for monitoring dashboards

4. **Cost Tracking**
   - Log prediction costs in database
   - Generate monthly cost reports
   - Alert if costs exceed threshold

5. **Multiple Models**
   - Extend to support multiple Replicate models
   - Shared Edge Function with model list
   - Independent schedules per model

---

## Related Tasks

- `auto-match-generation.md` - Uses same Edge Function + pg_cron pattern
- `daily-rate-limits.md` - Cost management and quotas
- `celebrity-advanced-matching.md` - Uses face-analysis model

---

## References

- **Replicate Model**: https://replicate.com/ngocla99/face-analysis
- **Replicate API Docs**: https://replicate.com/docs/reference/http
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **pg_cron Extension**: https://github.com/citusdata/pg_cron
- **Replicate Pricing**: https://replicate.com/pricing
- **Model README**: `replicate-model/README.md`

---

## Notes

- Model version ID is hardcoded in Edge Function (update if model is redeployed)
- Test image URL should remain available (using Replicate's CDN)
- Cron job uses service role key (admin access) - keep secure
- Edge Function is public but harmless (just keeps model warm)
- Costs may vary based on Replicate pricing changes
