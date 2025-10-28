# Environment Variables Configuration

**Related Docs:** [Project Architecture](../system/project_architecture.md) | [Next.js Migration](./nextjs-migration.md)

---

## Overview

This application uses **`@t3-oss/env-nextjs`** for type-safe, validated environment variables with Zod schemas. All environment configuration is centralized in `src/config/env.ts`.

**Key Benefits:**
- ✅ **Type Safety** - Environment variables are fully typed
- ✅ **Runtime Validation** - Invalid values caught at build time
- ✅ **Centralized Config** - Single source of truth
- ✅ **Better DX** - Auto-completion and IntelliSense
- ✅ **Documentation** - Self-documenting configuration

---

## Environment File Structure

### File Locations

```
web/
├── .env                    # Local environment variables (gitignored)
├── .env.example            # Template with documentation
└── src/
    └── config/
        └── env.ts          # Environment schema & validation
```

### Configuration File (`src/config/env.ts`)

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Server-only variables
  },
  client: {
    // Client-side variables (NEXT_PUBLIC_ prefix)
  },
  runtimeEnv: {
    // Map process.env to schema
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
```

---

## Environment Variables

### Current Variables

#### Client-Side (NEXT_PUBLIC_*)

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_BASE_API_URL` | string | `/api` | Base URL for API routes |
| `NEXT_PUBLIC_SUPABASE_URL` | URL | Required | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | string | Required | Supabase anonymous (public) key |
| `NEXT_PUBLIC_WHITELIST_EMAIL_DOMAINS` | string | `""` | Comma-separated allowed email domains |

#### Server-Only

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | enum | `development` | Environment: development/test/production |
| `SUPABASE_SIGNED_URL_TTL` | number | `86400` | Signed URL TTL in seconds (24 hours) |
| `PYTHON_AI_SERVICE_URL` | URL | Required | Python AI microservice endpoint |
| `PYTHON_AI_SERVICE_API_KEY` | string | Required | API key for AI service authentication |
| `FAL_AI_API_KEY` | string | Required | FAL.AI API key for baby generation |
| `FAL_BABY_MODEL_ID` | string | `fal-ai/nano-banana/edit` | FAL.AI model ID |

---

## Adding New Environment Variables

### Step 1: Define in Schema

Add to `src/config/env.ts`:

```typescript
export const env = createEnv({
  server: {
    // Add server-only variable
    MY_SECRET_KEY: z.string().min(1),
  },
  client: {
    // Add client-side variable (must start with NEXT_PUBLIC_)
    NEXT_PUBLIC_MY_FEATURE_FLAG: z.boolean().default(false),
  },
  runtimeEnv: {
    // Map to process.env
    MY_SECRET_KEY: process.env.MY_SECRET_KEY,
    NEXT_PUBLIC_MY_FEATURE_FLAG: process.env.NEXT_PUBLIC_MY_FEATURE_FLAG,
  },
});
```

### Step 2: Update .env.example

Document the new variable:

```bash
# My Feature Configuration
MY_SECRET_KEY=your-secret-key-here
NEXT_PUBLIC_MY_FEATURE_FLAG=false
```

### Step 3: Add to Local .env

```bash
MY_SECRET_KEY=actual-secret-value
NEXT_PUBLIC_MY_FEATURE_FLAG=true
```

### Step 4: Use in Code

```typescript
import { env } from "@/config/env";

// Server-side (API routes, server components)
const secretKey = env.MY_SECRET_KEY;

// Client-side (components, hooks)
const featureEnabled = env.NEXT_PUBLIC_MY_FEATURE_FLAG;
```

---

## Validation Schemas

### Common Zod Validators

```typescript
// String validators
z.string()                    // Any string
z.string().min(1)            // Non-empty string
z.string().email()           // Email format
z.url()                      // Valid URL
z.string().default("value")  // With default

// Number validators
z.number()                   // Any number
z.coerce.number()           // String → number conversion
z.number().positive()        // Must be > 0
z.number().int()            // Integer only
z.number().min(0).max(100)  // Range validation

// Enum validators
z.enum(["dev", "prod"])     // One of specific values

// Boolean validators
z.boolean()                  // true/false
z.coerce.boolean()          // String → boolean conversion
```

### Example Configurations

**URL with validation:**
```typescript
SUPABASE_URL: z.url(), // Must be valid URL format
```

**Number with default:**
```typescript
TIMEOUT_MS: z.coerce.number().positive().default(5000),
```

**Enum with specific values:**
```typescript
LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
```

**Optional with fallback:**
```typescript
OPTIONAL_FEATURE: z.string().default(""),
```

---

## Client vs Server Variables

### Client-Side Variables (NEXT_PUBLIC_*)

**Characteristics:**
- Must start with `NEXT_PUBLIC_` prefix
- Exposed to the browser
- Available in all environments (client, server, edge)
- Bundled into JavaScript sent to client

**Use Cases:**
- API endpoints
- Public keys (Supabase anon key)
- Feature flags
- Analytics IDs
- Public configuration

**Example:**
```typescript
client: {
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_ANALYTICS_ID: z.string().default(""),
}
```

### Server-Only Variables

**Characteristics:**
- No prefix required
- Never exposed to browser
- Only accessible on server-side
- Not bundled into client JavaScript

**Use Cases:**
- API keys
- Database credentials
- Secret keys
- Internal service URLs
- Sensitive configuration

**Example:**
```typescript
server: {
  FAL_AI_API_KEY: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
}
```

---

## Usage Patterns

### In API Routes

```typescript
import { env } from "@/config/env";
import { NextResponse } from "next/server";

export async function POST() {
  // Access server-only variables
  const apiKey = env.FAL_AI_API_KEY;
  const timeout = env.SUPABASE_SIGNED_URL_TTL;

  // Make API call
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  return NextResponse.json({ data: "success" });
}
```

### In Server Components

```typescript
import { env } from "@/config/env";

export default async function ServerComponent() {
  // Both client and server variables available
  const apiUrl = env.NEXT_PUBLIC_BASE_API_URL;
  const secretKey = env.FAL_AI_API_KEY;

  return <div>Server Component</div>;
}
```

### In Client Components

```typescript
"use client";

import { env } from "@/config/env";

export default function ClientComponent() {
  // Only NEXT_PUBLIC_ variables available
  const apiUrl = env.NEXT_PUBLIC_BASE_API_URL;

  // ❌ This will fail - server-only variable
  // const secretKey = env.FAL_AI_API_KEY;

  return <div>Client Component</div>;
}
```

### In Middleware

```typescript
import { env } from "@/config/env";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Access environment variables
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;

  // Middleware logic
}
```

---

## Real-World Examples

### Supabase Configuration

All Supabase clients use environment variables:

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/config/env";

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
```

### Signed URL TTL Configuration

API routes use configurable timeout for signed URLs:

```typescript
// src/app/api/faces/route.ts
import { env } from "@/config/env";

export const POST = withSession(async ({ supabase }) => {
  const { data } = await supabase.storage
    .from("user-images")
    .createSignedUrl(fileName, env.SUPABASE_SIGNED_URL_TTL);

  return NextResponse.json({ url: data?.signedUrl });
});
```

**Benefits:**
- Change TTL globally via `.env` file
- Different values per environment (dev/staging/prod)
- Type-safe number validation
- Default value ensures always configured

### AI Service Integration

```typescript
// src/lib/services/ai-service.ts
import { env } from "@/config/env";

const AI_SERVICE_URL = env.PYTHON_AI_SERVICE_URL;
const AI_SERVICE_API_KEY = env.PYTHON_AI_SERVICE_API_KEY;

export async function extractEmbedding(imageBuffer: Buffer) {
  const response = await fetch(`${AI_SERVICE_URL}/extract-embedding`, {
    headers: {
      Authorization: `Bearer ${AI_SERVICE_API_KEY}`,
    },
    body: formData,
  });

  return response.json();
}
```

### Email Domain Validation

```typescript
// src/features/auth/api/magic-link-auth.ts
import { env } from "@/config/env";

const whitelist = env.NEXT_PUBLIC_WHITELIST_EMAIL_DOMAINS;
const whitelistDomains = whitelist
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);
```

---

## Environment-Specific Configuration

### Development (.env.local)

```bash
NODE_ENV=development
NEXT_PUBLIC_BASE_API_URL=/api
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
SUPABASE_SIGNED_URL_TTL=3600  # 1 hour for dev
PYTHON_AI_SERVICE_URL=http://localhost:5000
```

### Production (.env.production)

```bash
NODE_ENV=production
NEXT_PUBLIC_BASE_API_URL=/api
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SIGNED_URL_TTL=86400  # 24 hours for prod
PYTHON_AI_SERVICE_URL=https://ai-service.production.com
```

---

## Build-Time Validation

### Validation Process

Environment variables are validated at build time:

```bash
bun run build
```

**If validation fails:**
```
❌ Invalid environment variables:
{
  SUPABASE_SIGNED_URL_TTL: ["Expected number, received string"],
  FAL_AI_API_KEY: ["Required"]
}
```

**If validation succeeds:**
```
✓ Environment variables validated successfully
✓ Compiled in 23.4s
```

### Skip Validation (Docker/CI)

For Docker builds or CI where env vars aren't available yet:

```bash
SKIP_ENV_VALIDATION=true bun run build
```

**Warning:** Only use this when environment variables will be provided at runtime.

---

## Best Practices

### ✅ Do's

1. **Always use `env` import**
   ```typescript
   import { env } from "@/config/env";
   const url = env.NEXT_PUBLIC_SUPABASE_URL;
   ```

2. **Add validation for all variables**
   ```typescript
   MY_API_KEY: z.string().min(1),  // Not just z.string()
   ```

3. **Provide defaults when appropriate**
   ```typescript
   TIMEOUT_MS: z.coerce.number().default(5000),
   ```

4. **Document in .env.example**
   ```bash
   # My Feature Configuration
   # Description of what this does
   MY_FEATURE_FLAG=false
   ```

5. **Use descriptive variable names**
   ```typescript
   SUPABASE_SIGNED_URL_TTL  // ✅ Clear
   TTL                       // ❌ Unclear
   ```

### ❌ Don'ts

1. **Don't use `process.env` directly**
   ```typescript
   // ❌ Bad
   const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

   // ✅ Good
   import { env } from "@/config/env";
   const url = env.NEXT_PUBLIC_SUPABASE_URL;
   ```

2. **Don't hardcode values**
   ```typescript
   // ❌ Bad
   .createSignedUrl(path, 3600);

   // ✅ Good
   .createSignedUrl(path, env.SUPABASE_SIGNED_URL_TTL);
   ```

3. **Don't expose secrets client-side**
   ```typescript
   // ❌ Bad - Secret in client variable
   NEXT_PUBLIC_SECRET_KEY: z.string(),

   // ✅ Good - Secret is server-only
   SECRET_KEY: z.string(),
   ```

4. **Don't use non-null assertions**
   ```typescript
   // ❌ Bad - Can be undefined
   const key = process.env.API_KEY!;

   // ✅ Good - Validated & typed
   const key = env.API_KEY;
   ```

5. **Don't skip runtime mapping**
   ```typescript
   // ❌ Bad - Forgot to add to runtimeEnv
   server: {
     MY_VAR: z.string(),
   },
   runtimeEnv: {
     // Missing MY_VAR mapping!
   },
   ```

---

## Troubleshooting

### Build Fails with "Invalid environment variables"

**Problem:**
```
❌ Invalid environment variables:
{ SUPABASE_URL: ["Invalid url"] }
```

**Solution:**
1. Check `.env` file has correct value format
2. Verify schema in `src/config/env.ts` matches expected type
3. Ensure `runtimeEnv` maps the variable correctly

### Variable is `undefined` at Runtime

**Problem:**
```typescript
console.log(env.MY_VAR); // undefined
```

**Solution:**
1. Check variable exists in `.env` file
2. Verify it's added to `runtimeEnv` in `src/config/env.ts`
3. Restart dev server (`bun run dev`)
4. Check for typos in variable name

### Client-Side Variable Not Available

**Problem:**
```typescript
// Client component
const url = env.NEXT_PUBLIC_API_URL; // Error
```

**Solution:**
1. Ensure variable starts with `NEXT_PUBLIC_` prefix
2. Add to `client` section in schema
3. Rebuild application (`bun run build`)

### TypeScript Errors After Adding Variable

**Problem:**
```
Property 'MY_NEW_VAR' does not exist on type 'env'
```

**Solution:**
1. Add variable to schema in `src/config/env.ts`
2. Add to `runtimeEnv` mapping
3. Restart TypeScript server in VSCode

---

## Migration Guide

### From Direct process.env Usage

**Before:**
```typescript
const apiKey = process.env.FAL_AI_API_KEY!;
const timeout = Number(process.env.TIMEOUT_MS || "5000");
```

**After:**
```typescript
import { env } from "@/config/env";

const apiKey = env.FAL_AI_API_KEY;        // Validated, typed
const timeout = env.TIMEOUT_MS;            // Auto-converted to number
```

### From .env to env.ts

1. **Identify all environment variables:**
   ```bash
   grep -r "process.env" src/
   ```

2. **Add to schema:**
   ```typescript
   // src/config/env.ts
   export const env = createEnv({
     server: {
       FAL_AI_API_KEY: z.string().min(1),
     },
     runtimeEnv: {
       FAL_AI_API_KEY: process.env.FAL_AI_API_KEY,
     },
   });
   ```

3. **Update imports:**
   ```typescript
   // Before
   const key = process.env.FAL_AI_API_KEY!;

   // After
   import { env } from "@/config/env";
   const key = env.FAL_AI_API_KEY;
   ```

4. **Test build:**
   ```bash
   bun run build
   ```

---

## Related Documentation

- [Project Architecture](../system/project_architecture.md) - System overview
- [Next.js Migration](./nextjs-migration.md) - Next.js specific configuration
- [@t3-oss/env-nextjs Docs](https://env.t3.gg/) - Official documentation
- [Zod Documentation](https://zod.dev/) - Schema validation

---

**Last Updated:** 2025-10-28

**Maintained By:** Engineering Team
