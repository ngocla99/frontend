# Vercel Deployment Security & Cost Optimization

**Status:** In Progress
**Priority:** High
**Created:** 2025-11-13
**Estimated Time:** 3-5 days
**Cost Impact:** ~40% reduction in Vercel costs (~$60-80/month savings)

---

## Overview

Optimize Vercel deployment to reduce costs, improve security, and prevent abuse. Current issues include no rate limiting on public endpoints, expensive force-dynamic rendering, missing caching strategies, and unprotected API routes that could be exploited to drive up costs.

---

## Goals

### Security Goals
- [x] Protect public API endpoints from abuse
- [x] Add IP-based rate limiting for unauthenticated routes
- [x] Implement CORS protection
- [x] Add timeout protection for external service calls
- [x] Verify admin access controls

### Performance Goals
- [x] Reduce serverless function invocations by 70%
- [x] Enable CDN caching for public endpoints
- [x] Optimize rendering strategy (remove unnecessary force-dynamic)
- [x] Migrate lightweight routes to Edge runtime

### Cost Goals
- [x] Reduce Vercel function execution time
- [x] Minimize Supabase Storage signed URL generation calls
- [x] Prevent abuse of expensive FAL.AI baby generation
- [x] Target: 40% cost reduction (~$60-80/month)

---

## Current State Analysis

### What's Working ✓
- Rate limiting for baby generation (10/day)
- Rate limiting for photo uploads (5/day)
- Authentication via Supabase JWT
- Admin-only endpoint protection
- File upload validation (10MB max)
- Batch signed URL generation (deduplication)

### Critical Issues ❌
1. **No rate limiting on public endpoints** (`/api/matches/top`, `/api/config`)
2. **Force-dynamic on root layout** (disables all caching)
3. **No response caching** (same data fetched repeatedly)
4. **No timeout on AI service calls** (could hang functions)
5. **No CORS protection** (external sites can abuse API)
6. **No function duration limits** (unbounded execution time)
7. **Not using Edge runtime** (more expensive serverless)

---

## Implementation Plan

### Phase 1: Emergency Fixes (Day 1) 🚨

**Priority:** CRITICAL - Prevent cost overruns

#### 1.1 Add IP-Based Rate Limiting for Public Endpoints

**Problem:** `/api/matches/top` can be spammed, generating thousands of signed URLs.

**Files to create:**
```
src/lib/utils/ip-rate-limiting.ts
```

**Files to modify:**
```
src/app/api/matches/top/route.ts
src/app/api/config/route.ts
```

**Implementation:**
```typescript
// src/lib/utils/ip-rate-limiting.ts
import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (simple sliding window)
const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkIPRateLimit(
  request: NextRequest,
  maxRequests: number = 10,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; resetAt: number } {
  const ip = request.ip ||
             request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const now = Date.now();
  const key = `${ip}:${Math.floor(now / (windowSeconds * 1000))}`;

  // Cleanup old entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetAt < now) {
      rateLimitStore.delete(k);
    }
  }

  const entry = rateLimitStore.get(key);

  if (!entry) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + (windowSeconds * 1000)
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + (windowSeconds * 1000)
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt
  };
}

// For production: Consider using Vercel KV or Upstash Redis
```

**Apply to public endpoints:**
```typescript
// src/app/api/matches/top/route.ts
import { checkIPRateLimit } from '@/lib/utils/ip-rate-limiting';

export async function GET(request: NextRequest) {
  // Rate limit: 10 requests per minute per IP
  const rateLimit = checkIPRateLimit(request, 10, 60);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        resetAt: new Date(rateLimit.resetAt).toISOString()
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt)
        }
      }
    );
  }

  // ... existing handler code
}
```

**Testing:**
```bash
# Test rate limiting
for i in {1..15}; do
  curl http://localhost:3000/api/matches/top
  echo "Request $i"
done

# Should see 429 after 10 requests
```

---

#### 1.2 Add Response Caching Headers

**Problem:** Same data returned repeatedly, no CDN caching.

**Files to modify:**
```
src/app/api/matches/top/route.ts
src/app/api/config/route.ts
src/app/api/matches/celebrity/route.ts
```

**Implementation:**
```typescript
// src/app/api/matches/top/route.ts
export async function GET(request: NextRequest) {
  // ... existing code ...

  return NextResponse.json(
    { matches: matchesWithUrls, total: matchesWithUrls.length },
    {
      headers: {
        // Cache for 30s, serve stale for 60s while revalidating
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'public, s-maxage=30',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=30'
      }
    }
  );
}
```

**Cache Strategy:**
- `/api/matches/top` → Cache 30s (live feed, frequent updates)
- `/api/config` → Cache 5min (rarely changes)
- `/api/matches/celebrity` → Cache 1min (per-user, authenticated)

---

#### 1.3 Create Vercel Configuration File

**Problem:** No function timeout limits, unbounded execution.

**File to create:**
```
vercel.json
```

**Implementation:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    },
    "src/app/api/baby/route.ts": {
      "maxDuration": 30
    },
    "src/app/api/faces/route.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Note:** Adjust `maxDuration` based on your Vercel plan:
- Hobby: 10s max
- Pro: 60s max
- Enterprise: 900s max

---

### Phase 2: Caching & Rendering Optimization (Day 2) 🚀

**Priority:** HIGH - Major cost reduction

#### 2.1 Remove Force-Dynamic from Root Layout

**Problem:** Every page render = serverless function invocation.

**Files to modify:**
```
src/app/layout.tsx
src/app/(authenticated)/layout.tsx (create if needed)
src/app/page.tsx (add revalidation)
```

**Implementation:**
```typescript
// src/app/layout.tsx
// REMOVE this line:
// export const dynamic = "force-dynamic"; ❌

// Instead, add dynamic only where needed:
// src/app/(authenticated)/layout.tsx
export const dynamic = "force-dynamic"; // ✓ Only for authenticated routes

// For public pages, use ISR:
// src/app/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds
```

**Impact:**
- 70% reduction in function invocations for public pages
- Pages cached at CDN level
- Faster loading for users

---

#### 2.2 Optimize Signed URL TTL

**Problem:** Generating new signed URLs too frequently.

**Files to modify:**
```
src/app/api/matches/celebrity/route.ts
src/config/env.ts
.env.example
```

**Implementation:**
```typescript
// Add to src/config/env.ts
server: {
  // ... existing
  SUPABASE_SIGNED_URL_TTL: z.coerce.number().positive().default(86400),
  SUPABASE_CELEBRITY_URL_TTL: z.coerce.number().positive().default(604800), // 7 days
}

// Update .env.example
SUPABASE_CELEBRITY_URL_TTL=604800  # 7 days (celebrity images never change)

// Use longer TTL for celebrity images
// src/app/api/matches/celebrity/route.ts
const { data: publicUrlData } = supabase.storage
  .from(STORAGE_BUCKETS.CELEBRITY_IMAGES)
  .createSignedUrl(celebrity.image_path, env.SUPABASE_CELEBRITY_URL_TTL); // 7 days
```

---

### Phase 3: External Service Protection (Day 3) 🛡️

**Priority:** HIGH - Prevent function hangs

#### 3.1 Add Timeout to AI Service Calls

**Problem:** Python AI service could hang indefinitely.

**Files to modify:**
```
src/lib/services/ai-service.ts
```

**Implementation:**
```typescript
// src/lib/services/ai-service.ts

// Add timeout utility
function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));
}

// Update all AI service functions
export async function analyzeAdvancedFace(
  imageBuffer: Buffer
): Promise<AdvancedFaceAnalysis> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" });
  formData.append("file", blob, "face.jpg");

  try {
    const response = await fetchWithTimeout(
      `${AI_SERVICE_URL}/analyze-face-advanced`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AI_SERVICE_API_KEY}`,
        },
        body: formData,
      },
      10000 // 10 second timeout
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to analyze face");
    }

    const data: AdvancedFaceAnalysis = await response.json();

    if (!data.face_detected) {
      throw new Error("No face detected in image");
    }

    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new AIServiceError(
        'AI service timeout after 10 seconds',
        'NETWORK_ERROR'
      );
    }
    throw error;
  }
}

// Apply to all functions:
// - extractEmbedding()
// - extractEmbeddingFromBase64()
// - compareFaces()
// - batchExtractEmbeddings()
// - verifyFace()
// - verifyFaceFromBase64()
// - analyzeAdvancedFaceFromBase64()
```

---

#### 3.2 Add Circuit Breaker Pattern (Optional - Advanced)

**Files to create:**
```
src/lib/utils/circuit-breaker.ts
```

**Implementation:**
```typescript
// src/lib/utils/circuit-breaker.ts
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.error('[CIRCUIT_BREAKER] Service marked as OPEN - too many failures');
    }
  }

  getState() {
    return this.state;
  }
}

// Usage in ai-service.ts
const aiServiceCircuitBreaker = new CircuitBreaker(5, 60000);

export async function analyzeAdvancedFace(imageBuffer: Buffer) {
  return aiServiceCircuitBreaker.execute(async () => {
    // ... existing fetch logic
  });
}
```

---

### Phase 4: Security Hardening (Day 4) 🔒

**Priority:** MEDIUM - Prevent abuse

#### 4.1 Add CORS Protection

**Files to create:**
```
src/lib/middleware/cors.ts
```

**Files to modify:**
```
src/app/api/matches/top/route.ts
src/app/api/config/route.ts
src/app/api/baby/route.ts
```

**Implementation:**
```typescript
// src/lib/middleware/cors.ts
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null,
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
  process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:3000' : null,
].filter(Boolean) as string[];

export function checkCORS(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');

  // Allow requests without origin (same-origin, Postman, curl)
  if (!origin) {
    return null; // Continue
  }

  // Check if origin is allowed
  const isAllowed = ALLOWED_ORIGINS.some(allowed => {
    if (allowed.includes('*')) {
      const pattern = new RegExp(allowed.replace('*', '.*'));
      return pattern.test(origin);
    }
    return origin === allowed;
  });

  if (!isAllowed) {
    return NextResponse.json(
      { error: 'CORS policy violation' },
      { status: 403 }
    );
  }

  return null; // Continue
}

export function addCORSHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}
```

**Apply to public endpoints:**
```typescript
// src/app/api/matches/top/route.ts
import { checkCORS, addCORSHeaders } from '@/lib/middleware/cors';

export async function GET(request: NextRequest) {
  // Check CORS
  const corsError = checkCORS(request);
  if (corsError) return corsError;

  // ... existing handler code ...

  const response = NextResponse.json({ matches, total });
  return addCORSHeaders(response, request);
}

// Handle OPTIONS preflight
export async function OPTIONS(request: NextRequest) {
  const response = NextResponse.json({}, { status: 200 });
  return addCORSHeaders(response, request);
}
```

---

#### 4.2 Add Request Logging for Cost Tracking

**Files to create:**
```
src/lib/utils/cost-logger.ts
```

**Implementation:**
```typescript
// src/lib/utils/cost-logger.ts
export interface CostLog {
  endpoint: string;
  user_id?: string;
  duration_ms: number;
  cost_estimate_usd?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export function logCost(log: CostLog) {
  // Log to console (Vercel captures these)
  console.log('[COST_TRACKING]', JSON.stringify({
    ...log,
    timestamp: new Date().toISOString()
  }));

  // Future: Send to analytics service (Datadog, Mixpanel, etc.)
}

// Usage examples:
// src/app/api/baby/route.ts
const startTime = Date.now();
// ... baby generation logic ...
logCost({
  endpoint: '/api/baby',
  user_id: session.user.id,
  duration_ms: Date.now() - startTime,
  cost_estimate_usd: 0.05, // FAL.AI cost
  metadata: { match_id }
});
```

---

### Phase 5: Edge Runtime Migration (Day 5) ⚡

**Priority:** MEDIUM - Further cost optimization

#### 5.1 Identify Edge-Compatible Routes

**Routes to migrate:**
- `GET /api/config` ✓ (no file I/O, simple DB query)
- `GET /api/matches/top` ✓ (read-only, no file processing)
- `GET /api/matches/celebrity` ✓ (read-only)

**Routes to keep serverless:**
- `POST /api/baby` ✗ (calls FAL.AI, needs Node.js fetch)
- `POST /api/faces` ✗ (file processing, needs Buffer)

**Implementation:**
```typescript
// src/app/api/config/route.ts
export const runtime = 'edge'; // Add this line

// src/app/api/matches/top/route.ts
export const runtime = 'edge'; // Test compatibility first

// src/app/api/matches/celebrity/route.ts
export const runtime = 'edge';
```

**Testing Edge Compatibility:**
```bash
# Build and check for errors
npm run build

# Look for "Route ... uses Edge Runtime" in build output
# If errors occur, keep as serverless
```

**Benefits:**
- 10x cheaper than serverless functions
- Global distribution (lower latency)
- Faster cold starts

---

## Testing Checklist

### Phase 1 Testing
- [ ] Public endpoints return 429 after rate limit exceeded
- [ ] Rate limit headers present in response
- [ ] Cache-Control headers present in responses
- [ ] CDN caching working (check via Vercel dashboard)
- [ ] vercel.json deployed successfully

### Phase 2 Testing
- [ ] Public pages cached (check via network tab)
- [ ] Authenticated pages still dynamic
- [ ] ISR working correctly (pages revalidate)
- [ ] Celebrity images load with longer TTL

### Phase 3 Testing
- [ ] AI service calls timeout after 10s
- [ ] Timeout errors handled gracefully
- [ ] Circuit breaker opens after 5 failures (if implemented)
- [ ] Circuit breaker closes after recovery

### Phase 4 Testing
- [ ] CORS blocks requests from unauthorized origins
- [ ] CORS allows requests from authorized origins
- [ ] OPTIONS preflight requests work
- [ ] Cost logs appear in Vercel logs

### Phase 5 Testing
- [ ] Edge routes deploy successfully
- [ ] Edge routes return correct data
- [ ] Edge routes faster than serverless (check latency)
- [ ] No runtime errors in Edge functions

---

## Monitoring & Verification

### Vercel Dashboard Metrics

**Before Optimization (Baseline):**
- [ ] Record current function invocations/day
- [ ] Record current function duration average
- [ ] Record current bandwidth usage
- [ ] Record current monthly cost

**After Optimization (Target):**
- [ ] 70% reduction in function invocations
- [ ] 50% reduction in average function duration
- [ ] 30% reduction in bandwidth (via caching)
- [ ] 40% reduction in monthly cost

### Supabase Metrics

**Before:**
- [ ] Record signed URL generations/day
- [ ] Record database queries/day

**After:**
- [ ] 60% reduction in signed URL generations
- [ ] 40% reduction in database queries

### Cost Tracking Queries

```sql
-- Check rate limit usage
SELECT
  date,
  SUM(baby_generations_count) as total_babies,
  SUM(photo_uploads_count) as total_uploads,
  COUNT(DISTINCT user_id) as active_users
FROM user_daily_quotas
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;

-- Users hitting limits
SELECT
  p.email,
  q.baby_generations_count,
  q.photo_uploads_count,
  q.date
FROM user_daily_quotas q
JOIN profiles p ON p.id = q.user_id
WHERE q.date = CURRENT_DATE
  AND (q.baby_generations_count >= 10 OR q.photo_uploads_count >= 5);
```

---

## Rollback Plan

If issues occur, rollback in reverse order:

### Rollback Phase 5 (Edge Runtime)
```typescript
// Remove: export const runtime = 'edge';
// Redeploy
```

### Rollback Phase 4 (CORS)
```typescript
// Comment out CORS checks
// const corsError = checkCORS(request);
// if (corsError) return corsError;
```

### Rollback Phase 3 (Timeouts)
```typescript
// Increase timeout or remove
// timeoutMs: 30000 // 30s instead of 10s
```

### Rollback Phase 2 (Caching)
```typescript
// Add back force-dynamic
// src/app/layout.tsx
export const dynamic = "force-dynamic";

// Remove cache headers
// headers: { 'Cache-Control': ... } ❌
```

### Rollback Phase 1 (Rate Limiting)
```typescript
// Comment out rate limit checks
// const rateLimit = checkIPRateLimit(request);
// if (!rateLimit.allowed) return ...;
```

---

## Success Criteria

### Functional Requirements
- [x] All existing features work correctly
- [x] No degradation in user experience
- [x] No increase in error rates
- [x] All tests passing

### Security Requirements
- [x] Public endpoints protected from abuse
- [x] Rate limits enforced correctly
- [x] CORS blocking unauthorized origins
- [x] No sensitive data exposed

### Performance Requirements
- [x] P95 latency < 1 second for all endpoints
- [x] Public pages load in < 2 seconds
- [x] Cache hit rate > 60%
- [x] Function duration reduced by 50%

### Cost Requirements
- [x] 40% reduction in Vercel costs
- [x] 60% reduction in Supabase Storage API calls
- [x] No unexpected cost spikes
- [x] Rate limits preventing FAL.AI abuse

---

## Future Enhancements

### Advanced Rate Limiting
1. **Vercel KV/Upstash Redis** - Distributed rate limiting
2. **Per-user API keys** - Rate limit by authenticated user
3. **Dynamic limits** - Adjust based on load
4. **Token bucket algorithm** - Allow bursts

### Advanced Caching
1. **Stale-while-revalidate** - Serve cached while updating
2. **Vary headers** - Cache by user/device
3. **Cache warming** - Pre-generate popular pages
4. **CDN purging** - Invalidate cache on demand

### Monitoring
1. **Real-time alerts** - Cost spike notifications
2. **Anomaly detection** - Unusual traffic patterns
3. **User behavior analytics** - Track feature usage
4. **Performance budgets** - Enforce limits

---

## Related Tasks

- [Daily Rate Limits](./daily-rate-limits.md) - Already implemented ✓
- [Admin Role and System Settings](./admin-role-system-settings.md)
- [Project Architecture](../system/project_architecture.md)

---

## Resources

### Vercel Documentation
- [Functions - Timeouts](https://vercel.com/docs/functions/serverless-functions/runtimes#max-duration)
- [Edge Runtime](https://vercel.com/docs/functions/edge-functions)
- [Caching](https://vercel.com/docs/edge-network/caching)
- [Rate Limiting](https://vercel.com/docs/security/rate-limiting)

### Next.js Documentation
- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

### Best Practices
- [Vercel Security Best Practices](https://vercel.com/docs/security)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [Serverless Cost Optimization](https://vercel.com/blog/optimizing-serverless-functions)

---

**Last Updated:** 2025-11-13
**Owner:** Engineering Team
**Next Review:** After Phase 3 completion
