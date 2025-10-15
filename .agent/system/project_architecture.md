# Project Architecture

**Related Docs:** [Database Schema](./database_schema.md) | [README](./../README.md)

## Project Overview

**Project Name:** AI Face Matching Application (Fuzed)

**Description:** A web application that uses facial recognition AI to match users based on facial similarity. Users can upload photos, discover matches with other users, compare themselves with celebrities, and view real-time matches with similarity scores.

**Tech Stack:**
- **Frontend:** React 19, TypeScript, Vite, TanStack Router, TanStack Query
- **Backend:** Python Flask, Supabase (PostgreSQL), Qdrant (Vector DB), InsightFace (AI)
- **Authentication:** Supabase Auth (Magic Link), Legacy Google OAuth
- **Infrastructure:** Docker, Celery, Redis

---

## Frontend Architecture

### Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.0.0 | UI Framework |
| TypeScript | 5.7.2 | Type Safety |
| Vite | 7.1.4 | Build Tool & Dev Server |
| TanStack Router | 1.130.2 | File-based Routing |
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
frontend/
├── .agent/                    # Documentation & context
│   ├── system/               # System architecture docs
│   ├── tasks/                # Feature PRDs & implementation plans
│   └── sop/                  # Standard operating procedures
├── src/
│   ├── app.tsx               # App initialization & providers
│   ├── main.tsx              # Entry point
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
│   ├── routes/             # File-based routes
│   │   ├── __root.tsx      # Root layout
│   │   ├── index.tsx       # Home page
│   │   ├── _authenticated/ # Protected routes group
│   │   ├── auth/           # Auth routes
│   │   └── (errors)/       # Error pages (401, 403, 404, 500, 503)
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
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
├── biome.json             # Linter configuration
└── package.json           # Dependencies & scripts
```

### Key Architecture Patterns

#### 1. File-Based Routing (TanStack Router)

Routes are automatically generated from the file structure in `src/routes/`:

- `__root.tsx` - Root layout with error boundaries
- `index.tsx` - Public home page
- `_authenticated/` - Protected routes requiring authentication
- `auth/` - Authentication flow pages (sign-in, sign-up, callback)
- `(errors)/` - Error pages (grouped, not in URL path)

Route guards are implemented using `beforeLoad` in route configurations.

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
- Request interceptor for auth token injection (Supabase + Legacy OAuth)
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

**Dual Authentication Support:**
1. **Primary:** Supabase Auth (Magic Link / PKCE flow)
2. **Legacy:** Google OAuth (cookie-based)

**Flow:**
```
User → Magic Link Email → Callback Handler → Session Storage → API Client
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
- Token injection via Axios interceptor
- 401 errors trigger token refresh or sign-out redirect

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
│  - Injects auth token (Supabase or OAuth)                   │
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
   - HTTPOnly cookies for legacy OAuth
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

### Technology Stack

| Technology | Purpose |
|-----------|---------|
| Flask | Web framework |
| InsightFace | Face recognition AI model |
| FAL.AI | AI image generation for baby feature |
| Qdrant | Vector database for embeddings |
| Supabase | PostgreSQL database & storage |
| Celery | Background task queue |
| Redis | Celery broker |
| Docker | Containerization |

### Project Structure

```
backend/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── config.py            # Configuration
│   ├── db_bootstrap.py      # Database schema setup
│   ├── celery_app.py        # Celery worker config
│   ├── routes/              # API endpoints
│   │   ├── auth_routes.py   # Authentication endpoints
│   │   ├── faces_routes.py  # Face upload & management
│   │   ├── matches_routes.py # Match queries
│   │   ├── reactions_routes.py # Reactions to matches
│   │   ├── celebrities_routes.py # Celebrity matches
│   │   ├── baby_routes.py   # Baby generation endpoints
│   │   └── legacy_routes.py # Legacy OAuth routes
│   ├── services/            # Business logic
│   │   ├── baby_service.py  # Baby generation service
│   │   ├── user_service.py  # User profile management
│   │   └── storage_helper.py # Supabase Storage helpers
│   ├── tasks/               # Celery background tasks
│   ├── schemas/             # Data validation schemas
│   ├── models/              # Data models
│   ├── middlewares/         # Request/response middleware
│   └── tests/               # Unit & integration tests
├── tools/                   # Utility scripts
│   ├── fal_ai_generate.py   # FAL.AI test script
│   ├── init-db.sql          # Database initialization
│   └── bulk_add_celebrities.py # Celebrity data loader
├── celeb-data/             # Celebrity face embeddings
├── docs/                   # Backend documentation
│   ├── API-specs.MD         # Complete API reference
│   ├── api-list.mdc         # API endpoint list
│   └── app-flow.mdc         # Application flow diagrams
├── Dockerfile              # Main Docker image
├── Dockerfile.api          # API service image
├── Dockerfile.worker       # Celery worker image
├── docker-compose.yml      # Multi-container setup
├── requirements.txt        # Python dependencies (includes fal-client)
└── run.py                 # Application entry point
```

### Key Components

#### 1. Face Recognition Pipeline

**InsightFace Integration:**
```python
# Initialize face recognition model
face_app = FaceAnalysis(providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(640, 640))

# Process uploaded image
faces = face_app.get(image)
embedding = faces[0].embedding  # 512-dimensional vector
```

**Flow:**
1. User uploads photo → Flask endpoint
2. Image validation & preprocessing
3. InsightFace extracts face embedding (512D vector)
4. Store image in Supabase Storage
5. Store embedding in Qdrant vector database
6. Create metadata record in PostgreSQL

#### 2. Vector Search (Qdrant)

**Purpose:** Fast similarity search for face embeddings

**Collection Schema:**
- **Vector:** 512-dimensional face embedding
- **Payload:** user_id, face_id, metadata

**Similarity Search:**
```python
# Find top N similar faces
results = qdrant_client.search(
    collection_name="faces",
    query_vector=uploaded_face_embedding,
    limit=20,
    score_threshold=0.5  # Minimum similarity
)
```

#### 3. Background Task Queue (Celery)

**Purpose:** Handle computationally expensive operations asynchronously

**Tasks:**
- Batch celebrity matching
- Periodic similarity matrix updates
- Image processing pipelines

**Configuration:**
- **Broker:** Redis
- **Result Backend:** Redis
- **Concurrency:** Multi-worker setup

#### 4. Baby Generation Pipeline (FAL.AI)

**Purpose:** Generate AI baby images from two matched faces

**Integration Flow:**
```python
# 1. Fetch source face images from match
match = get_match(match_id)
face_urls = get_signed_urls([match.face_a_id, match.face_b_id])

# 2. Call FAL.AI asynchronously (runs synchronously in blocking mode)
response = fal_client.run_async(
    "fal-ai/nano-banana/edit",
    arguments={
        "prompt": "make a photo of a baby.",
        "image_urls": face_urls,
        "num_images": 1,
        "output_format": "jpeg",
        "aspect_ratio": "1:1"
    }
)

# 3. Extract generated image URL
baby_image_url = response['images'][0]['url']

# 4. Store in database
insert_baby(match_id, baby_image_url, generated_by=current_user)
```

**Configuration:**
- **API Key:** `FAL_AI_API_KEY` environment variable
- **Model:** `fal-ai/nano-banana/edit` (configurable via `FAL_BABY_MODEL_ID`)
- **Execution:** Synchronous blocking call (future: async with Celery)
- **Image Storage:** External (FAL.AI CDN URLs)
- **TTL:** Signed URLs expire based on `SUPABASE_SIGNED_URL_TTL`

**Service Layer (`app/services/baby_service.py`):**
- `create_baby_from_match_service()` - Generate & store baby
- `get_baby_for_match_service()` - Get latest baby for match
- `list_my_generated_babies_service()` - List user's generated babies
- `_get_match_participants_signed()` - Resolve match participants
- `_fal_generate_baby_async()` - FAL.AI API wrapper

#### 5. API Endpoints

**Authentication:**
- `POST /api/v1/auth/magic-link` - Send magic link email
- `GET /api/v1/auth/callback` - Handle OAuth callback
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Sign out

**Face Management:**
- `POST /api/v1/me/faces` - Upload face photo
- `GET /api/v1/me/faces` - Get user's uploaded faces
- `DELETE /api/v1/faces/:id` - Delete face

**Matching:**
- `GET /api/v1/matches/top` - Get top matches (live feed)
- `GET /api/v1/me/matches` - Get user's matches (filter: user/celeb)
- `GET /api/v1/feed` - Get live match feed
- `POST /api/v1/match` - Calculate similarity between two faces

**Reactions:**
- `POST /api/v1/matches/:matchId/react` - React to match (favorite, etc.)
- `DELETE /api/v1/matches/:matchId/react` - Remove reaction

**Baby Generation:**
- `POST /api/v1/baby?match_id=<uuid>` - Generate baby from match
- `GET /api/v1/baby?match_id=<uuid>` - Get latest baby for match
- `GET /api/v1/me/babies` - List all user's generated babies (supports filtering by user_id)

---

## Integration Points

### 1. Frontend ↔ Backend Communication

**Protocol:** REST API over HTTPS
**Authentication:** Bearer token in `Authorization` header
**Content Type:** `application/json`

**Request Flow:**
```
Frontend Component
  → React Query Hook
    → Axios Client (with auth interceptor)
      → Flask API Endpoint
        → Service Layer
          → Database/Qdrant/Supabase
```

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

### 3. Qdrant Vector Database

**Purpose:** Fast similarity search for 512D face embeddings

**Integration:**
- Backend stores embeddings after face processing
- Search query returns top K similar faces
- Results are enriched with user data from PostgreSQL

### 4. External Services

- **FAL.AI:** AI image generation service for baby feature
  - Model: `fal-ai/nano-banana/edit`
  - Use case: Generate baby images from two face inputs
  - Integration: Python `fal-client` SDK
- **Cloudflare:** CDN & DDoS protection (optional)
- **Supabase Storage:** Image hosting with CDN for user-uploaded faces
- **SendGrid/Email Service:** Magic link emails (via Supabase Auth)

---

## Deployment Architecture

### Development Environment

```
Docker Compose Stack:
├── api (Flask)          - Port 5000
├── worker (Celery)      - Background tasks
├── redis                - Task queue
└── (External: Supabase, Qdrant Cloud)
```

### Production Environment (Assumed)

```
Frontend:
└── Vercel (Static hosting + CDN)

Backend:
├── API Servers (Flask + Gunicorn)
├── Celery Workers (background processing)
├── Redis (task queue)
└── External Services:
    ├── Supabase (Auth, DB, Storage, Realtime)
    └── Qdrant Cloud (Vector DB)
```

---

## Development Workflow

### Starting the Application

**Frontend:**
```bash
cd frontend
bun install
bun run dev  # Starts on port 3000
```

**Backend:**
```bash
cd backend
docker-compose up -d  # Starts API + Worker + Redis
```

### Environment Variables

**Frontend (`.env`):**
```env
VITE_BASE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<key>
VITE_WHITELIST_EMAIL_DOMAINS=gmail.com
```

**Backend (`.env`):**
```env
# Authentication
GOOGLE_CLIENT_ID=<oauth-client-id>
GOOGLE_CLIENT_SECRET=<oauth-secret>

# Supabase (Database, Storage, Auth)
SUPABASE_URL=<supabase-url>
SUPABASE_KEY=<supabase-service-key>
SUPABASE_SIGNED_URL_TTL=3600  # Signed URL expiration (optional, default 3600s)

# Qdrant (Vector Database)
QDRANT_URL=<qdrant-url>
QDRANT_API_KEY=<qdrant-key>

# FAL.AI (Baby Generation)
FAL_AI_API_KEY=<fal-api-key>
FAL_BABY_MODEL_ID=fal-ai/nano-banana/edit  # Optional, default model

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Code Quality Tools

**Frontend:**
- **Linter:** Biome (`bun run lint`)
- **Type Checker:** TypeScript (`bun run build`)
- **Testing:** Vitest (`bun run test`)

**Backend:**
- **Linter:** Flake8 / Black (assumed)
- **Testing:** pytest (assumed)

---

## Key Features

### 1. Face Upload & Processing
- User uploads photo
- AI extracts face embedding (InsightFace)
- Stored in Qdrant vector DB for matching
- Image saved to Supabase Storage with CDN delivery
- Multiple faces per user supported

### 2. Live Match Feed
- Real-time display of new matches as they're discovered
- Sorted by similarity score (highest first)
- Pagination with infinite scroll
- Supabase Realtime for instant updates
- Reaction aggregation (favorites, likes)

### 3. User-to-User Matching
- View detailed matches with other users
- See all face-to-face comparisons
- Aggregate similarity scores across multiple photos
- Reaction system (favorite, etc.)
- Filter by school, gender
- Match history tracking

### 4. Celebrity Matching
- Compare user faces to pre-computed celebrity database
- Find top lookalike celebrities
- Pre-seeded celebrity embeddings in Qdrant
- Celebrity metadata (name, images)

### 5. AI Baby Generation
- **Generate synthetic baby images from two matched faces**
- **Powered by FAL.AI image generation model**
- **Flow:**
  1. User selects a match
  2. Backend fetches face images from Supabase Storage
  3. Calls FAL.AI API with both face images
  4. Stores generated baby image URL in `babies` table
  5. Returns baby with participant details (me/other)
- **Features:**
  - Multiple generations per match supported
  - Baby gallery showing all user's generated babies
  - Filter babies by specific match partner
  - Latest baby per match displayed by default
  - Fast generation (~3-5 seconds)
- **Technical Details:**
  - Model: `fal-ai/nano-banana/edit`
  - Synchronous execution (blocking API call)
  - External image hosting (FAL.AI CDN)
  - Signed URLs for source images (TTL-based)

### 6. Profile Management
- Edit user profile (name, gender, school)
- Manage uploaded photos
- View match history
- Set default face for matching

---

## Future Considerations

### Scalability
- Implement Redis caching layer for API responses
- Add CDN for image delivery
- Horizontal scaling for Flask API
- Database read replicas for high traffic

### Monitoring
- Add error tracking (Sentry)
- Performance monitoring (Web Vitals)
- API analytics (request rates, latency)
- User behavior analytics

### Security
- Implement rate limiting
- Add CSRF protection
- Content moderation for uploaded images
- Privacy controls for profile visibility

---

## Related Documentation

- [Database Schema](./database_schema.md) - Detailed database structure
- [README](./../README.md) - Documentation index
