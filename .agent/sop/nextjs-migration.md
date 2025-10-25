# Next.js 16 Migration Guide

**Related Docs:** [Project Architecture](../system/project_architecture.md) | [README](../README.md)

## Overview

This document outlines the migration from Vite + TanStack Router to Next.js 16 App Router. The migration maintains the same feature set while adopting Next.js conventions and patterns.

---

## Key Changes

### 1. Build Tool & Framework

**Before:** Vite 7.1 + TanStack Router 1.130
**After:** Next.js 16.0 (includes built-in bundler)

**Benefits:**
- Built-in server-side rendering (SSR)
- Better SEO with automatic metadata handling
- Image optimization out of the box
- API routes support (if needed)
- Automatic code splitting
- Better production performance

### 2. Routing System

#### File Structure Migration

**Before (TanStack Router):**
```
src/routes/
├── __root.tsx          # Root layout
├── index.tsx           # Home page
├── _authenticated/     # Protected routes
│   ├── live-matches.tsx
│   ├── your-matches.tsx
│   └── profile.tsx
├── auth/
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   └── callback.tsx
└── (errors)/
    ├── 401.tsx
    ├── 403.tsx
    └── 404.tsx
```

**After (Next.js App Router):**
```
src/app/
├── layout.tsx          # Root layout
├── page.tsx            # Home page
├── (authenticated)/    # Route group (protected)
│   ├── layout.tsx      # Auth guard layout
│   ├── live-matches/
│   │   └── page.tsx
│   ├── your-matches/
│   │   └── page.tsx
│   └── profile/
│       └── page.tsx
├── auth/
│   ├── layout.tsx      # Auth layout
│   ├── sign-in/
│   │   └── page.tsx
│   ├── sign-up/
│   │   └── page.tsx
│   └── callback/
│       └── page.tsx
├── error.tsx           # Error boundary
├── not-found.tsx       # 404 page
└── global-error.tsx    # Global error handler
```

#### Router API Changes

**TanStack Router:**
```typescript
import { useRouter, useNavigate } from '@tanstack/react-router';

const router = useRouter();
const navigate = useNavigate();

// Navigation
router.navigate({ to: '/profile' });
navigate({ to: '/auth/sign-in' });

// Route context
const context = useRouteContext({ from: '/' });
const isAuth = context.auth?.isAuthenticated;
```

**Next.js App Router:**
```typescript
import { useRouter, usePathname } from 'next/navigation';

const router = useRouter();
const pathname = usePathname();

// Navigation
router.push('/profile');
router.push('/auth/sign-in');
router.back();

// Auth check (use Zustand store instead)
const user = useUser(); // From auth-store
const isAuth = !!user;
```

### 3. Component Patterns

#### Client Components

All interactive components must use `"use client"` directive:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MyComponent() {
  const [state, setState] = useState();
  const router = useRouter();
  // ... component logic
}
```

#### Server Components

By default, components are server components (no directive needed). Use for static content and data fetching.

### 4. Protected Routes

**Before (TanStack Router):**
```typescript
export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfilePage,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/auth/sign-in' });
    }
  },
});
```

**After (Next.js Layout Guard):**
```typescript
// app/(authenticated)/layout.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/stores/auth-store";

export default function AuthenticatedLayout({ children }) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push("/auth/sign-in");
    }
  }, [session, router]);

  if (!session) {
    return null; // or loading spinner
  }

  return <>{children}</>;
}
```

### 5. Font Loading

**Before (CSS Import):**
```css
@import url("https://fonts.googleapis.com/css2?family=Poppins:...");

body {
  font-family: "Poppins", sans-serif;
}
```

**After (Next.js Font Optimization):**
```typescript
// app/layout.tsx
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        {children}
      </body>
    </html>
  );
}
```

### 6. Environment Variables

**Before (Vite):**
```env
VITE_BASE_API_URL=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
```

**After (Next.js):**
```env
NEXT_PUBLIC_BASE_API_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
```

**Access in code:**
```typescript
// Before
const url = import.meta.env.VITE_BASE_API_URL;

// After
const url = process.env.NEXT_PUBLIC_BASE_API_URL;
```

### 7. Navigation Progress Indicator

**Before (TanStack Router State):**
```typescript
import { useRouterState } from "@tanstack/react-router";

const state = useRouterState();
const isNavigating = state.status === "pending";
```

**After (Pathname Change Detection):**
```typescript
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const pathname = usePathname();

useEffect(() => {
  // Trigger loading bar on pathname change
  loadingBar.start();

  const timer = setTimeout(() => {
    loadingBar.complete();
  }, 100);

  return () => clearTimeout(timer);
}, [pathname]);
```

---

## Migration Checklist

### Phase 1: Setup Next.js

- [x] Install Next.js 16 and remove Vite
- [x] Create `next.config.ts` with image optimization
- [x] Update `package.json` scripts
- [x] Rename env variables (`VITE_*` → `NEXT_PUBLIC_*`)
- [x] Remove `vite.config.ts` and related files

### Phase 2: Migrate Routes

- [x] Create `src/app/` directory structure
- [x] Convert `__root.tsx` to `layout.tsx`
- [x] Convert `index.tsx` to `page.tsx`
- [x] Migrate `_authenticated/` routes to `(authenticated)/`
- [x] Create layout-based auth guards
- [x] Migrate error pages

### Phase 3: Update Router Usage

- [x] Replace `useRouter` from `@tanstack/react-router` with `next/navigation`
- [x] Replace `useNavigate` with `router.push()`
- [x] Replace `useRouteContext` with Zustand store access
- [x] Update `router.navigate()` → `router.push()`
- [x] Add `"use client"` to interactive components

### Phase 4: Update Imports & APIs

- [x] Update font loading to use `next/font/google`
- [x] Update env variable access
- [x] Update navigation progress indicator
- [x] Fix any TypeScript errors

### Phase 5: Testing & Validation

- [x] Verify all routes are accessible
- [x] Test protected route guards
- [x] Verify authentication flow
- [x] Test navigation between pages
- [x] Check font loading
- [x] Validate environment variables

---

## Common Issues & Solutions

### Issue: "NextRouter was not mounted"

**Cause:** Using `next/router` instead of `next/navigation`

**Solution:**
```typescript
// ❌ Wrong (Pages Router)
import { useRouter } from "next/router";

// ✅ Correct (App Router)
import { useRouter } from "next/navigation";
```

### Issue: Router returns null

**Cause:** Calling router in non-client component

**Solution:** Add `"use client"` directive at top of file

### Issue: CSS not applying

**Cause:** External font imports stripped by Tailwind CSS 4.0

**Solution:** Use Next.js font optimization instead of `@import url()`

### Issue: Protected routes not working

**Cause:** Missing auth guard in layout

**Solution:** Create `(authenticated)/layout.tsx` with session check

---

## Best Practices

### 1. Use Route Groups for Organization

```
app/
├── (authenticated)/    # Protected routes
├── (public)/          # Public routes (optional)
└── auth/              # Auth-specific routes
```

### 2. Keep Client Components Minimal

Only add `"use client"` when necessary (hooks, events, state).

### 3. Use Layouts for Shared Logic

- Root layout: Global providers, fonts
- Auth layout: Header, navigation
- Protected layout: Auth guards

### 4. Leverage Next.js Features

- Use `next/image` for optimized images
- Use `next/font` for optimized fonts
- Use metadata API for SEO

### 5. Environment Variable Naming

- Client-side: `NEXT_PUBLIC_*`
- Server-side: No prefix needed

---

## Performance Improvements

After migration:

1. **Faster Initial Load:** Next.js optimizes bundle splitting
2. **Better SEO:** Server-side rendering by default
3. **Optimized Fonts:** Automatic font optimization
4. **Optimized Images:** Built-in image optimization
5. **Smaller Bundle:** Dead code elimination

---

## Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Migration from Vite](https://nextjs.org/docs/app/building-your-application/upgrading/from-vite)
- [Routing Guide](https://nextjs.org/docs/app/building-your-application/routing)
- [Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)

---

**Last Updated:** 2025-10-25
**Status:** ✅ Migration Complete
