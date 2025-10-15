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

> ⚠️ This section is currently empty. Documentation will be added as new features are planned and implemented.

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

**Additional SOPs to document:**
- How to add a new page/route
- How to create a new API endpoint
- How to add database migrations
- How to deploy to production
- How to handle authentication flows
- How to add real-time features
- How to optimize queries & performance
- How to write effective tests

---

## Key Concepts

### Frontend Architecture

**Framework:** React 19 + TypeScript + Vite

**Routing:** TanStack Router (file-based)
- Routes are auto-generated from `src/routes/`
- Protected routes use `_authenticated/` directory
- Error pages in `(errors)/` directory

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
| Build Tool | Vite 7.1 |
| Routing | TanStack Router 1.130 |
| Server State | TanStack Query 5.86 |
| Client State | Zustand 5.0 |
| Styling | Tailwind CSS 4.0 |
| UI Components | Radix UI + shadcn/ui |
| Backend Client | Supabase JS 2.58 |
| HTTP Client | Axios 1.11 |
| Validation | Zod 4.1 |
| Animations | Framer Motion 12.23 |

### Backend
| Category | Technology |
|----------|-----------|
| Framework | Flask |
| Language | Python 3.x |
| AI Models | InsightFace (face recognition), FAL.AI (image generation) |
| Vector DB | Qdrant |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Task Queue | Celery + Redis |
| Container | Docker |
| Dependencies | fal-client (FAL.AI SDK) |

---

## Development Workflow

### Running Locally

**Frontend:**
```bash
cd frontend
bun install
bun run dev  # http://localhost:3000
```

**Backend:**
```bash
cd backend
docker-compose up -d  # API on port 5000
```

### Environment Setup

**Frontend `.env`:**
```env
VITE_BASE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<key>
```

**Backend `.env`:**
```env
SUPABASE_URL=<url>
SUPABASE_KEY=<service-key>
SUPABASE_SIGNED_URL_TTL=3600
QDRANT_URL=<url>
QDRANT_API_KEY=<key>
GOOGLE_CLIENT_ID=<oauth-id>
GOOGLE_CLIENT_SECRET=<oauth-secret>
FAL_AI_API_KEY=<fal-api-key>
FAL_BABY_MODEL_ID=fal-ai/nano-banana/edit
FRONTEND_URL=http://localhost:3000
```

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
├── features/          # Feature modules (auth, matching)
│   └── matching/
│       ├── api/       # API calls + hooks
│       ├── components/# Feature UI
│       ├── hooks/     # Custom hooks
│       └── store/     # Feature state
├── routes/            # File-based routing
│   ├── _authenticated/# Protected routes
│   ├── auth/         # Auth pages
│   └── (errors)/     # Error pages
├── stores/            # Global Zustand stores
├── lib/               # Utilities & configs
│   ├── api-client.ts # Axios instance
│   ├── supabase.ts   # Supabase client
│   └── react-query.ts# Query config
├── components/        # Shared components
│   └── ui/           # Radix UI primitives
└── types/            # TypeScript types
```

### Backend Structure
```
app/
├── routes/           # API endpoints
│   ├── auth_routes.py
│   ├── faces_routes.py
│   ├── matches_routes.py
│   ├── reactions_routes.py
│   ├── celebrities_routes.py
│   └── baby_routes.py      # Baby generation endpoints
├── services/         # Business logic
│   ├── baby_service.py     # FAL.AI integration
│   ├── user_service.py
│   └── storage_helper.py
├── tasks/            # Celery tasks
└── schemas/          # Data validation
```

---

## Common Tasks

### Adding a New Frontend Route

1. Create file in `src/routes/`:
   - Public: `src/routes/my-page.tsx`
   - Protected: `src/routes/_authenticated/my-page.tsx`

2. Export route configuration:
   ```typescript
   export const Route = createFileRoute('/my-page')({
     component: MyPage,
   });
   ```

3. Router auto-generates route tree

### Adding a New API Endpoint

**Frontend Side:**
1. Create API file: `src/features/<feature>/api/my-action.ts`
2. Define API function + React Query hook
3. Export for component use

**Backend Side:**
1. Add route in `app/routes/<feature>_routes.py`
2. Implement handler with auth middleware
3. Update API documentation

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
- Clear Vite cache: `rm -rf node_modules/.vite`
- Reinstall dependencies: `bun install`

**Auth not working:**
- Check Supabase Auth settings
- Verify environment variables
- Check browser console for auth errors

**API calls failing:**
- Verify backend is running (`docker-compose ps`)
- Check CORS settings in backend
- Inspect network tab for error details

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

- [TanStack Router Docs](https://tanstack.com/router)
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

### October 2025 - Baby Generation Feature 👶

**New Feature:** AI-powered baby image generation from matched faces

**Backend Changes:**
- Added `babies` table to PostgreSQL schema
- Integrated FAL.AI image generation service
- New API endpoints:
  - `POST /api/v1/baby` - Generate baby from match
  - `GET /api/v1/baby` - Get baby for specific match
  - `GET /api/v1/me/babies` - List all user's generated babies
- New service: `app/services/baby_service.py`
- New routes: `app/routes/baby_routes.py`

**Database Schema:**
- `babies` table with columns: `id`, `match_id`, `generated_by_profile_id`, `image_url`, `created_at`
- Indexes on `match_id` and `created_at`
- Foreign key relationships with cascade/set null behaviors

**Environment Variables Added:**
- `FAL_AI_API_KEY` - Required for baby generation
- `FAL_BABY_MODEL_ID` - Optional model override
- `SUPABASE_SIGNED_URL_TTL` - Signed URL expiration time

**Technical Details:**
- Uses `fal-ai/nano-banana/edit` model for image generation
- Synchronous API calls (blocking)
- Supports multiple baby generations per match
- Images hosted on FAL.AI CDN (external URLs)
- Generation time: ~3-5 seconds

**Frontend Integration Required:**
- Add TypeScript types for baby API responses
- Create API client functions & React Query hooks
- Build UI components for baby generation & gallery
- Add routes for baby-related pages

---

**Last Updated:** 2025-10-15

**Maintained By:** Engineering Team
