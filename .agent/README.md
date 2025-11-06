# .agent Documentation Index

Welcome to the AI Face Matching Application (Fuzed) documentation. This folder contains comprehensive documentation to help engineers understand and contribute to the codebase.

---

## Quick Start

**New to the project?** Start here:

1. Read [Project Architecture](./system/project_architecture.md) for a complete system overview
2. Check [Database Schema](./system/database_schema.md) to understand data models
3. Review the sections below for specific information needs

---

## Documentation Structure

### 📁 System
**Current state of the system - architecture, tech stack, integrations, and core functionality**

- **[Project Architecture](./system/project_architecture.md)**
  - Complete system overview
  - Frontend & backend architecture
  - Technology stack & dependencies
  - Key design patterns & data flow
  - Integration points between services
  - Development workflow & deployment

- **[Database Schema](./system/database_schema.md)**
  - PostgreSQL schema (Supabase)
  - Qdrant vector database structure
  - Entity relationships & indexes
  - Data flow examples
  - Query optimization strategies

---

### 📁 Tasks
**PRDs (Product Requirement Documents) & implementation plans for each feature**

#### ✅ Completed Tasks

- **[Fix Vector Extension Security Issue](./tasks/fix-vector-extension-security.md)** ✅ Completed 2025-11-06
  - Moved vector extension from public schema to dedicated extensions schema
  - Resolved Supabase security advisory warning (Extension in Public)
  - Zero downtime migration with automatic type resolution via search_path
  - All vector operations, indexes, and functions continue to work seamlessly
  - No application code changes required

- **[Online/Offline Status Feature](./tasks/online-offline-status.md)** ✅ Completed 2025-11-04
  - Real-time presence tracking with Supabase Realtime
  - Global Zustand store with single subscription (optimized performance)
  - Online indicators (green/gray dots) in chat list and header
  - "Last seen X ago" formatting (minutes, hours, days)
  - Automatic last_seen update on disconnect
  - Full TypeScript integration with atomic selectors

- **[Baby Generation for University Matches](./tasks/baby-generation-university-matches.md)** ✅ Completed 2025-10-16
  - Integrated FAL.AI baby generation API with frontend
  - Connected baby generator component to real API endpoints
  - Implemented loading states, animations, and error handling
  - Enhanced UI/UX with polished animations following SOP guidelines
  - Type-safe API integration with React Query

- **[Baby History & Existing Baby Display](./tasks/baby-history-and-existing-baby-display.md)** ✅ Completed 2025-10-16
  - Auto-fetch and display existing babies when opening match dialog
  - Implemented baby history list with real-time data from backend
  - Added click-to-view functionality for baby history
  - Loading states, empty states, and error handling
  - Smooth animations and responsive design

**How to add new feature docs:**
1. Create a new file: `tasks/<feature-name>.md`
2. Include:
   - Feature overview & goals
   - Technical requirements
   - Implementation steps
   - Testing strategy
   - Dependencies & blockers
3. Update this README with a link to the new doc

---

### 📁 SOP
**Standard Operating Procedures - best practices for common development tasks**

- **[Animations](./sop/animations.md)**
  - Animation timing & duration guidelines
  - Easing functions & when to use them
  - Hover transition best practices
  - Accessibility (prefers-reduced-motion)
  - Performance optimization
  - Origin-aware animations
  - Spring animations with Framer Motion
  - Common animation patterns & examples

- **[API File Organization](./sop/api-organization.md)**
  - One concern per file principle
  - File naming conventions (`[action]-[resource].ts`)
  - Standard file structure template
  - API function guidelines (AbortSignal, HTTP methods)
  - Query key structure (hierarchical & unique)
  - React Query configuration best practices
  - Type safety guidelines
  - Real-world examples & migration guide

- **[Next.js 16 Migration](./sop/nextjs-migration.md)**
  - Migration from Vite + TanStack Router to Next.js 16
  - File structure changes and routing patterns
  - Router API differences (`useRouter`, `usePathname`)
  - Protected route implementation with layouts
  - Font loading optimization
  - Environment variable updates
  - Common issues and solutions
  - Migration checklist and best practices

- **[Environment Variables](./sop/environment-variables.md)** ✨ NEW
  - Type-safe environment configuration with @t3-oss/env-nextjs
  - Client vs server variable management
  - Zod validation schemas and patterns
  - Adding new environment variables
  - Real-world examples (Supabase, AI services, signed URLs)
  - Best practices and troubleshooting
  - Migration guide from process.env

**Additional SOPs to document:**
- How to add a new page/route
- How to add database migrations
- How to deploy to production
- How to handle authentication flows
- How to add real-time features
- How to optimize queries & performance
- How to write effective tests

---

## Key Concepts

### Frontend Architecture

**Framework:** React 19 + TypeScript + Next.js 16

**Routing:** Next.js App Router (file-based)
- Routes are auto-generated from `src/app/`
- Protected routes use `(authenticated)/` route group
- Layout-based auth guards
- Error handling with `error.tsx` and `not-found.tsx`

**State Management:**
- **Server State:** TanStack Query (caching, fetching, mutations)
- **Client State:** Zustand (auth state, UI state)

**API Layer:**
- Axios client with auth interceptors
- Feature-based API modules
- Custom React Query hooks per endpoint

**Real-time:** Supabase Realtime for live match updates

### Backend Architecture

**Framework:** Python Flask + Celery

**AI/ML:**
- **InsightFace:** Face recognition (512D embeddings)
- **FAL.AI:** AI image generation for baby feature

**Databases:**
- **PostgreSQL (Supabase):** User data, matches, reactions, babies
- **Qdrant (Vector DB):** Face embeddings for similarity search

**Authentication:** Supabase Auth (Magic Link) + Legacy OAuth

**Background Jobs:** Celery + Redis for async tasks

### Key Features

1. **Face Upload & Processing**
   - Upload photos → Extract face embeddings → Store in Qdrant

2. **Live Match Feed**
   - Real-time display of new matches
   - Sorted by similarity score
   - Infinite scroll pagination

3. **User-to-User Matching**
   - Detailed match comparison
   - Multiple face matches
   - Reaction system (favorites)

4. **Celebrity Matching**
   - Compare faces to celebrity database
   - Find top lookalikes

5. **AI Baby Generation** 👶 ✨
   - Generate baby images from two matched faces
   - Powered by FAL.AI image generation
   - Baby gallery with filtering
   - Multiple generations per match supported

6. **Profile Management**
   - Edit user info (name, gender, school)
   - Manage uploaded photos
   - View match history

---

## Tech Stack Summary

### Frontend
| Category | Technology |
|----------|-----------|
| Framework | React 19 |
| Language | TypeScript 5.7 |
| Framework & Routing | Next.js 16.0 |
| Server State | TanStack Query 5.86 |
| Client State | Zustand 5.0 |
| Styling | Tailwind CSS 4.0 |
| UI Components | Radix UI + shadcn/ui |
| Backend Client | Supabase JS 2.58 |
| HTTP Client | Axios 1.11 |
| Validation | Zod 4.1 |
| Env Config | @t3-oss/env-nextjs 0.13 |
| Animations | Framer Motion 12.23 |

### Backend
| Category | Technology |
|----------|-----------|
| Framework | Next.js API Routes |
| Language | TypeScript 5.7 |
| AI Integration | FAL.AI (baby image generation) |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (SSR) |
| Storage | Supabase Storage |
| Middleware | @supabase/ssr |
| Deployment | Vercel (Serverless/Edge) |

---

## Development Workflow

### Running Locally

```bash
cd web
bun install
bun run dev  # Starts on http://localhost:3000
```

### Environment Setup

**Environment Variables (`.env`):**
```env
# Client-side variables (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<anon-key>

# Server-only variables (no prefix)
FAL_AI_API_KEY=<fal-api-key>
FAL_BABY_MODEL_ID=fal-ai/flux/dev  # Optional, defaults to flux/dev
```

**Note:** Server-only variables (without `NEXT_PUBLIC_` prefix) are only accessible in:
- Next.js API routes (`src/app/api/**/route.ts`)
- Server components
- `getServerSideProps` / `getStaticProps`


### Code Quality

**Frontend:**
- Linter: `bun run lint` (Biome)
- Type Check: `bun run build`
- Tests: `bun run test` (Vitest)

**Backend:**
- Tests: `pytest` (assumed)

---

## File Locations Quick Reference

### Frontend Structure
```
src/
├── app/                   # Next.js App Router
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   ├── (authenticated)/  # Protected routes
│   │   ├── layout.tsx    # Auth guard
│   │   ├── live-matches/
│   │   ├── your-matches/
│   │   └── profile/
│   └── auth/             # Auth pages
│       ├── sign-in/
│       ├── sign-up/
│       └── callback/
├── features/          # Feature modules (auth, matching)
│   └── matching/
│       ├── api/       # API calls + hooks
│       ├── components/# Feature UI
│       ├── hooks/     # Custom hooks
│       └── store/     # Feature state
├── stores/            # Global Zustand stores
├── lib/               # Utilities & configs
│   ├── api-client.ts # Axios instance
│   ├── supabase.ts   # Supabase client
│   └── react-query.ts# Query config
├── components/        # Shared components
│   └── ui/           # Radix UI primitives
└── types/            # TypeScript types
```

### Backend Structure (Next.js API Routes)
```
src/app/api/
├── auth/
│   └── me/
│       └── route.ts      # GET/PATCH user profile
├── baby/
│   ├── route.ts          # POST/GET baby generation
│   └── list/
│       └── route.ts      # GET baby list
├── faces/
│   ├── route.ts          # GET/POST faces
│   └── [id]/
│       └── route.ts      # DELETE face by ID
└── matches/
    ├── top/
    │   └── route.ts      # GET top matches
    ├── celebrity/
    │   └── route.ts      # GET celebrity matches
    ├── user/
    │   └── [userId]/
    │       └── route.ts  # GET user matches
    └── [matchId]/
        └── react/
            └── route.ts  # POST/DELETE reactions
```

---

## Common Tasks

### Adding a New Frontend Route

1. Create directory in `src/app/`:
   - Public: `src/app/my-page/page.tsx`
   - Protected: `src/app/(authenticated)/my-page/page.tsx`

2. Export page component:
   ```typescript
   "use client"; // If using hooks/state

   export default function MyPage() {
     return <div>My Page Content</div>;
   }
   ```

3. Router automatically picks up new route

**See:** [Next.js Migration SOP](./sop/nextjs-migration.md) for detailed guide

### Adding a New API Endpoint

**Next.js API Route:**
1. Create route file: `src/app/api/<endpoint>/route.ts`
2. Use `withSession` middleware for authenticated routes
3. Export HTTP method handlers (GET, POST, PATCH, DELETE)
4. Return NextResponse with JSON

**Example:**
```typescript
import { NextResponse } from "next/server";
import { withSession } from "@/lib/middleware/with-session";

export const GET = withSession(async ({ supabase, session }) => {
  // Your logic here
  return NextResponse.json({ data: "success" });
});
```

**Frontend Side:**
1. Create API file: `src/features/<feature>/api/my-action.ts`
2. Define API function + React Query hook
3. Export for component use

### Working with State

**Server Data (TanStack Query):**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => fetchResource(id),
});
```

**Client Data (Zustand):**
```typescript
const user = useUser();  // Atomic selector
const { setUser } = useAuthActions();  // Actions
```

---

## Troubleshooting

### Common Issues

**Frontend build errors:**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `bun install`
- Run `bun run build` to check for TypeScript errors

**Auth not working:**
- Check Supabase Auth settings
- Verify environment variables
- Check browser console for auth errors

**API calls failing:**
- Check Next.js dev server is running
- Inspect network tab for error details
- Verify environment variables are set correctly

**Realtime not updating:**
- Check Supabase Realtime configuration
- Verify subscription is active
- Check console for connection errors

---

## Documentation Maintenance

### Updating Documentation

**When to update:**
- After implementing a new feature
- When architecture changes
- After adding new dependencies
- When workflows change

**How to update:**
1. Identify affected documentation file
2. Update content with accurate information
3. Update this README if adding new files
4. Ensure cross-references are accurate

**Documentation Best Practices:**
- Keep docs in sync with code
- Use clear, concise language
- Include code examples where helpful
- Add diagrams for complex flows
- Link related documents

---

## Additional Resources

### External Documentation

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [TanStack Query Docs](https://tanstack.com/query)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [Supabase Docs](https://supabase.com/docs)
- [Qdrant Docs](https://qdrant.tech/documentation/)
- [InsightFace Docs](https://insightface.ai/)

### Project Links

- **Frontend Repo:** (Add GitHub link)
- **Backend Repo:** (Add GitHub link)
- **Deployment:** (Add production URL)
- **Design System:** (Add Figma link if available)

---

## Getting Help

**Questions about:**
- **Architecture:** See [Project Architecture](./system/project_architecture.md)
- **Database:** See [Database Schema](./system/database_schema.md)
- **Animations:** See [Animations SOP](./sop/animations.md)
- **Features:** Check `tasks/` folder (coming soon)
- **Workflows:** Check `sop/` folder for more procedures

**Still stuck?** Reach out to the team or create an issue in the project repository.

---

---

## Recent Updates

### October 2025 - Next.js 16 Full-Stack Migration 🚀

**Major Changes:**
1. **Frontend:** Vite + TanStack Router → Next.js 16 App Router
2. **Backend:** Complete TypeScript-first backend with Next.js API Routes
3. **Architecture:** Full-stack Next.js application with Supabase integration

---

#### 1. Next.js 16 App Router Migration

**Framework Migration:**
- **Removed:** Vite 7.1, TanStack Router 1.130
- **Added:** Next.js 16.0 (routing, bundling, SSR, optimization)
- **Benefits:** Better performance, SEO, automatic code splitting, edge deployment

**Routing System:**
- **Before:** `src/routes/` with `__root.tsx`, `_authenticated/`
- **After:** `src/app/` with `layout.tsx`, `(authenticated)/`
- **Route Guards:** Layout-based with `useSession()` + redirect

**Router API Changes:**
```typescript
// Before (TanStack Router)
import { useRouter } from '@tanstack/react-router';
router.navigate({ to: '/profile' });

// After (Next.js)
import { useRouter } from 'next/navigation';
router.push('/profile');
```

**Environment Variables:**
- **Updated:** `VITE_*` → `NEXT_PUBLIC_*` (client-side)
- **Server-only:** No prefix (e.g., `FAL_AI_API_KEY`)
- **Config:** `vite.config.ts` → `next.config.ts`

**Font Loading:**
- **Before:** CSS `@import` from Google Fonts
- **After:** `next/font/google` with automatic optimization
- **Benefits:** Zero external requests, optimized loading

**Performance Improvements:**
- ✅ Faster initial page load (automatic code splitting)
- ✅ Server-side rendering for better SEO
- ✅ Optimized font & image loading
- ✅ Edge deployment ready

---

#### 2. Backend Architecture - TypeScript First

**Architecture Overview:**

The application uses **Next.js API Routes** as a full-stack TypeScript solution:

**Next.js API Routes:**
- Direct Supabase integration via `@supabase/ssr`
- Baby generation (FAL.AI integration)
- Profile management (auto-create, update)
- Match queries & reactions
- Face management

**Benefits:**
- ✅ **Type Safety:** Full TypeScript end-to-end
- ✅ **Performance:** Same-origin requests, no CORS
- ✅ **Simplified Auth:** Direct Supabase SSR integration
- ✅ **Edge Deployment:** Can deploy to Vercel Edge Runtime
- ✅ **Developer Experience:** Single codebase for frontend and backend

---

#### 3. Next.js API Routes Implementation

**API Structure:**
```
src/app/api/
├── auth/me/         # GET/PATCH user profile
├── baby/            # POST/GET baby generation
│   └── list/        # GET baby list
├── faces/           # GET/POST/DELETE faces
└── matches/         # GET matches, POST reactions
```

**Key Features:**

**Middleware Pattern (`withSession`):**
```typescript
// Automatic auth + profile fetching
export const GET = withSession(async ({ supabase, session }) => {
  // session.user and session.profile available
  return NextResponse.json({ data: "protected" });
});
```

**Baby Generation:**
- Implemented in Next.js API route `src/app/api/baby/route.ts`
- Direct FAL.AI API calls from TypeScript
- Type-safe with full TypeScript integration
- Simplified deployment

**Error Handling:**
```typescript
// Centralized error handler
import { handleApiError } from '@/lib/middleware/error-handler';

try {
  // API logic
} catch (error) {
  return handleApiError(error);
}
```

**Completed Features:**
- ✅ Baby generation endpoints (POST/GET)
- ✅ User profile endpoints (GET/PATCH with auto-create)
- ✅ Baby list endpoint (GET with filters)
- ✅ Authentication middleware
- ✅ Face management endpoints
- ✅ Match query endpoints
- ✅ Reaction endpoints

---

#### 4. Documentation Updates

**New Documentation:**
- ✅ [Next.js Migration SOP](./sop/nextjs-migration.md) - Complete migration guide

**Updated Documentation:**
- ✅ [Project Architecture](./system/project_architecture.md) - Full-stack Next.js architecture
- ✅ [Database Schema](./system/database_schema.md) - Next.js API integration patterns
- ✅ [README.md](./README.md) - Updated tech stack and structure

---

#### 5. Migration Completed

**Frontend:**
- ✅ All pages migrated to App Router
- ✅ Auth guards converted to layouts
- ✅ Router hooks updated (6 components)
- ✅ Font loading optimized
- ✅ Environment variables updated
- ✅ Build scripts updated

**Backend:**
- ✅ Next.js API routes implemented
- ✅ `withSession` middleware created
- ✅ Baby generation implemented
- ✅ Profile management (with auto-create)
- ✅ Error handling standardized
- ✅ FAL.AI integration

**Breaking Changes:**
- ⚠️ Router API changed (TanStack → Next.js)
- ⚠️ File structure changed (`routes/` → `app/`)
- ⚠️ Environment variables renamed (`VITE_*` → `NEXT_PUBLIC_*`)

---

### October 2025 - Baby Generation Feature Complete 👶✨

**New Feature: AI Baby Generation (Completed 2025-10-16)**

The baby generation feature is now fully functional on the frontend, connecting users' university matches to AI-powered baby image generation via FAL.AI.

**Key Implementations:**

1. **Baby Generator Component** (`baby-generator.tsx`)
   - ✅ Real-time API integration with backend baby endpoints
   - ✅ Auto-fetch existing baby when opening match dialog
   - ✅ Polished UI/UX with smooth animations following SOP guidelines
   - ✅ Loading states with pulsing gradient and rotating sparkle
   - ✅ Success animations with spring physics and sparkle burst
   - ✅ Error handling with proper user feedback
   - ✅ Share, Save, and Retry functionality
   - ✅ Fully responsive design (mobile, tablet, desktop)

2. **Baby History Tab** (`baby-tab.tsx`)
   - ✅ Displays all generated babies with real data from backend
   - ✅ Grid layout with baby cards showing match pairs
   - ✅ Click-to-view functionality to open baby in dialog
   - ✅ Loading skeleton while fetching data
   - ✅ Empty state when no babies exist
   - ✅ Shows count of babies per match
   - ✅ Human-readable timestamps

3. **API Integration** (`generate-baby.ts`)
   - ✅ Type-safe API client with TypeScript
   - ✅ React Query hooks: `useGenerateBaby`, `useBabyForMatch`, `useBabyList`
   - ✅ Query options for data fetching and caching
   - ✅ Proper error handling and loading states

4. **State Management** (`user-matches.ts`)
   - ✅ Zustand store manages match ID and dialog state
   - ✅ Seamless data flow from match cards to baby dialog

**User Flow:**
1. User clicks "View Baby" on university match card
2. Dialog opens and checks if baby already exists
3. If baby exists → Display instantly
4. If not → Show "Generate Our Baby's Face" button
5. Generation takes ~3-5s with engaging loading animation
6. Generated baby displayed with share/save/retry options
7. All babies accessible in Baby History tab

**Technical Highlights:**
- FAL.AI integration for high-quality AI image generation
- 5-minute cache for existing baby queries (reduces API calls)
- Multiple babies per match supported
- External image hosting via FAL.AI CDN
- Animation timing follows SOP: 200-300ms transitions, 600ms springs
- Hardware-accelerated animations (transform, opacity)
- Accessibility: Framer Motion respects `prefers-reduced-motion`

**Related Documentation:**
- [Baby Generation for University Matches](./tasks/baby-generation-university-matches.md)
- [Baby History & Existing Baby Display](./tasks/baby-history-and-existing-baby-display.md)
- [Animations SOP](./sop/animations.md)

---

### October 2025 - Authentication Migration & Baby API Updates 🔐

**Major Backend Changes:**

#### 1. Authentication System Overhaul
- **Removed:** Legacy Google OAuth flow (deprecated endpoints commented out)
- **New:** Exclusive Supabase JWT authentication with PKCE
- **Changes:**
  - All API endpoints now require Supabase JWT tokens only
  - No more custom JWT generation - all tokens issued by Supabase
  - Profile creation/lookup by email from Supabase token claims
  - Automatic profile creation for first-time Supabase Auth users
  - School email validation on first login

**Updated Endpoints:**
- `GET /api/auth/me` - Get current user (Supabase JWT only)
- `PATCH /api/auth/me` - Update user profile
- `POST /api/auth/logout` - Sign out
- **Removed:** `/login`, `/callback`, `/api/auth/magic-link`, `/auth/confirm`

**Middleware Changes:**
- `app/middlewares/auth.py` - Now exclusively validates Supabase JWT tokens
- `auth_required` decorator uses `verify_supabase_token()` helper

**Environment Variables Added:**
- `SUPABASE_JWT_SECRET` - Required for Supabase token verification

---

#### 2. Baby Generation API Updates
- **Change:** `match_id` parameter moved from query string to request body
- **New API Behavior:**
  - `POST /api/v1/baby` - Body: `{"match_id": "<uuid>"}`
  - `GET /api/v1/baby` - Body: `{"match_id": "<uuid>"}`
  - `GET /api/v1/me/babies` - Query params: `user_id`, `skip`, `limit`

**Baby Generation Feature** (previously documented):
- AI-powered baby image generation from matched faces
- `babies` table in PostgreSQL
- FAL.AI integration (`fal-ai/nano-banana/edit` model)
- Service: `app/services/baby_service.py`
- Routes: `app/routes/baby_routes.py`
- External image hosting (FAL.AI CDN)
- Supports multiple generations per match

---

#### 3. Updated Documentation
- **Backend Docs:** `docs/API-specs.MD` - Complete API reference updated
- **New Tools:** `tools/rebuild.sh` - Database rebuild script

---

#### 4. Migration Notes
**Breaking Changes:**
- OAuth endpoints no longer functional
- All existing JWT tokens from legacy OAuth must be regenerated via Supabase Auth
- Frontend must use Supabase client for authentication
- Baby generation endpoints now expect JSON body instead of query params

**Action Required (Frontend):**
- Update authentication flow to use Supabase exclusively
- Remove OAuth callback handlers
- Update baby generation API calls (query → body params)
- Ensure Supabase JWT tokens are properly injected in Axios client

---

### October 2025 - Type-Safe Environment Configuration 🔧

**Environment Variable System Overhaul (Completed 2025-10-28)**

Migrated to `@t3-oss/env-nextjs` for fully type-safe, validated environment variables.

**Key Changes:**

1. **Centralized Configuration** (`src/config/env.ts`)
   - ✅ All environment variables defined with Zod schemas
   - ✅ Runtime validation at build time
   - ✅ Full TypeScript support with auto-completion
   - ✅ Replaced all `process.env` usage with typed `env` import

2. **Updated Variables:**
   - `NEXT_PUBLIC_BASE_API_URL` - API base URL (default: `/api`)
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (validated)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for admin operations
   - `SUPABASE_SIGNED_URL_TTL` - Configurable signed URL timeout (default: 86400s / 24 hours)
   - `DEV_ALLOW_NON_EDU_EMAILS` - Allow non-.edu emails in development (default: false)
   - `PYTHON_AI_SERVICE_URL` - Python AI service endpoint
   - `PYTHON_AI_SERVICE_API_KEY` - AI service authentication
   - `FAL_AI_API_KEY` - FAL.AI API key
   - `FAL_BABY_MODEL_ID` - FAL.AI model (default: `fal-ai/nano-banana/edit`)

3. **Code Updates (12+ files):**
   - ✅ Updated all API routes to use `env.SUPABASE_SIGNED_URL_TTL`
   - ✅ Replaced hardcoded `3600` timeout values with configurable env var
   - ✅ All Supabase clients use validated environment variables
   - ✅ AI service integrations use typed configuration
   - ✅ Removed non-null assertions (`!`) from environment access

4. **Benefits:**
   - 🎯 **Type Safety:** Auto-completion and compile-time validation
   - 🛡️ **Runtime Validation:** Invalid values caught at build time
   - 📝 **Self-Documenting:** Clear schemas show expected types and defaults
   - 🔧 **Configurable:** Easy to change settings per environment (dev/staging/prod)
   - 🚀 **Better DX:** No more undefined variables at runtime

**Breaking Changes:**
- ⚠️ Removed `.env` file structure changed (see `.env.example`)
- ⚠️ Direct `process.env` usage no longer allowed
- ⚠️ Must use `import { env } from "@/config/env"` pattern

**Migration Example:**
```typescript
// Before
const ttl = Number(process.env.SUPABASE_SIGNED_URL_TTL || "3600");
const apiKey = process.env.FAL_AI_API_KEY!;

// After
import { env } from "@/config/env";
const ttl = env.SUPABASE_SIGNED_URL_TTL;  // Type: number, validated
const apiKey = env.FAL_AI_API_KEY;        // Type: string, validated
```

**Related Documentation:**
- [Environment Variables SOP](./sop/environment-variables.md) - Complete configuration guide
- [Project Architecture](./system/project_architecture.md) - Updated with env config details

---

**Last Updated:** 2025-10-28

**Maintained By:** Engineering Team
