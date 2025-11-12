# Daily Rate Limits for Baby Generation & Photo Uploads

**Status:** In Progress
**Priority:** High
**Created:** 2025-11-12
**Approach:** Database-based quota tracking with system settings

---

## Overview

Implement configurable daily usage limits for baby generation and photo uploads to control costs (FAL.AI API calls) and encourage thoughtful usage. Limits are managed via admin settings and enforced at the API level.

---

## Configuration

- **Default baby generation limit:** 10/day
- **Default photo upload limit:** 5/day
- **Unlimited behavior:** -1 = Unlimited (no restrictions)
- **Blocked behavior:** 0 = Blocked (blocks all usage)
- **Timezone:** UTC midnight reset
- **History retention:** Auto-cleanup records older than 90 days

---

## Requirements

### Functional Requirements

- **Configurable limits** via admin panel (system_settings table)
- **Per-user daily tracking** of baby generations and photo uploads
- **API enforcement** with 429 status when limit exceeded
- **UTC midnight reset** for consistent daily boundaries
- **Historical cleanup** to prevent table growth
- **Clear error messages** to users about limits and reset time

### Technical Requirements

- No external dependencies (no Redis needed)
- Atomic counter increments (handle race conditions)
- Minimal performance impact (<50ms overhead)
- Admin can change limits in real-time
- -1 = unlimited, 0 = blocked, >0 = daily limit

---

## Database Schema

### New Table: user_daily_quotas

```sql
CREATE TABLE user_daily_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  baby_generations_count int NOT NULL DEFAULT 0,
  photo_uploads_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_user_daily_quotas_user_date ON user_daily_quotas(user_id, date);
CREATE INDEX idx_user_daily_quotas_date ON user_daily_quotas(date);
```

**Design notes:**
- Unique constraint on (user_id, date) prevents duplicates
- Date column uses UTC date only (no timestamp)
- Separate counters for baby_generations and photo_uploads
- ON DELETE CASCADE cleans up when user deleted

### New System Settings

```json
{
  "daily_baby_generation_limit": 10,
  "daily_photo_upload_limit": 5
}
```

### Auto-Cleanup Function

```sql
CREATE FUNCTION cleanup_old_quotas() RETURNS void AS $$
BEGIN
  DELETE FROM user_daily_quotas
  WHERE date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

Scheduled via pg_cron to run daily at midnight UTC.

---

## Implementation Flow

### Baby Generation Flow

```
User clicks "Generate Baby"
    ↓
POST /api/baby {match_id}
    ↓
Middleware: withSession (authenticate)
    ↓
Rate limit check:
  1. Get today's date (UTC)
  2. SELECT from user_daily_quotas WHERE user_id AND date
  3. SELECT daily_baby_generation_limit from system_settings
  4. IF count >= limit → Return 429 with details
    ↓
Generate baby (call FAL.AI)
    ↓
Save to babies table
    ↓
Increment quota counter:
  INSERT INTO user_daily_quotas (user_id, date, baby_generations_count)
  VALUES (?, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET baby_generations_count = baby_generations_count + 1
    ↓
Return 200 with baby data
```

### Photo Upload Flow

```
User uploads photo
    ↓
POST /api/faces (multipart/form-data)
    ↓
Middleware: withSession (authenticate)
    ↓
Rate limit check:
  1. Get today's date (UTC)
  2. SELECT from user_daily_quotas WHERE user_id AND date
  3. SELECT daily_photo_upload_limit from system_settings
  4. IF count >= limit → Return 429 with details
    ↓
Process image (AI face extraction)
    ↓
Save to faces table
    ↓
Increment quota counter:
  INSERT INTO user_daily_quotas (user_id, date, photo_uploads_count)
  VALUES (?, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET photo_uploads_count = photo_uploads_count + 1
    ↓
Create match job
    ↓
Return 202 Accepted
```

---

## Files Created/Modified

### New Files

1. **`supabase/migrations/024_daily_rate_limits.sql`**
   - Create user_daily_quotas table
   - Add system settings for limits
   - Create cleanup function
   - Schedule pg_cron job for cleanup

2. **`src/lib/utils/rate-limiting.ts`**
   - checkDailyLimit() function
   - incrementDailyUsage() function
   - Type definitions

### Modified Files

1. **`src/app/api/baby/route.ts`** (POST handler)
   - Add rate limit check before FAL.AI call
   - Increment counter after successful generation
   - Return 429 when limit exceeded

2. **`src/app/api/faces/route.ts`** (POST handler)
   - Add rate limit check before AI processing
   - Increment counter after successful upload
   - Return 429 when limit exceeded

3. **`src/app/api/admin/settings/route.ts`**
   - Update Zod schema for new settings
   - Validate limit values (min: 0)

4. **`src/lib/hooks/use-admin-settings.ts`**
   - Update SystemSettings type
   - Add daily_baby_generation_limit field
   - Add daily_photo_upload_limit field

5. **`src/app/(authenticated)/admin/page.tsx`**
   - Add "Baby Generation Limit" input
   - Add "Photo Upload Limit" input
   - Add validation and help text

6. **`src/features/matching/api/generate-baby.ts`**
   - Handle 429 responses
   - Show toast with limit details

7. **`src/features/matching/hooks/use-upload-face.ts`** (or similar)
   - Handle 429 responses
   - Show toast with limit details

---

## Implementation Steps

### Step 1: Database Migration

Create `supabase/migrations/024_daily_rate_limits.sql`:
- Enable pg_cron (if not already enabled)
- Create user_daily_quotas table
- Add indexes
- Insert default system settings
- Create cleanup function
- Schedule daily cleanup job

### Step 2: Rate Limiting Utilities

Create `src/lib/utils/rate-limiting.ts`:
- checkDailyLimit() - Returns {allowed, current, limit, resetAt}
- incrementDailyUsage() - Atomic upsert
- Type definitions for quota types

### Step 3: Baby Generation API Protection

Modify `src/app/api/baby/route.ts`:
- Import rate limiting functions
- Add check before FAL.AI call
- Return 429 with error details if blocked
- Increment counter after success

### Step 4: Photo Upload API Protection

Modify `src/app/api/faces/route.ts`:
- Import rate limiting functions
- Add check before AI processing
- Return 429 with error details if blocked
- Increment counter after success

### Step 5: Admin Settings Backend

Modify `src/app/api/admin/settings/route.ts`:
- Update Zod validation schema
- Add number validation for limits

### Step 6: Admin Settings Frontend Types

Modify `src/lib/hooks/use-admin-settings.ts`:
- Update SystemSettings interface
- Add new fields to type

### Step 7: Admin UI Controls

Modify `src/app/(authenticated)/admin/page.tsx`:
- Add number input for baby generation limit
- Add number input for photo upload limit
- Add descriptions explaining 0 = disabled
- Update form validation

### Step 8: Frontend Error Handling

Update mutation hooks:
- Parse 429 error responses
- Extract limit details from error
- Show user-friendly toast messages
- Format reset time

### Step 9: Deploy & Test

```bash
# Apply migration
npx supabase db push

# Test locally
# - Upload 5 photos → 6th should be blocked
# - Generate 10 babies → 11th should be blocked
# - Check error messages are clear
# - Change limits via admin panel
# - Verify new limits apply immediately
```

---

## API Response Format

### Success Response (200/202)

Normal operation continues as before.

### Rate Limit Exceeded (429)

```json
{
  "error": "Daily limit reached",
  "message": "You've reached your daily limit of 10 baby generations. Resets at midnight UTC.",
  "limit": 10,
  "current": 10,
  "resetAt": "2025-11-13T00:00:00.000Z",
  "type": "baby_generation"
}
```

**Frontend handling:**
- Show toast: "Daily limit reached (10/10). Resets at midnight UTC."
- Disable button with tooltip
- Optional: Show countdown to reset

---

## Testing Checklist

- [ ] Migration applies successfully
- [ ] System settings created with default values
- [ ] Upload 5 photos → Success (5/5)
- [ ] Upload 6th photo → 429 error
- [ ] Error message is clear and helpful
- [ ] Generate 10 babies → Success (10/10)
- [ ] Generate 11th baby → 429 error
- [ ] Admin can change limits in real-time
- [ ] New limits apply immediately (no cache)
- [ ] Setting limit to 0 blocks all usage
- [ ] Quota resets at UTC midnight
- [ ] Concurrent requests don't create duplicate quota records
- [ ] Old quota records cleaned up after 90 days
- [ ] Frontend shows clear error messages
- [ ] User can see their current usage

---

## Error Handling

### Race Conditions

Use PostgreSQL ON CONFLICT with DO UPDATE:
```sql
INSERT INTO user_daily_quotas (user_id, date, baby_generations_count)
VALUES ($1, CURRENT_DATE, 1)
ON CONFLICT (user_id, date)
DO UPDATE SET
  baby_generations_count = user_daily_quotas.baby_generations_count + 1,
  updated_at = now();
```

### Edge Cases

1. **User timezone vs UTC:** Always use CURRENT_DATE (UTC) in SQL
2. **Limit = 0:** Block all usage (validation allows >= 0)
3. **Negative limits:** Frontend validation prevents, backend validates
4. **Missing system_settings:** Return 500, log error
5. **Database error during increment:** Let it fail, don't charge user

---

## Performance Considerations

### Overhead Per Request

- Quota check: ~10-20ms (single SELECT with index)
- Quota increment: ~10-20ms (single UPSERT)
- Total: ~20-40ms per rate-limited API call

### Database Load

- 1,000 daily active users × 15 API calls/day = 15,000 rows
- With 90-day retention: ~1.35M rows max
- With indexes: Queries remain fast (<50ms)

### Optimization Opportunities

1. **Cache system_settings in memory** (invalidate on update)
2. **Use prepared statements** (already done via Supabase client)
3. **Add Redis layer** (future, if needed for high traffic)

---

## Security Considerations

### Bypass Prevention

- Rate limits enforced server-side only
- Cannot be bypassed via frontend manipulation
- User ID from authenticated session (not request body)
- Admin-only access to change limits

### Abuse Scenarios

1. **Multiple accounts:** Each account has own quota (acceptable)
2. **Account switching:** Not prevented (acceptable for now)
3. **Admin abuse:** Audit trail via updated_by in system_settings

---

## Monitoring

### SQL Queries

```sql
-- Today's top users by baby generations
SELECT p.email, q.baby_generations_count
FROM user_daily_quotas q
JOIN profiles p ON p.id = q.user_id
WHERE q.date = CURRENT_DATE
ORDER BY q.baby_generations_count DESC
LIMIT 10;

-- Users at limit today
SELECT p.email, q.baby_generations_count, q.photo_uploads_count
FROM user_daily_quotas q
JOIN profiles p ON p.id = q.user_id
WHERE q.date = CURRENT_DATE
  AND (q.baby_generations_count >= 10 OR q.photo_uploads_count >= 5);

-- Total usage stats for today
SELECT
  SUM(baby_generations_count) as total_babies,
  SUM(photo_uploads_count) as total_uploads,
  COUNT(DISTINCT user_id) as active_users
FROM user_daily_quotas
WHERE date = CURRENT_DATE;
```

### Supabase Dashboard

- Table Editor → user_daily_quotas (check quota usage)
- Logs → API Routes (check 429 frequency)
- Storage → Monitor FAL.AI costs (should decrease)

---

## Success Criteria

✅ Baby generation limited to configurable daily quota
✅ Photo upload limited to configurable daily quota
✅ Admin can change limits via settings page
✅ Users see clear error messages when blocked
✅ Quota resets daily at UTC midnight
✅ Zero limit blocks all usage
✅ No race conditions in counter updates
✅ Old records auto-deleted after 90 days
✅ Minimal performance impact (<50ms overhead)
✅ FAL.AI API costs reduced by limiting generations

---

## Future Enhancements

1. **User dashboard:** Show current usage (e.g., "3/10 babies today")
2. **Premium tiers:** Higher limits for paid users
3. **Weekly/monthly quotas:** Alternative quota periods
4. **Soft limits:** Warning at 80%, hard block at 100%
5. **Usage analytics:** Track patterns and optimize defaults
6. **Rate limit bypass:** Temporary admin override for specific users
7. **Notification system:** Alert users when approaching limit

---

## Related Tasks

- [Admin Role and System Settings](./admin-role-system-settings.md)
- [Auto-Match Generation](./auto-match-generation.md)
- [Match Threshold Settings](./match-threshold-settings.md)

---

## References

- Supabase Postgres: https://supabase.com/docs/guides/database
- pg_cron: https://supabase.com/docs/guides/database/extensions/pg_cron
- Rate Limiting Patterns: https://www.nginx.com/blog/rate-limiting-nginx/
