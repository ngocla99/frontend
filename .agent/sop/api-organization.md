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

Every API file should follow this **standardized structure**:

### For Query Operations (GET)

```typescript
// 1. Imports
import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { ResourceApi, GetResourceInput } from "../types";

// 2. API Function (with AbortSignal support)
export const getResourceApi = async (
  input: GetResourceInput,
  signal?: AbortSignal,
): Promise<ResourceApi> => {
  return api.get<ResourceApi>("/resource", { params: input, signal });
};

// 3. Query Options (for prefetching and advanced usage)
export const getResourceQueryOptions = (input: GetResourceInput) => {
  return queryOptions({
    queryKey: ["resource", input],
    queryFn: ({ signal }) => getResourceApi(input, signal),
    enabled: !!input.id,  // Optional: conditional fetching
  });
};

// 4. Hook Options Type
type UseResourceOptions = {
  input: GetResourceInput;
  queryConfig?: QueryConfig<typeof getResourceQueryOptions>;
};

// 5. React Query Hook (component integration)
export const useResource = ({ input, queryConfig }: UseResourceOptions) => {
  return useQuery({
    ...getResourceQueryOptions(input),
    ...queryConfig,
  });
};
```

### For Mutation Operations (POST/PATCH/DELETE)

```typescript
// 1. Imports
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";

// 2. Input Type
export type CreateResourceInput = {
  name: string;
  description?: string;
};

// 3. API Function
export const createResourceApi = (input: CreateResourceInput): Promise<ResourceApi> => {
  return api.post<ResourceApi>("/resource", input);
};

// 4. React Mutation Hook
export const useCreateResource = (
  config?: MutationConfig<typeof createResourceApi>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createResourceApi,
    onSuccess: (data, variables) => {
      // Update cache with new data
      queryClient.setQueryData(["resource", data.id], data);
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: ["resource", "list"] });
    },
    ...config,
  });
};
```

---

## Naming Convention Summary

### Standard Pattern

| Type | Function Name | QueryOptions Name | Hook Name |
|------|--------------|-------------------|-----------|
| **GET** | `getResourceApi` | `getResourceQueryOptions` | `useResource` |
| **POST** | `createResourceApi` | N/A | `useCreateResource` |
| **PATCH** | `updateResourceApi` | N/A | `useUpdateResource` |
| **DELETE** | `deleteResourceApi` | N/A | `useDeleteResource` |
| **Custom** | `generateBabyApi` | N/A | `useGenerateBaby` |

### Key Rules

1. **API Functions:** Always end with `Api` suffix
   - `getBabyForMatchApi`, `getConnectionsApi`, `generateBabyApi`

2. **QueryOptions:** Only for GET requests, end with `QueryOptions`
   - `getBabyForMatchQueryOptions`, `getConnectionsQueryOptions`

3. **Hooks:** Use natural naming without `Api` suffix
   - `useBabyForMatch`, `useConnections`, `useGenerateBaby`

4. **Parameters:** Use `input` (not `params`) for consistency
   - Matches TanStack Query's mutation pattern

5. **AbortSignal:** Always support cancellation in GET requests
   - Pass `signal` parameter to API function
   - Extract from `queryFn: ({ signal }) => ...`

---

## API Function Guidelines

### 1. Use Proper HTTP Methods with New `api` Client

```typescript
import api from "@/lib/api-client";

// GET - Fetch data
return api.get<ResourceType>("/resource", { params });

// POST - Create new resource
return api.post<ResourceType>("/resource", body);

// PATCH - Partial update
return api.patch<ResourceType>(`/resource/${id}`, updates);

// PUT - Full replacement (rare)
return api.put<ResourceType>(`/resource/${id}`, newData);

// DELETE - Remove resource
return api.delete<void>(`/resource/${id}`);
```

**Key Points:**
- ✅ Use TypeScript generics `<T>` for type safety
- ✅ Return type is `Promise<T>` (no `.data` extraction needed)
- ✅ Pass query params via `{ params }` option
- ✅ Built-in error handling with toast notifications

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
    queryFn: () => getResourceApi(input),
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
): Promise<ResourceApi> => {
  // ...
};

// ❌ Bad - Inline object types
export const getResourceApi = (
  input: { id: string; filters?: any },
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

**File:** `get-baby.ts` (Actual codebase example)

```typescript
import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { BabyApi } from "@/types/api";

// API Function
export const getBabyForMatchApi = async (
  matchId: string,
  signal?: AbortSignal,
): Promise<BabyApi | null> => {
  const response = await api.get<{ baby: BabyApi | null }>("/baby", {
    params: { match_id: matchId },
    signal,
  });
  return response.baby;
};

// Query Options
export const getBabyForMatchQueryOptions = (matchId: string) => {
  return queryOptions({
    queryKey: ["baby", "match", matchId],
    queryFn: ({ signal }) => getBabyForMatchApi(matchId, signal),
    enabled: !!matchId,
  });
};

// Hook Options Type
type UseBabyForMatchOptions = {
  matchId?: string;
  queryConfig?: QueryConfig<typeof getBabyForMatchQueryOptions>;
};

// React Query Hook
export const useBabyForMatch = ({
  matchId,
  queryConfig,
}: UseBabyForMatchOptions = {}) => {
  return useQuery({
    ...getBabyForMatchQueryOptions(matchId || ""),
    ...queryConfig,
  });
};
```

**Usage in component:**
```typescript
const { data: baby, isLoading } = useBabyForMatch({
  matchId: "match-123",
  queryConfig: {
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  },
});
```

---

### Example 2: GET with Query Parameters

**File:** `get-notifications.ts` (Actual codebase example)

```typescript
import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { GetNotificationsParams, NotificationsResponse } from "../types";

// API Function
export const getNotificationsApi = async (
  input: GetNotificationsParams = {},
  signal?: AbortSignal,
): Promise<NotificationsResponse> => {
  const searchParams = new URLSearchParams();

  if (input.unread_only !== undefined) {
    searchParams.append("unread_only", String(input.unread_only));
  }
  if (input.limit !== undefined) {
    searchParams.append("limit", String(input.limit));
  }
  if (input.offset !== undefined) {
    searchParams.append("offset", String(input.offset));
  }

  return api.get<NotificationsResponse>(
    `/notifications?${searchParams.toString()}`,
    { signal },
  );
};

// Query Options
export const getNotificationsQueryOptions = (
  input: GetNotificationsParams = {},
) => {
  return queryOptions({
    queryKey: ["notifications", input],
    queryFn: ({ signal }) => getNotificationsApi(input, signal),
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Hook Options Type
type UseNotificationsOptions = {
  input?: GetNotificationsParams;
  queryConfig?: QueryConfig<typeof getNotificationsQueryOptions>;
};

// React Query Hook
export const useNotifications = ({
  input = {},
  queryConfig,
}: UseNotificationsOptions = {}) => {
  return useQuery({
    ...getNotificationsQueryOptions(input),
    ...queryConfig,
  });
};

// Specialized Hook
export const useUnreadNotifications = ({
  queryConfig,
}: Omit<UseNotificationsOptions, "input"> = {}) => {
  return useNotifications({ input: { unread_only: true }, queryConfig });
};
```

**Usage:**
```typescript
// Fetch all notifications
const { data } = useNotifications();

// Fetch only unread with pagination
const { data } = useNotifications({
  input: {
    unread_only: true,
    limit: 20,
    offset: 0,
  },
});

// Use specialized hook
const { data: unread } = useUnreadNotifications();
```

---

### Example 3: POST Mutation

**File:** `generate-baby.ts` (Actual codebase example)

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { BabyApi } from "@/types/api";

// API Function
export const generateBabyApi = (matchId: string): Promise<BabyApi> => {
  return api.post<BabyApi>("/baby", { match_id: matchId });
};

// React Mutation Hook
export const useGenerateBaby = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateBabyApi,
    onSuccess: (data, matchId) => {
      // Set query data for immediate display
      queryClient.setQueryData(["baby", "match", matchId], data);
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: ["baby", "list"] });
    },
  });
};
```

**Usage:**
```typescript
const { mutate: generateBaby, isPending } = useGenerateBaby();

const handleGenerate = () => {
  generateBaby("match-123", {
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
```

---

### Example 4: Complex Mutation with Optimistic Updates

**File:** `react-to-match.ts` (Actual codebase example)

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";

export type ReactToMatchInput = {
  matchId: string;
  favorite: boolean;
};

// API Function
export const reactToMatchApi = (input: ReactToMatchInput) => {
  if (input.favorite) {
    // POST to add favorite reaction
    return api.post(`/matches/${input.matchId}/react`, {
      reaction_type: "like",
    });
  } else {
    // DELETE to remove reaction
    return api.delete(`/matches/${input.matchId}/react`);
  }
};

// React Mutation Hook with Optimistic Updates
export const useReactToMatch = (
  config?: MutationConfig<typeof reactToMatchApi>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactToMatchApi,
    onMutate: async ({ matchId, favorite }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(
        { queryKey: ["matching", "top", "infinite"] },
        { silent: true },
      );

      // Optimistically update user matches
      queryClient.setQueriesData(
        { queryKey: ["matching", "user"] },
        (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.map((m: Record<string, unknown>) =>
            m?.id === matchId ? { ...m, isFavorited: favorite } : m,
          );
        },
      );

      // Optimistically update live matches infinite cache
      queryClient.setQueriesData(
        { queryKey: ["matching", "top", "infinite"] },
        (old: unknown) => {
          if (!old || typeof old !== "object" || !("pages" in old)) return old;
          const oldData = old as { pages: Record<string, unknown>[][] };

          return {
            ...oldData,
            pages: oldData.pages.map((page: Record<string, unknown>[]) =>
              page.map((m: Record<string, unknown>) =>
                m?.id === matchId
                  ? { ...m, my_reaction: favorite ? ["favorite"] : [] }
                  : m,
              ),
            ),
          };
        },
      );
    },
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({
        queryKey: ["matching", "top", "infinite"],
        exact: false,
      });
    },
    ...config,
  });
};
```

**Usage:**
```typescript
const { mutate: reactToMatch } = useReactToMatch();

const handleFavorite = (matchId: string, isFavorited: boolean) => {
  reactToMatch({ matchId, favorite: !isFavorited });
};
```

---

### Example 5: Infinite Query with Pagination

**File:** `get-live-match.ts` (Actual codebase example)

```typescript
import {
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import api from "@/lib/api-client";
import { PAGINATION } from "@/lib/constants/constant";
import type { QueryConfig } from "@/lib/react-query";
import type { LiveMatchApi } from "@/types/api";
import { transformApiMatchesToDisplayData } from "../utils/transform-api-data";

export type LiveMatchInput = {
  limit: number;
  skip: number;
  signal?: AbortSignal;
};

// API Function
export const getLiveMatchApi = async (
  input: LiveMatchInput,
): Promise<LiveMatchApi[]> => {
  const { signal, ...query } = input;
  const response = await api.get<{ matches: LiveMatchApi[]; total: number }>(
    "/matches/top",
    { params: query, signal },
  );
  return response.matches;
};

// Query Options
export const getLiveMatchQueryOptions = (input: LiveMatchInput) => {
  return queryOptions({
    queryKey: ["matching", "top", input],
    queryFn: () => getLiveMatchApi(input),
  });
};

// Standard Query Hook
type UseLiveMatchOptions = {
  queryConfig?: QueryConfig<typeof getLiveMatchQueryOptions>;
  input?: LiveMatchInput;
};

export const useLiveMatch = ({
  input = {
    skip: PAGINATION.DEFAULT_OFFSET,
    limit: PAGINATION.DEFAULT_LIMIT,
  },
  queryConfig,
}: UseLiveMatchOptions = {}) => {
  return useQuery({
    ...getLiveMatchQueryOptions(input),
    ...queryConfig,
  });
};

// Infinite Query Hook
type UseLiveMatchInfiniteOptions = {
  input?: LiveMatchInput;
  queryConfig?: QueryConfig<typeof getLiveMatchApi>;
};

export const useLiveMatchInfinite = ({
  input = {
    skip: PAGINATION.DEFAULT_OFFSET,
    limit: PAGINATION.DEFAULT_LIMIT,
  },
  queryConfig,
}: UseLiveMatchInfiniteOptions = {}) => {
  return useInfiniteQuery({
    queryKey: ["matching", "top", "infinite"],
    queryFn: ({ pageParam = PAGINATION.DEFAULT_OFFSET, signal }) =>
      getLiveMatchApi({
        ...input,
        skip: pageParam,
        signal,
      }),
    getNextPageParam: (lastPage, _, lastPageParam) => {
      if (lastPage.length === 0) {
        return undefined;
      }
      return lastPageParam + input.limit;
    },
    initialPageParam: PAGINATION.DEFAULT_OFFSET,
    select: (data) => {
      return data.pages.flatMap((page) => {
        return transformApiMatchesToDisplayData(page);
      });
    },
    ...queryConfig,
  });
};
```

**Usage:**
```typescript
// Standard paginated query
const { data: matches } = useLiveMatch({
  input: { skip: 0, limit: 20 },
});

// Infinite scroll
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useLiveMatchInfinite({
  input: { limit: 20 },
});
```

---

## Component Usage

### Query Hook Usage

```typescript
"use client";

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
"use client";

import { useGenerateBaby } from "@/features/matching/api/generate-baby";
import { toast } from "sonner";

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

### Prefetching for Better UX

```typescript
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { getBabyForMatchQueryOptions } from "@/features/matching/api/get-baby";

function MatchCard({ matchId }: { matchId: string }) {
  const queryClient = useQueryClient();

  const prefetchBaby = () => {
    queryClient.prefetchQuery(getBabyForMatchQueryOptions(matchId));
  };

  return (
    <div onMouseEnter={prefetchBaby}>
      Match Card (hover to prefetch baby)
    </div>
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

### 3. Prefetching Data

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { getBabyForMatchQueryOptions } from "@/features/matching/api/get-baby";

function MatchCard({ matchId }: { matchId: string }) {
  const queryClient = useQueryClient();

  const prefetchBaby = () => {
    // Prefetch baby data on hover for instant display
    queryClient.prefetchQuery(getBabyForMatchQueryOptions(matchId));
  };

  return <div onMouseEnter={prefetchBaby}>Match Card</div>;
}
```

---

### 4. Query Invalidation Patterns

```typescript
import { useQueryClient } from "@tanstack/react-query";

function useMatchActions() {
  const queryClient = useQueryClient();

  const invalidateMatch = (matchId: string) => {
    // Invalidate specific match
    queryClient.invalidateQueries({ queryKey: ["matching", "user", matchId] });
  };

  const invalidateAllMatches = () => {
    // Invalidate all matching queries
    queryClient.invalidateQueries({ queryKey: ["matching"] });
  };

  const invalidateMatchList = () => {
    // Invalidate only list queries
    queryClient.invalidateQueries({ queryKey: ["matching", "top"], exact: false });
  };

  return { invalidateMatch, invalidateAllMatches, invalidateMatchList };
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

### Naming Convention Cheat Sheet

| Component | Pattern | Example |
|-----------|---------|---------|
| **File Name** | `[action]-[resource].ts` | `get-baby.ts`, `generate-baby.ts` |
| **API Function** | `[action][Resource]Api` | `getBabyForMatchApi`, `generateBabyApi` |
| **Query Options** | `[action][Resource]QueryOptions` | `getBabyForMatchQueryOptions` |
| **Hook** | `use[Action][Resource]` | `useBabyForMatch`, `useGenerateBaby` |
| **Input Type** | `[Action][Resource]Input` | `GetBabyListInput`, `ReactToMatchInput` |
| **Hook Options** | `Use[Action][Resource]Options` | `UseBabyForMatchOptions` |

### File Template Checklist

**For GET Requests:**
- [ ] Named as `get-[resource].ts`
- [ ] API function ends with `Api` suffix
- [ ] Query options exported (for prefetching)
- [ ] Hook uses object destructuring `{ input, queryConfig }`
- [ ] AbortSignal support in API function
- [ ] Query key is hierarchical
- [ ] Types exported if used by consumers

**For Mutations (POST/PATCH/DELETE):**
- [ ] Named as `[action]-[resource].ts`
- [ ] API function ends with `Api` suffix
- [ ] Hook uses `useMutation` from TanStack Query
- [ ] Cache invalidation in `onSuccess`
- [ ] Optimistic updates if needed (in `onMutate`)
- [ ] Input type exported
- [ ] MutationConfig support for consumer overrides

### Common Mistakes to Avoid

❌ **Don't:** Mix multiple operations in one file
✅ **Do:** One operation per file

❌ **Don't:** Use flat query keys like `["data"]`
✅ **Do:** Use hierarchical keys like `["resource", "list", input]`

❌ **Don't:** Forget `Api` suffix on API functions
✅ **Do:** `getBabyForMatchApi`, not `getBabyForMatch`

❌ **Don't:** Use `params` for function parameters
✅ **Do:** Use `input` for consistency with TanStack Query

❌ **Don't:** Forget AbortSignal support in GET requests
✅ **Do:** Add `signal?: AbortSignal` parameter

❌ **Don't:** Define types inline
✅ **Do:** Export types at top of file or import from `@/types`

❌ **Don't:** Forget cache invalidation in mutations
✅ **Do:** Update or invalidate relevant caches in `onSuccess`

❌ **Don't:** Skip queryOptions export for GET requests
✅ **Do:** Export for prefetching and advanced usage

### Standard Imports

```typescript
// For GET requests
import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";

// For mutations
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { MutationConfig } from "@/lib/react-query";
```

### Standard Structure Summary

**GET Request (5 exports):**
1. `[action][Resource]Api` - API function
2. `[action][Resource]QueryOptions` - Query options
3. `Use[Action][Resource]Options` - Hook options type
4. `use[Action][Resource]` - React Query hook
5. Input/Output types (if needed)

**Mutation (3 exports):**
1. `[Action][Resource]Input` - Input type
2. `[action][Resource]Api` - API function
3. `use[Action][Resource]` - React Mutation hook

---

## Related Documentation

- [Project Architecture](../system/project_architecture.md) - Tech stack & API layer overview
- [Database Schema](../system/database_schema.md) - Backend API endpoints
- [README](../README.md) - Documentation index

---

**Last Updated:** 2025-10-29
