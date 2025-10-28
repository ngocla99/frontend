# Project Architecture

**Related Docs:** [Database Schema](./database_schema.md) | [README](./../README.md)

## Project Overview

**Project Name:** AI Face Matching Application (Fuzed)

**Description:** A web application that uses facial recognition AI to match users based on facial similarity. Users can upload photos, discover matches with other users, compare themselves with celebrities, and view real-time matches with similarity scores.

**Tech Stack:**
- **Frontend:** React 19, TypeScript, Next.js 16, TanStack Query
- **Backend:** Python Flask, Supabase (PostgreSQL), Qdrant (Vector DB), InsightFace (AI)
- **Authentication:** Supabase Auth (Magic Link + PKCE)
- **Infrastructure:** Docker, Celery, Redis

---

## Frontend Architecture

### Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.0.0 | UI Framework |
| TypeScript | 5.7.2 | Type Safety |
| Next.js | 16.0.0 | Framework & Routing |
| TanStack Query | 5.86.0 | Server State Management |
| Zustand | 5.0.8 | Client State Management |
| Tailwind CSS | 4.0.6 | Styling Framework |
| Radix UI | Various | Accessible UI Primitives |
| Supabase JS | 2.58.0 | Backend Client & Auth |
| Axios | 1.11.0 | HTTP Client |
| Zod | 4.1.5 | Schema Validation |
| Framer Motion | 12.23.12 | Animations |

### Project Structure

```
web/
├── .agent/                    # Documentation & context
│   ├── system/               # System architecture docs
│   ├── tasks/                # Feature PRDs & implementation plans
│   └── sop/                  # Standard operating procedures
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Root layout (providers, fonts)
│   │   ├── page.tsx          # Home page
│   │   ├── providers.tsx     # React Query & Theme providers
│   │   ├── error.tsx         # Error boundary
│   │   ├── not-found.tsx     # 404 page
│   │   ├── global-error.tsx  # Global error handler
│   │   ├── (authenticated)/ # Protected routes group
│   │   │   ├── layout.tsx   # Auth guard layout
│   │   │   ├── live-matches/page.tsx
│   │   │   ├── your-matches/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── onboarding/page.tsx
│   │   │   ├── 401/page.tsx
│   │   │   └── 403/page.tsx
│   │   ├── auth/            # Auth routes
│   │   │   ├── layout.tsx   # Auth-specific layout
│   │   │   ├── sign-in/page.tsx
│   │   │   ├── sign-up/page.tsx
│   │   │   └── callback/page.tsx
│   │   └── 503/page.tsx     # Service unavailable
│   ├── components/           # Shared UI components
│   │   ├── ui/              # Radix UI & shadcn components
│   │   ├── layout/          # Layout components (Header, RootLayout)
│   │   ├── errors/          # Error boundary components
│   │   ├── confirm/         # Alert confirmation dialogs
│   │   └── kokonutui/       # Third-party UI components
│   ├── features/            # Feature-based modules
│   │   ├── auth/           # Authentication feature
│   │   │   ├── api/        # Auth API calls
│   │   │   └── components/ # Auth UI components
│   │   └── matching/       # Face matching feature
│   │       ├── api/        # Matching API calls
│   │       ├── components/ # Matching UI components
│   │       ├── constants/  # Matching constants & data
│   │       ├── hooks/      # Custom matching hooks
│   │       ├── store/      # Matching-specific stores
│   │       └── utils/      # Matching utilities
│   ├── stores/             # Global state management (Zustand)
│   │   └── auth-store.ts   # Authentication state
│   ├── hooks/              # Shared custom hooks
│   ├── lib/                # Shared utilities & configs
│   │   ├── api-client.ts   # Axios instance with interceptors
│   │   ├── supabase.ts     # Supabase client
│   │   ├── react-query.ts  # React Query config
│   │   ├── utils.ts        # Utility functions
│   │   └── constants/      # Global constants
│   ├── types/              # TypeScript type definitions
│   │   └── api.ts          # API response types
│   ├── contexts/           # React contexts
│   │   └── theme-context.tsx # Theme provider
│   └── styles/             # Global styles
├── public/                 # Static assets
├── .env                    # Environment variables
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── biome.json             # Linter configuration
└── package.json           # Dependencies & scripts
```

### Key Architecture Patterns

#### 1. File-Based Routing (Next.js App Router)

Routes are automatically generated from the file structure in `src/app/`:

**Key Files:**
- `layout.tsx` - Root layout with providers, fonts, error boundaries
- `page.tsx` - Page component for the route
- `error.tsx` - Error boundary for route segment
- `not-found.tsx` - 404 page
- `global-error.tsx` - Global error handler

**Route Groups:**
- `(authenticated)/` - Protected routes requiring authentication (parentheses = not in URL)
- `auth/` - Authentication flow pages (sign-in, sign-up, callback)

**Protected Routes:**
Route guards are implemented using layout components:
```typescript
// app/(authenticated)/layout.tsx
export default function AuthenticatedLayout({ children }) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) router.push("/auth/sign-in");
  }, [session, router]);

  if (!session) return null;
  return <>{children}</>;
}
```

**Navigation:**
```typescript
import { useRouter, usePathname } from "next/navigation";

const router = useRouter();
const pathname = usePathname();

router.push("/profile");       // Navigate
router.back();                 // Go back
router.refresh();              // Refresh current route
```

#### 2. Feature-Based Organization

Features are organized by domain (auth, matching) with co-located code:

```
features/
└── matching/
    ├── api/           # API integration layer
    ├── components/    # Feature-specific UI
    ├── hooks/         # Feature-specific hooks
    ├── store/         # Feature-specific state
    └── utils/         # Feature-specific utilities
```

Benefits:
- High cohesion within features
- Easy to locate related code
- Scalable as features grow

#### 3. State Management Strategy

**Server State (TanStack Query):**
- All server data fetching & caching
- Automatic background refetching
- Optimistic updates
- Query invalidation on mutations

**Client State (Zustand):**
- Authentication state (persisted to localStorage)
- UI state that needs global access
- Atomic selectors for performance

**Key Pattern:**
```typescript
// Zustand store with atomic selectors
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      actions: {
        setUser: (user) => set({ user }),
        // ... other actions
      }
    }),
    { name: 'auth-store' }
  )
);

// Atomic exports prevent unnecessary re-renders
export const useUser = () => useAuthStore((state) => state.user);
export const useAuthActions = () => useAuthStore((state) => state.actions);
```

#### 4. API Layer Architecture

**HTTP Client (Axios):**
- Base URL configuration from environment
- Request interceptor for Supabase JWT token injection
- Response interceptor for token refresh & error handling
- Automatic JSON transformation

**API Organization:**
```typescript
// Feature-based API modules
features/matching/api/
├── get-live-match.ts    # API call + React Query hooks
├── get-user-match.ts
├── react-to-match.ts
└── upload-face.ts

// Each module exports:
// 1. API function
export const getLiveMatchApi = (input: LiveMatchInput): Promise<LiveMatchApi[]>

// 2. Query options factory
export const getLiveMatchQueryOptions = (input: LiveMatchInput) => queryOptions({...})

// 3. Custom hooks
export const useLiveMatch = ({input, queryConfig}: Options) => useQuery({...})
```

#### 5. Authentication Flow

**Supabase Auth (Magic Link + PKCE):**
- Primary authentication method using Supabase's passwordless email flow
- PKCE (Proof Key for Code Exchange) for enhanced security
- No custom JWT generation - all tokens issued by Supabase

**Flow:**
```
User → Magic Link Email → PKCE Verification → Supabase Session → API Client
                                              ↓
                                         Auth Store (Zustand)
                                              ↓
                                    Router Context (isAuthenticated)
                                              ↓
                                      Protected Routes
```

**Session Management:**
- Stored in localStorage via Zustand persist
- Auto-refresh via Supabase client
- Supabase JWT token injection via Axios interceptor
- 401 errors trigger token refresh or sign-out redirect

**Backend Token Verification:**
- All endpoints exclusively accept Supabase JWT tokens
- Token validation via `verify_supabase_token()` helper
- Profile lookup by email from token claims
- Automatic profile creation for first-time users

#### 6. Real-Time Updates (Supabase Realtime)

Uses Supabase's real-time subscriptions for live match updates:

```typescript
// Subscribe to database changes
useSupabaseRealtime({
  table: 'matches',
  event: 'INSERT',
  onData: (payload) => {
    // Invalidate queries to refetch with full data
    queryClient.invalidateQueries(['matching', 'top'])
  }
})
```

**Strategy:**
- Listen for INSERT events on `matches` table
- Invalidate React Query cache to trigger refetch
- Backend provides complete data with user information

#### 7. Type Safety

**TypeScript Strategy:**
- Strict mode enabled
- API response types in `types/api.ts`
- Zod schemas for runtime validation
- TanStack Router type generation

**Key Types:**
```typescript
// API Response Types
export type UserApi = {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: Gender | string;
  default_face_id?: string;
  image?: string;
  school?: string;
};

export type LiveMatchApi = {
  id: string;
  similarity_score: number;
  users: {
    a: { id: string; name: string; image: string };
    b: { id: string; name: string; image: string };
  };
  reactions: Record<string, unknown>;
  my_reaction: Reaction[];
  created_at: string;
};
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         User Action                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Component                            │
│  - Calls custom hook (useLiveMatch, useUploadFace, etc.)   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Query Hook                           │
│  - Manages caching, loading states, error handling          │
│  - Calls API function                                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Client (Axios)                         │
│  - Injects Supabase JWT token                               │
│  - Handles 401 with token refresh                           │
│  - Transforms response                                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (Flask)                         │
│  - Validates auth token                                      │
│  - Processes face recognition (InsightFace)                 │
│  - Queries Qdrant vector DB                                 │
│  - Updates Supabase PostgreSQL                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Response Flow                             │
│  1. Backend → API Client (JSON)                             │
│  2. API Client → React Query (Transformed)                  │
│  3. React Query → Component (Cached & Typed)                │
│  4. Component → UI Update                                   │
└─────────────────────────────────────────────────────────────┘
```

### Performance Optimizations

1. **Code Splitting:**
   - Automatic route-based code splitting via TanStack Router
   - `autoCodeSplitting: true` in router config

2. **React Query Caching:**
   - 60s stale time for most queries
   - Background refetching in production
   - Infinite query pagination with `getNextPageParam`

3. **Zustand Atomic Selectors:**
   - Prevent unnecessary re-renders
   - Export granular selectors instead of entire store

4. **Image Optimization:**
   - Lazy loading with Intersection Observer
   - Progressive image loading
   - Cloudflare/Supabase CDN for static assets

5. **Bundle Size:**
   - Tree-shaking with Vite
   - Dynamic imports for heavy features
   - Radix UI (lightweight, tree-shakeable)

### Security Considerations

1. **Authentication:**
   - PKCE flow for Supabase Auth
   - Supabase JWT tokens (no custom JWT generation)
   - Token refresh on 401 errors
   - Automatic sign-out on refresh failure

2. **API Security:**
   - Bearer token authentication
   - CORS configured for specific origins
   - No sensitive data in localStorage (only session tokens)

3. **Input Validation:**
   - Zod schemas for form validation
   - File type validation for uploads
   - Max file size enforcement (15MB)

4. **Route Protection:**
   - `beforeLoad` guards on protected routes
   - Context-based auth checks
   - Redirect to sign-in with return URL

---

## Backend Architecture

### Overview

The backend is built with **Next.js API Routes** providing a TypeScript-first backend layer with direct Supabase integration.

### Technology Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js API Routes** | Backend API layer (TypeScript) |
| FAL.AI | AI image generation for baby feature |
| Supabase | PostgreSQL database, storage, auth, realtime |
| @supabase/ssr | Server-side Supabase client for Next.js |

### Project Structure

#### Next.js API Routes

```
web/src/app/api/
├── auth/
│   └── me/
│       └── route.ts         # GET/PATCH current user profile
├── baby/
│   ├── route.ts             # POST/GET baby generation
│   └── list/
│       └── route.ts         # GET baby list
├── faces/
│   ├── route.ts             # GET/POST faces
│   └── [id]/
│       └── route.ts         # DELETE face by ID
├── matches/
│   ├── top/
│   │   └── route.ts         # GET top matches
│   ├── celebrity/
│   │   └── route.ts         # GET celebrity matches
│   ├── user/
│   │   └── [userId]/
│   │       └── route.ts     # GET user matches
│   └── [matchId]/
│       └── react/
│           └── route.ts     # POST/DELETE reactions
```

**Key Features:**
- **Direct Supabase Integration:** All API routes use `@supabase/ssr` for server-side auth
- **Middleware Pattern:** `withSession()` helper provides authenticated session to routes
- **Type Safety:** Full TypeScript integration with Next.js
- **Error Handling:** Centralized error handler via `handleApiError()`
- **Edge Compatible:** Can deploy to Vercel Edge Runtime

**Next.js API Route Middleware Pattern:**

```typescript
// src/lib/middleware/with-session.ts
export const withSession = (handler: AuthenticatedHandler) => {
  return async (request: NextRequest) => {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Pass session context to handler
    return handler({
      request,
      supabase,
      session: { user, profile },
      searchParams: request.nextUrl.searchParams,
    });
  };
};

// Usage in API route
export const GET = withSession(async ({ supabase, session }) => {
  // Authenticated route logic here
  return NextResponse.json({ data: "protected" });
});
```

**Benefits:**
- Automatic authentication check
- Pre-fetched user profile
- Supabase client with auth context
- Type-safe session object
- Reusable across all API routes

### Key Components

#### 1. Baby Generation Pipeline (FAL.AI)

**Purpose:** Generate AI baby images from two matched faces

**Integration Flow:**
```typescript
// 1. Fetch source face images from match
const { data: match } = await supabase
  .from("matches")
  .select(`
    id, face_a_id, face_b_id,
    face_a:faces!matches_face_a_id_fkey (image_path, profile),
    face_b:faces!matches_face_b_id_fkey (image_path, profile)
  `)
  .eq("id", match_id)
  .single();

// 2. Generate signed URLs from Supabase Storage
const [urlA, urlB] = await Promise.all([
  supabase.storage.from("user-images").createSignedUrl(face_a.image_path, 3600),
  supabase.storage.from("user-images").createSignedUrl(face_b.image_path, 3600),
]);

// 3. Call FAL.AI API
const response = await fetch(`https://fal.run/${FAL_MODEL_ID}`, {
  method: "POST",
  headers: {
    Authorization: `Key ${FAL_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt: "A cute baby face that combines features from both parents...",
    image_url: urlA.data.signedUrl,
    num_images: 1,
    guidance_scale: 7.5,
    num_inference_steps: 50,
  }),
});

// 4. Extract generated image URL
const babyImageUrl = response.images[0].url;

// 5. Store in database
const { data: baby } = await supabase
  .from("babies")
  .insert({
    match_id,
    image_url: babyImageUrl,
    parent_a_id: profileA.id,
    parent_b_id: profileB.id,
  })
  .select()
  .single();
```

**Configuration:**
- **API Key:** `FAL_AI_API_KEY` environment variable
- **Model:** `fal-ai/flux/dev` (configurable via `FAL_BABY_MODEL_ID`)
- **Execution:** Synchronous HTTP call
- **Image Storage:** External (FAL.AI CDN URLs)
- **URL TTL:** Signed URLs valid for 1 hour

**Implementation:** `src/app/api/baby/route.ts`

#### 2. API Endpoints

All API endpoints are implemented as **Next.js API Routes** with direct Supabase integration:

**Authentication:**
- `GET /api/auth/me` - Get current user profile (auto-creates if not exists)
- `PATCH /api/auth/me` - Update current user profile

**Baby Generation:**
- `POST /api/baby` - Generate baby from match (`match_id` in body)
- `GET /api/baby?match_id=xxx` - Get baby for match
- `GET /api/baby/list?user_id=xxx` - List all user's babies

**Face Management:**
- `GET /api/faces` - Get user's uploaded faces
- `POST /api/faces` - Upload new face
- `DELETE /api/faces/:id` - Delete face

**Matching:**
- `GET /api/matches/top` - Get top matches (live feed)
- `GET /api/matches/celebrity` - Get celebrity matches
- `GET /api/matches/user/:userId` - Get user's matches

**Reactions:**
- `POST /api/matches/:matchId/react` - React to match
- `DELETE /api/matches/:matchId/react` - Remove reaction

**All endpoints:**
- Use `withSession()` middleware for authentication
- Return JSON responses
- Type-safe with TypeScript
- Direct Supabase client integration

---

## Integration Points

### 1. Frontend ↔ Backend Communication

**Architecture:** Next.js full-stack application with API Routes

**Data Flow:**
```
Frontend Component
  → React Query Hook
    → Fetch API / Axios
      → Next.js API Route Handler (src/app/api/**/route.ts)
        → Supabase Client (@supabase/ssr)
          → PostgreSQL / Storage / Auth
        → FAL.AI API (for baby generation)
```

**Benefits:**
- **Performance:** API routes run on same domain (no CORS)
- **Type Safety:** Full TypeScript integration end-to-end
- **Simplified Auth:** Direct Supabase SSR integration
- **Edge Deployment:** Can deploy to Vercel Edge Runtime
- **Developer Experience:** Single codebase for frontend and backend

### 2. Supabase Integration

**Services Used:**
1. **Auth:** Magic link authentication, session management
2. **Database (PostgreSQL):** User data, matches, reactions
3. **Storage:** Face images, generated content
4. **Realtime:** Live match notifications

**Tables:**
- `users` - User profiles
- `matches` - Face match results
- `user_face_map` - Mapping users to face IDs
- `reactions` - User reactions to matches

### 3. External Services

- **FAL.AI:** AI image generation service for baby feature
  - Model: `fal-ai/flux/dev`
  - Use case: Generate baby images from two face inputs
  - Integration: Direct REST API calls from Next.js
- **Supabase Storage:** Image hosting with CDN for user-uploaded faces
- **Supabase Auth:** Magic link authentication emails

---

## Deployment Architecture

### Development Environment

```
Next.js Development Server:
├── Frontend (React)     - Port 3000
├── API Routes           - Port 3000/api/*
└── (External: Supabase)
```

### Production Environment

```
Vercel Deployment:
├── Frontend (Static + SSR)
├── API Routes (Serverless Functions / Edge Runtime)
└── External Services:
    ├── Supabase (Auth, DB, Storage, Realtime)
    └── FAL.AI (Baby image generation)
```

**Deployment Configuration:**
- **Platform:** Vercel (recommended) or any Node.js host
- **Build Command:** `bun run build`
- **Output Directory:** `.next`
- **Environment Variables:** Set in Vercel dashboard
- **Edge Runtime:** Optional for API routes

---

## Development Workflow

### Starting the Application

**Frontend:**
```bash
cd web
bun install
bun run dev  # Starts Next.js dev server on port 3000
```

**Development URLs:**
- Frontend: http://localhost:3000
- API Routes: http://localhost:3000/api/*

### Environment Variables

**Environment Variables (`.env`):**
```env
# Client-side variables (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<anon-key>

# Server-only variables (no prefix)
FAL_AI_API_KEY=<fal-api-key>
FAL_BABY_MODEL_ID=fal-ai/flux/dev  # Optional, defaults to flux/dev
```

### Code Quality Tools

- **Linter:** Biome (`bun run lint`)
- **Type Checker:** TypeScript (`bun run build`)
- **Testing:** Vitest (`bun run test`)

---

## Key Features

### 1. Face Upload & Management
- User uploads photos to Supabase Storage
- Image optimization and CDN delivery
- Multiple faces per user supported
- Face management (view, delete)

### 2. Live Match Feed
- Real-time display of matches
- Sorted by similarity score (highest first)
- Pagination with infinite scroll
- Supabase Realtime for instant updates
- Reaction aggregation (favorites, likes)

### 3. User-to-User Matching
- View detailed matches with other users
- Reaction system (favorite, etc.)
- Match history tracking
- Profile information display

### 4. AI Baby Generation
- **Generate synthetic baby images from two matched faces**
- **Powered by FAL.AI image generation model**
- **Flow:**
  1. User selects a match
  2. Next.js API route fetches face images from Supabase Storage
  3. Calls FAL.AI API with both face images
  4. Stores generated baby image URL in `babies` table
  5. Returns baby with participant details
- **Features:**
  - Multiple generations per match supported
  - Baby gallery showing all user's generated babies
  - Fast generation (~3-5 seconds)
- **Technical Details:**
  - Model: `fal-ai/flux/dev`
  - Synchronous HTTP call
  - External image hosting (FAL.AI CDN)
  - Signed URLs for source images (1 hour TTL)

### 5. Profile Management
- Edit user profile (name, gender, school)
- Manage uploaded photos
- View match history
- Set default face for matching

---

## Future Considerations

### Scalability
- Implement caching layer for API responses (Redis/Upstash)
- Database read replicas for high traffic
- Edge function optimization for global performance

### Monitoring
- Add error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- API analytics (request rates, latency)
- User behavior analytics

### Security
- Implement rate limiting on API routes
- Content moderation for uploaded images
- Privacy controls for profile visibility
- CAPTCHA for sign-up

---

## Related Documentation

- [Database Schema](./database_schema.md) - Detailed database structure
- [README](./../README.md) - Documentation index
