# API File Organization Guidelines

**Related Docs:** [Project Architecture](../system/project_architecture.md) | [README](../README.md)

---

## Overview

This document provides best practices for organizing API files in the application. Following these guidelines ensures consistent, maintainable, and scalable API layer architecture across features.

---

## Core Principles

### 1. One Concern Per File

**Each API file should handle ONE specific endpoint or operation.**

```
✅ Good - Separated by operation
src/features/matching/api/
├── get-baby.ts           # GET single baby
├── get-baby-list.ts      # GET list of babies
└── generate-baby.ts      # POST generate baby

❌ Bad - Everything in one file
src/features/matching/api/
└── baby-api.ts          # All baby operations mixed
```

**Why?**
- Easier to find and maintain specific functionality
- Clearer dependencies and imports
- Better code splitting and tree-shaking
- Simpler testing and debugging

---

## File Naming Convention

### Pattern: `[action]-[resource].ts`

| Pattern | Example | Description |
|---------|---------|-------------|
| `get-[resource].ts` | `get-user.ts` | Fetch single resource |
| `get-[resource]-list.ts` | `get-match-list.ts` | Fetch collection |
| `create-[resource].ts` | `create-profile.ts` | POST new resource |
| `update-[resource].ts` | `update-settings.ts` | PATCH/PUT resource |
| `delete-[resource].ts` | `delete-photo.ts` | DELETE resource |
| `[custom-action]-[resource].ts` | `generate-baby.ts` | Custom operations |

### Examples

```
✅ Good - Clear action and resource
get-live-match.ts
get-user-photos.ts
upload-face.ts
react-to-match.ts
generate-baby.ts

❌ Bad - Ambiguous or too generic
matches.ts
api.ts
baby.ts
data.ts
```

---

## File Structure Template

Every API file should follow this standard structure:

```typescript
// 1. Imports
import { queryOptions, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { ResourceApi } from "@/types/api";

// 2. Types (if needed for this file only)
export type GetResourceInput = {
  id: string;
  signal?: AbortSignal;
};

// 3. API Function (raw fetch logic)
export const getResourceApi = (
  input: GetResourceInput,
): Promise<ResourceApi> => {
  const { signal, ...params } = input;
  return apiClient.get("/api/v1/resource", {
    params,
    signal,
  });
};

// 4. Query Options (React Query configuration)
export const getResourceQueryOptions = (input: GetResourceInput) => {
  return queryOptions({
    queryKey: ["resource", input.id],
    queryFn: ({ signal }) => getResourceApi({ ...input, signal }),
    enabled: !!input.id,
  });
};

// 5. Hook (React component integration)
type UseResourceOptions = {
  input: GetResourceInput;
  queryConfig?: QueryConfig<typeof getResourceQueryOptions>;
};

export const useResource = ({
  input,
  queryConfig,
}: UseResourceOptions) => {
  return useQuery({
    ...getResourceQueryOptions(input),
    ...queryConfig,
  });
};
```

---

## Standard Exports

### For Query Operations (GET)

```typescript
// Always export these three
export const getResourceApi       // Raw API function
export const getResourceQueryOptions  // Query config
export const useResource          // React hook
```

### For Mutation Operations (POST/PATCH/DELETE)

```typescript
// Always export these two
export const mutateResourceApi    // Raw API function
export const useMutateResource    // React mutation hook
```

---

## API Function Guidelines

### 1. Always Accept AbortSignal

```typescript
// ✅ Good - Supports request cancellation
export const getResourceApi = (
  id: string,
  signal?: AbortSignal,
): Promise<ResourceApi> => {
  return apiClient.get(`/api/v1/resource/${id}`, { signal });
};

// ❌ Bad - No abort signal support
export const getResourceApi = (id: string): Promise<ResourceApi> => {
  return apiClient.get(`/api/v1/resource/${id}`);
};
```

**Why?**
- Allows React Query to cancel in-flight requests
- Prevents memory leaks and race conditions
- Essential for route changes and component unmounts

---

### 2. Destructure Signal from Input

```typescript
// ✅ Good - Clean parameter spreading
export const getResourceApi = (
  input: GetResourceInput,
  signal?: AbortSignal,
): Promise<ResourceApi> => {
  const { signal: inputSignal, ...params } = input;
  return apiClient.get("/api/v1/resource", {
    params,
    signal: signal || inputSignal,
  });
};

// ❌ Bad - Signal pollutes request params
export const getResourceApi = (
  input: GetResourceInput,
): Promise<ResourceApi> => {
  return apiClient.get("/api/v1/resource", {
    params: input, // signal would be included here
  });
};
```

---

### 3. Use Proper HTTP Methods

```typescript
// GET - Fetch data
apiClient.get("/api/v1/resource", { params });

// POST - Create new resource
apiClient.post("/api/v1/resource", body);

// PATCH - Partial update
apiClient.patch(`/api/v1/resource/${id}`, updates);

// PUT - Full replacement (rare)
apiClient.put(`/api/v1/resource/${id}`, newData);

// DELETE - Remove resource
apiClient.delete(`/api/v1/resource/${id}`);
```

---

## Query Key Structure

**Query keys should be hierarchical and unique.**

### Pattern: `[domain, subdomain?, ...identifiers, ...filters]`

```typescript
// ✅ Good - Hierarchical and specific
["matching", "top", "infinite"]
["baby", "match", matchId]
["baby", "list", { userId, skip, limit }]
["user", "photos", userId]
["celeb", "match", faceId]

// ❌ Bad - Flat or ambiguous
["matches"]
["baby"]
["data", matchId]
```

### Query Key Rules

1. **Start with feature domain** (`"matching"`, `"baby"`, `"user"`)
2. **Add subdomain if needed** (`"top"`, `"list"`, `"match"`)
3. **Include identifiers** (`matchId`, `userId`)
4. **Include filters as objects** (`{ skip, limit }`)

**Example:**
```typescript
// Single resource
queryKey: ["baby", "match", matchId]

// Collection with filters
queryKey: ["matching", "top", { limit, offset, filter: "user" }]

// Infinite list
queryKey: ["matching", "top", "infinite"]
```

---

## React Query Configuration

### Query Options (GET)

```typescript
export const getResourceQueryOptions = (input: GetResourceInput) => {
  return queryOptions({
    queryKey: ["resource", input.id],
    queryFn: ({ signal }) => getResourceApi(input, signal),
    enabled: !!input.id,        // Only fetch if ID exists
    staleTime: 1000 * 60 * 5,   // Optional: Cache for 5 minutes
    retry: 2,                    // Optional: Retry failed requests
  });
};
```

### Common Query Config Options

| Option | When to Use | Example |
|--------|-------------|---------|
| `enabled` | Conditional fetching | `enabled: !!userId` |
| `staleTime` | Cache fresh data | `staleTime: 1000 * 60 * 5` |
| `retry` | Control retry logic | `retry: false` for 404s |
| `refetchOnWindowFocus` | Real-time data | `refetchOnWindowFocus: true` |
| `refetchInterval` | Polling | `refetchInterval: 30000` |

---

### Mutation Hooks (POST/PATCH/DELETE)

```typescript
export const useCreateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createResourceApi,
    onSuccess: (data, variables) => {
      // Update cache with new data
      queryClient.setQueryData(["resource", data.id], data);

      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: ["resource", "list"] });
    },
  });
};
```

### Cache Update Strategies

**1. Optimistic Updates**
```typescript
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey: ["resource", id] });
  const previous = queryClient.getQueryData(["resource", id]);
  queryClient.setQueryData(["resource", id], newData);
  return { previous };
},
onError: (err, variables, context) => {
  queryClient.setQueryData(["resource", id], context.previous);
},
```

**2. Simple Cache Invalidation**
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["resource"] });
},
```

**3. Direct Cache Update**
```typescript
onSuccess: (data, id) => {
  queryClient.setQueryData(["resource", id], data);
  queryClient.invalidateQueries({ queryKey: ["resource", "list"] });
},
```

---

## Type Safety

### 1. Define Input Types

```typescript
// ✅ Good - Explicit input type
export type GetResourceInput = {
  id: string;
  filters?: {
    status: "active" | "inactive";
    limit: number;
  };
};

export const getResourceApi = (
  input: GetResourceInput,
  signal?: AbortSignal,
): Promise<ResourceApi> => {
  // ...
};

// ❌ Bad - Inline object types
export const getResourceApi = (
  input: { id: string; filters?: any },
  signal?: AbortSignal,
): Promise<ResourceApi> => {
  // ...
};
```

---

### 2. Import Types from Centralized Location

```typescript
// ✅ Good - Types from central location
import type { BabyApi, UserApi } from "@/types/api";

// ❌ Bad - Types defined inline
type Baby = {
  id: string;
  image_url: string;
  // ...
};
```

---

### 3. Export Custom Types

```typescript
// Export types that are specific to this API file
export type BabyListItem = {
  id: string;
  me: UserProfile;
  other: UserProfile;
  images: BabyImage[];
};
```

---

## Folder Structure

```
src/features/[feature]/api/
├── get-[resource].ts          # Single resource fetch
├── get-[resource]-list.ts     # Collection fetch
├── create-[resource].ts       # Create operation
├── update-[resource].ts       # Update operation
├── delete-[resource].ts       # Delete operation
└── [custom-action].ts         # Special operations

Example - Matching Feature:
src/features/matching/api/
├── get-live-match.ts
├── get-user-match.ts
├── get-celeb-match.ts
├── get-user-photos.ts
├── react-to-match.ts
├── upload-face.ts
├── get-baby.ts
├── get-baby-list.ts
└── generate-baby.ts
```

---

## Real-World Examples

### Example 1: Simple GET Request

**File:** `get-user.ts`

```typescript
import { queryOptions, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { UserApi } from "@/types/api";

export const getUserApi = (
  userId: string,
  signal?: AbortSignal,
): Promise<UserApi> => {
  return apiClient.get(`/api/v1/users/${userId}`, { signal });
};

export const getUserQueryOptions = (userId: string) => {
  return queryOptions({
    queryKey: ["user", userId],
    queryFn: ({ signal }) => getUserApi(userId, signal),
    enabled: !!userId,
  });
};

type UseUserOptions = {
  userId: string;
  queryConfig?: QueryConfig<typeof getUserQueryOptions>;
};

export const useUser = ({ userId, queryConfig }: UseUserOptions) => {
  return useQuery({
    ...getUserQueryOptions(userId),
    ...queryConfig,
  });
};
```

---

### Example 2: GET with Query Parameters

**File:** `get-baby-list.ts`

```typescript
import { queryOptions, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";

export type GetBabyListInput = {
  userId?: string;
  skip?: number;
  limit?: number;
};

export type BabyListItem = {
  id: string;
  created_at: string;
  images: Array<{ id: string; image_url: string }>;
};

export const getBabyListApi = (
  input: GetBabyListInput = {},
  signal?: AbortSignal,
): Promise<BabyListItem[]> => {
  const params = new URLSearchParams();
  if (input.userId) params.append("user_id", input.userId);
  if (input.skip !== undefined) params.append("skip", String(input.skip));
  if (input.limit !== undefined) params.append("limit", String(input.limit));

  const queryString = params.toString();
  const url = queryString
    ? `/api/v1/me/babies?${queryString}`
    : "/api/v1/me/babies";

  return apiClient.get(url, { signal });
};

export const getBabyListQueryOptions = (input: GetBabyListInput = {}) => {
  return queryOptions({
    queryKey: ["baby", "list", input],
    queryFn: ({ signal }) => getBabyListApi(input, signal),
  });
};

type UseBabyListOptions = {
  input?: GetBabyListInput;
  queryConfig?: QueryConfig<typeof getBabyListQueryOptions>;
};

export const useBabyList = ({
  input = {},
  queryConfig,
}: UseBabyListOptions = {}) => {
  return useQuery({
    ...getBabyListQueryOptions(input),
    ...queryConfig,
  });
};
```

---

### Example 3: POST Mutation

**File:** `generate-baby.ts`

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { BabyApi } from "@/types/api";

export const generateBabyApi = (matchId: string): Promise<BabyApi> => {
  return apiClient.post(`/api/v1/baby`, { match_id: matchId });
};

export const useGenerateBaby = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateBabyApi,
    onSuccess: (data, matchId) => {
      // Update specific match baby cache
      queryClient.setQueryData(["baby", "match", matchId], data);

      // Invalidate baby list to refetch with new baby
      queryClient.invalidateQueries({ queryKey: ["baby", "list"] });
    },
  });
};
```

---

### Example 4: Infinite Query

**File:** `get-live-match.ts`

```typescript
import {
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { PAGINATION } from "@/lib/constants/constant";
import type { QueryConfig } from "@/lib/react-query";
import type { LiveMatchApi } from "@/types/api";

export type LiveMatchInput = {
  limit: number;
  offset: number;
  signal?: AbortSignal;
};

export const getLiveMatchApi = (
  input: LiveMatchInput,
): Promise<LiveMatchApi[]> => {
  const { signal, ...query } = input;
  return apiClient.get("/api/v1/matches/top", {
    params: { ...query, filter: "user" },
    signal,
  });
};

export const getLiveMatchQueryOptions = (input: LiveMatchInput) => {
  return queryOptions({
    queryKey: ["matching", "top", input],
    queryFn: () => getLiveMatchApi(input),
  });
};

type UseLiveMatchInfiniteOptions = {
  input?: LiveMatchInput;
  queryConfig?: QueryConfig<typeof getLiveMatchApi>;
};

export const useLiveMatchInfinite = ({
  input = {
    offset: PAGINATION.DEFAULT_OFFSET,
    limit: PAGINATION.DEFAULT_LIMIT,
  },
  queryConfig,
}: UseLiveMatchInfiniteOptions = {}) => {
  return useInfiniteQuery({
    queryKey: ["matching", "top", "infinite"],
    queryFn: ({ pageParam = PAGINATION.DEFAULT_OFFSET, signal }) =>
      getLiveMatchApi({
        ...input,
        offset: pageParam,
        signal,
      }),
    getNextPageParam: (lastPage, _, lastPageParam) => {
      if (lastPage.length === 0) {
        return undefined;
      }
      return lastPageParam + input.limit;
    },
    initialPageParam: PAGINATION.DEFAULT_OFFSET,
    refetchInterval: 30000,
    ...queryConfig,
  });
};
```

---

## Component Usage

### Query Hook Usage

```typescript
// In component
import { useBabyForMatch } from "@/features/matching/api/get-baby";

function BabyDisplay({ matchId }: { matchId: string }) {
  const { data: baby, isLoading, error } = useBabyForMatch({
    matchId,
    queryConfig: {
      enabled: !!matchId,
      staleTime: 1000 * 60 * 5,
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading baby</div>;
  if (!baby) return <div>No baby found</div>;

  return <img src={baby.image_url} alt="Baby" />;
}
```

---

### Mutation Hook Usage

```typescript
// In component
import { useGenerateBaby } from "@/features/matching/api/generate-baby";

function BabyGenerator({ matchId }: { matchId: string }) {
  const { mutate: generateBaby, isPending } = useGenerateBaby();

  const handleGenerate = () => {
    generateBaby(matchId, {
      onSuccess: (data) => {
        toast.success("Baby generated!");
        console.log("New baby:", data);
      },
      onError: (error) => {
        toast.error("Failed to generate baby");
        console.error(error);
      },
    });
  };

  return (
    <button onClick={handleGenerate} disabled={isPending}>
      {isPending ? "Generating..." : "Generate Baby"}
    </button>
  );
}
```

---

## Common Patterns

### 1. Conditional Queries

```typescript
// Only fetch when ID is available
const { data } = useResource({
  input: { id: userId },
  queryConfig: {
    enabled: !!userId,
  },
});
```

---

### 2. Dependent Queries

```typescript
// First, get user
const { data: user } = useUser({ userId });

// Then, fetch based on user data
const { data: matches } = useMatches({
  input: { userId: user?.id },
  queryConfig: {
    enabled: !!user?.id, // Only fetch if user is loaded
  },
});
```

---

### 3. Prefetching

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { getBabyForMatchQueryOptions } from "./api/get-baby";

function MatchCard({ matchId }: { matchId: string }) {
  const queryClient = useQueryClient();

  const prefetchBaby = () => {
    queryClient.prefetchQuery(getBabyForMatchQueryOptions(matchId));
  };

  return <div onMouseEnter={prefetchBaby}>Match Card</div>;
}
```

---

## Testing

### Test Structure

```typescript
// get-baby.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { wrapper } from "@/test/test-utils";
import { useBabyForMatch } from "./get-baby";

vi.mock("@/lib/api-client");

describe("useBabyForMatch", () => {
  it("should fetch baby for match", async () => {
    const { result } = renderHook(
      () => useBabyForMatch({ matchId: "123" }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({
      id: "123",
      image_url: expect.any(String),
    });
  });

  it("should not fetch when matchId is missing", () => {
    const { result } = renderHook(
      () => useBabyForMatch({ matchId: undefined }),
      { wrapper }
    );

    expect(result.current.fetchStatus).toBe("idle");
  });
});
```

---

## Migration Guide

### From Single File to Multiple Files

**Before:**
```
api/
└── baby-api.ts  (300+ lines)
```

**After:**
```
api/
├── get-baby.ts        (40 lines)
├── get-baby-list.ts   (60 lines)
└── generate-baby.ts   (25 lines)
```

**Steps:**

1. **Identify distinct operations** in the large file
2. **Create separate files** following naming convention
3. **Copy relevant code** to each new file
4. **Update imports** in components
5. **Remove old file** once all imports are updated
6. **Test** to ensure no regressions

**Example commit message:**
```
refactor: split baby-api.ts into separate operation files

- Created get-baby.ts for fetching single baby
- Created get-baby-list.ts for fetching baby list
- Created generate-baby.ts for baby generation
- Updated imports in baby-generator.tsx and baby-tab.tsx

Improves maintainability and follows API organization SOP
```

---

## Quick Reference

### File Template Checklist

- [ ] Named as `[action]-[resource].ts`
- [ ] API function accepts `signal?: AbortSignal`
- [ ] Query options exported for queries
- [ ] Custom hook exported
- [ ] Types exported if used by consumers
- [ ] Query key is hierarchical
- [ ] Mutations update cache appropriately

### Common Mistakes to Avoid

❌ **Don't:** Mix multiple operations in one file
✅ **Do:** One operation per file

❌ **Don't:** Forget to accept abort signal
✅ **Do:** Always accept `signal?: AbortSignal`

❌ **Don't:** Use flat query keys like `["data"]`
✅ **Do:** Use hierarchical keys like `["resource", "list", params]`

❌ **Don't:** Define types inline
✅ **Do:** Export types at top of file or import from `@/types`

❌ **Don't:** Forget cache invalidation in mutations
✅ **Do:** Update or invalidate relevant caches in `onSuccess`

---

## Related Documentation

- [Project Architecture](../system/project_architecture.md) - Tech stack & API layer overview
- [Database Schema](../system/database_schema.md) - Backend API endpoints
- [README](../README.md) - Documentation index

---

**Last Updated:** 2025-10-16
