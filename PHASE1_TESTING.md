# Phase 1 Testing Guide

Phase 1 implementation has been completed! Here's how to test and verify the changes.

---

## ✅ What Was Implemented

1. **IP-Based Rate Limiting** for public endpoints
2. **CDN Caching** with Cache-Control headers
3. **Vercel Configuration** with function timeouts and security headers

---

## Testing Instructions

### 1. Test Rate Limiting (Local Development)

#### Test /api/matches/top (20 requests/min limit)

```bash
# Run this in your terminal to test rate limiting
for i in {1..25}; do
  echo "Request $i:"
  curl -w "\nHTTP Status: %{http_code}\n" \
       -H "Accept: application/json" \
       http://localhost:3000/api/matches/top?limit=5
  echo "---"
  sleep 0.5
done

# Expected results:
# - Requests 1-20: HTTP 200 with data
# - Requests 21-25: HTTP 429 with error message
```

**What to look for:**
- First 20 requests succeed (200 OK)
- Requests 21+ return 429 Too Many Requests
- Response includes `X-RateLimit-*` headers
- Error message shows `resetAt` timestamp

#### Test /api/config (20 requests/min limit)

```bash
# Should allow more requests before rate limiting
for i in {1..25}; do
  echo "Request $i:"
  curl -w "\nHTTP Status: %{http_code}\n" \
       http://localhost:3000/api/config
  echo "---"
  sleep 0.5
done

# Expected results:
# - Requests 1-20: HTTP 200
# - Requests 21-25: HTTP 429
```

---

### 2. Test Rate Limit Headers

```bash
# Check that rate limit headers are present
curl -i http://localhost:3000/api/matches/top?limit=5

# Look for these headers in the response:
# X-RateLimit-Limit: 20
# X-RateLimit-Remaining: 19
# X-RateLimit-Reset: <unix timestamp>
```

**Expected output:**
```
HTTP/1.1 200 OK
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-RateLimit-Reset: 1699999999
Cache-Control: public, s-maxage=30, stale-while-revalidate=60
...
```

---

### 3. Test Cache Headers

```bash
# Verify caching headers are present
curl -I http://localhost:3000/api/matches/top

# Look for:
# Cache-Control: public, s-maxage=30, stale-while-revalidate=60
# CDN-Cache-Control: public, s-maxage=30
# Vercel-CDN-Cache-Control: public, s-maxage=30
```

```bash
# Config endpoint should have longer cache
curl -I http://localhost:3000/api/config

# Look for:
# Cache-Control: public, s-maxage=300, stale-while-revalidate=600
```

---

### 4. Test Rate Limit Reset (Wait for Window)

```bash
# 1. Hit the rate limit
for i in {1..22}; do curl http://localhost:3000/api/matches/top?limit=1 > /dev/null 2>&1; done

# 2. Check you're rate limited
curl http://localhost:3000/api/matches/top
# Should return 429 with resetAt timestamp

# 3. Wait 60 seconds (or use the resetAt time)
echo "Waiting 60 seconds for rate limit to reset..."
sleep 60

# 4. Try again - should work now
curl http://localhost:3000/api/matches/top
# Should return 200 OK
```

---

### 5. Test Different IPs (Advanced)

Rate limiting is per IP address. To test multiple IPs:

```bash
# Use different X-Forwarded-For headers to simulate different IPs
for ip in "1.1.1.1" "2.2.2.2" "3.3.3.3"; do
  echo "Testing from IP: $ip"
  curl -H "X-Forwarded-For: $ip" http://localhost:3000/api/matches/top?limit=1
  echo ""
done

# Each IP should have its own rate limit counter
```

---

### 6. Verify Vercel Configuration (After Deploy)

After deploying to Vercel, verify the configuration:

```bash
# Check security headers are applied
curl -I https://your-app.vercel.app/api/matches/top

# Look for:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## Expected Behavior

### Rate Limiting ✓
- [x] Public endpoints return 429 after limit exceeded
- [x] Rate limit headers present in all responses
- [x] Error message includes resetAt timestamp
- [x] Rate limits reset after time window
- [x] Different IPs have separate counters

### Caching ✓
- [x] Cache-Control headers present
- [x] `/api/matches/top` cached for 30 seconds
- [x] `/api/config` cached for 5 minutes
- [x] Stale-while-revalidate allows background refresh

### Vercel Config ✓
- [x] Security headers applied to all API routes
- [x] Function timeouts configured
- [x] No TypeScript errors in build

---

## Testing in Production (Vercel)

After deploying to Vercel:

### 1. Test CDN Caching

```bash
# Make the same request twice quickly
time curl https://your-app.vercel.app/api/matches/top?limit=5
time curl https://your-app.vercel.app/api/matches/top?limit=5

# Second request should be MUCH faster (served from CDN)
```

### 2. Check Vercel Analytics

1. Go to Vercel Dashboard → Your Project
2. Click "Analytics" tab
3. Look for:
   - Reduced function invocation count
   - Increased cache hit ratio
   - Lower average function duration

### 3. Monitor Rate Limiting

```bash
# Check rate limiting works on production
for i in {1..25}; do
  curl https://your-app.vercel.app/api/matches/top
  echo "Request $i"
  sleep 1
done
```

---

## Troubleshooting

### Rate Limiting Not Working

**Problem:** All requests succeed, no 429 errors

**Check:**
1. Verify imports are correct in route files
2. Check that `checkIPRateLimit()` is called before main logic
3. Look for TypeScript errors: `npm run build`

**Debug:**
```typescript
// Add console.log to see rate limit info
const rateLimit = checkIPRateLimit(request, 10, 60);
console.log('[RATE_LIMIT]', {
  allowed: rateLimit.allowed,
  remaining: rateLimit.remaining
});
```

---

### Caching Not Working

**Problem:** Every request still hits the function

**Check:**
1. Verify headers are in the response: `curl -I`
2. Check that you're testing in production (local dev doesn't cache)
3. Ensure you're not sending auth cookies (they bypass cache)

**Note:** Next.js dev server (`npm run dev`) doesn't respect cache headers. Deploy to Vercel to test caching.

---

### Rate Limit Too Strict

**Problem:** Legitimate users getting blocked

**Solution:** Adjust limits in the route files:

```typescript
// Increase limit or window duration
const rateLimit = checkIPRateLimit(request, 20, 60); // 20 requests/min
// or
const rateLimit = checkIPRateLimit(request, 10, 120); // 10 requests/2min
```

---

## Performance Metrics (Before/After)

Track these metrics in Vercel Dashboard:

| Metric | Before | After (Expected) |
|--------|--------|------------------|
| Function Invocations/day | Baseline | -70% |
| Avg Function Duration | Baseline | -50% |
| Cache Hit Rate | 0% | 60%+ |
| 429 Errors | N/A | < 1% |

---

## Next Steps

Once Phase 1 is verified:

✅ **Phase 1 Complete** - Rate limiting + Caching
⬜ **Phase 2** - Remove force-dynamic, implement ISR
⬜ **Phase 3** - Add timeout to AI service calls
⬜ **Phase 4** - CORS protection + cost logging
⬜ **Phase 5** - Edge runtime migration

See `.agent/tasks/vercel-security-cost-optimization.md` for full plan.

---

## Questions?

If you encounter issues:
1. Check the implementation in the route files
2. Review `src/lib/utils/ip-rate-limiting.ts`
3. Verify `vercel.json` syntax
4. Check Vercel deployment logs
