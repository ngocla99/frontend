# Database Schema

**Related Docs:** [Project Architecture](./project_architecture.md) | [README](./../README.md)

## Overview

The application uses **Supabase PostgreSQL** for relational data. This document details the database schema, relationships, and data flow.

**Database Access Patterns:**
- **Next.js API Routes:** Direct Supabase client access via `@supabase/ssr`
- **Frontend:** Supabase client for real-time subscriptions and auth

---

## Supabase PostgreSQL Schema

### Table: `users`

Stores user profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user ID |
| `user_id` | `text` | UNIQUE, NOT NULL | Legacy user identifier |
| `username` | `text` | | Display name |
| `email` | `text` | UNIQUE | User email (from auth) |
| `avatar` | `text` | | Profile picture URL |
| `gender` | `text` | | User gender (male, female, other) |
| `location` | `text` | | User location/school |
| `default_face_id` | `text` | | Default face for matching |
| `created_at` | `timestamptz` | DEFAULT now() | Account creation time |
| `updated_at` | `timestamptz` | DEFAULT now() | Last update time |

**Indexes:**
- `idx_users_user_id` on `user_id`
- `ux_users_email` (unique) on `email`

**Usage:**
- Stores user profile data
- Links to Supabase Auth via `user_id` or `email`
- `default_face_id` references the primary face for matching

---

### Table: `user_face_map`

Maps users to their uploaded face IDs (stored in Qdrant).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique mapping ID |
| `user_id` | `text` | NOT NULL | User identifier |
| `face_id` | `text` | NOT NULL | Face embedding ID in Qdrant |
| `created_at` | `timestamptz` | DEFAULT now() | Upload timestamp |
| | | UNIQUE(user_id, face_id) | One face per user |

**Indexes:**
- `idx_user_face_user` on `user_id`
- `idx_user_face_face` on `face_id`

**Usage:**
- Links users to their face embeddings in Qdrant
- Enables multi-face uploads per user
- Used to fetch all faces for a user

**Relationships:**
- `user_id` → `users.user_id`
- `face_id` → Qdrant vector point ID

---

### Table: `matches`

Stores face match results between users or users and celebrities.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique match ID |
| `face_a_id` | `text` | NOT NULL | First face ID |
| `face_b_id` | `text` | NOT NULL | Second face ID |
| `similarity_score` | `float` | NOT NULL | Similarity percentage (0-100) |
| `created_at` | `timestamptz` | DEFAULT now() | Match discovery time |

**Indexes:**
- `idx_matches_face_a` on `face_a_id`
- `idx_matches_face_b` on `face_b_id`
- `idx_matches_score` on `similarity_score DESC`

**Usage:**
- Central table for all match results
- Can represent user-user or user-celebrity matches
- Used for live match feed and match history

**Relationships:**
- `face_a_id`, `face_b_id` → `user_face_map.face_id` OR celebrity face ID

---

### Table: `reactions`

Stores user reactions to matches (favorites, likes, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique reaction ID |
| `user_id` | `text` | NOT NULL | User who reacted |
| `match_id` | `uuid` | NOT NULL | Match being reacted to |
| `reaction_type` | `text` | NOT NULL | Type of reaction (favorite, etc.) |
| `created_at` | `timestamptz` | DEFAULT now() | Reaction timestamp |
| | | UNIQUE(user_id, match_id, reaction_type) | One reaction per match per type |

**Indexes:**
- `idx_reactions_user` on `user_id`
- `idx_reactions_match` on `match_id`

**Usage:**
- Tracks user engagement with matches
- Powers favorites/likes functionality
- Used in aggregated match stats

**Relationships:**
- `user_id` → `users.user_id`
- `match_id` → `matches.id`

---

### Table: `babies`

Stores AI-generated baby images created from user matches.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique baby image ID |
| `match_id` | `uuid` | NOT NULL, FK → matches(id) ON DELETE CASCADE | Match this baby was generated from |
| `generated_by_profile_id` | `uuid` | FK → profiles(id) ON DELETE SET NULL | User who generated this baby |
| `image_url` | `text` | NOT NULL | FAL.AI generated baby image URL |
| `created_at` | `timestamptz` | DEFAULT now() | Generation timestamp |

**Indexes:**
- `idx_babies_match_id` on `match_id`
- `idx_babies_created_at` on `created_at DESC`

**Usage:**
- Stores AI-generated baby images from two matched faces
- Links to the match that generated the baby
- Tracks who generated each baby image
- Supports multiple generations per match
- Used for baby gallery and history features

**Relationships:**
- `match_id` → `matches.id` (CASCADE DELETE: deleting match removes babies)
- `generated_by_profile_id` → `profiles.id` (SET NULL: user deletion preserves babies)

**Business Logic:**
- A match can have multiple baby images (regeneration supported)
- Baby generation is performed by FAL.AI service (async)
- Images are hosted on FAL.AI CDN (external URLs)
- Latest baby per match is shown in UI by default

---

### Table: `live_tasks`

Background task tracking for batch operations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Task ID |
| `status` | `text` | NOT NULL, DEFAULT 'pending' | Task status (pending, running, completed, failed) |
| `created_at` | `timestamptz` | DEFAULT now() | Task creation time |
| `updated_at` | `timestamptz` | DEFAULT now() | Last status update |

**Indexes:**
- `idx_live_tasks_status` on `status`

**Usage:**
- Tracks Celery background tasks
- Used for monitoring long-running operations
- Status polling for UI updates

---

### Table: `live_match_results`

Stores results from batch matching tasks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Result ID |
| `task_id` | `uuid` | NOT NULL | Associated task |
| `source_user_id` | `text` | NOT NULL | User who initiated match |
| `source_face_id` | `text` | NOT NULL | Source face ID |
| `target_user_id` | `text` | NOT NULL | Matched user |
| `target_face_id` | `text` | NOT NULL | Matched face ID |
| `similarity` | `float` | NOT NULL | Similarity score |
| `created_at` | `timestamptz` | DEFAULT now() | Result timestamp |

**Indexes:**
- `idx_live_results_task` on `task_id`
- `idx_live_results_pair` on `(source_user_id, target_user_id)`
- `idx_live_results_similarity` on `similarity DESC`

**Usage:**
- Stores batch matching results
- Used for bulk celebrity matching
- Can be aggregated for analytics

**Relationships:**
- `task_id` → `live_tasks.id`
- `source_user_id`, `target_user_id` → `users.user_id`

---

### Table: `user_similarities`

Pre-computed similarity scores between users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Similarity ID |
| `user_a` | `text` | NOT NULL | First user ID |
| `user_b` | `text` | NOT NULL | Second user ID |
| `similarity` | `float` | NOT NULL | Aggregated similarity |
| `created_at` | `timestamptz` | DEFAULT now() | Computation timestamp |
| | | UNIQUE(user_a, user_b) | One pair per similarity |

**Indexes:**
- `idx_user_sim_pair` on `(user_a, user_b)`
- `idx_user_sim_sim` on `similarity DESC`

**Usage:**
- Caches expensive similarity computations
- Used for fast user-to-user match queries
- Updated periodically via Celery tasks

**Relationships:**
- `user_a`, `user_b` → `users.user_id`

---

## Entity Relationships

```
┌─────────────────┐
│   profiles      │
│ PK: id          │
│ UK: email       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│     faces       │
│ PK: id          │
│ FK: profile_id  │
│     image_path  │
└────────┬────────┘
         │
         │ N:M
         ▼
┌─────────────────┐
│    matches      │
│ PK: id          │
│     face_a_id   │
│     face_b_id   │
│     similarity  │
└────────┬────────┘
         │
         ├─────────┐ 1:N
         │         │
         │ 1:N     ▼
         │    ┌─────────────────────┐
         │    │      babies          │
         │    │ PK: id               │
         │    │ FK: match_id         │
         │    │ FK: parent_a_id      │
         │    │ FK: parent_b_id      │
         │    │     image_url        │
         │    └─────────────────────┘
         │
         ▼
┌─────────────────┐
│   reactions     │
│ PK: id          │
│ FK: user_id     │
│ FK: match_id    │
│     reaction_type│
└─────────────────┘
```

---

## Data Flow Examples

### 1. User Uploads Face

```
1. User uploads image via frontend
   ↓
2. POST /api/faces (Next.js API Route)
   ↓
3. Next.js API Handler:
   - Authenticate via withSession middleware
   - Validate image (file type, size)
   - Upload image to Supabase Storage
   - Insert record in faces table:
     INSERT INTO faces (profile_id, image_path)
     VALUES (current_user_id, 'path/to/image.jpg')
     RETURNING *
   ↓
4. Return face details to frontend
   {
     id: "face-123",
     profile_id: "user-456",
     image_path: "path/to/image.jpg",
     created_at: "2025-10-15T10:30:00Z"
   }
```

### 2. Live Match Discovery

```
1. User queries for live matches
   ↓
2. GET /api/matches/top (Next.js API Route)
   ↓
3. Next.js API Handler:
   - Authenticate via withSession middleware
   - Query matches table with joins:
     SELECT m.*,
            fa.image_path as face_a_image, fa.profile as profile_a,
            fb.image_path as face_b_image, fb.profile as profile_b
     FROM matches m
     JOIN faces fa ON m.face_a_id = fa.id
     JOIN faces fb ON m.face_b_id = fb.id
     ORDER BY m.similarity_score DESC, m.created_at DESC
     LIMIT 20
   ↓
4. Return enriched match data to frontend
   ↓
5. Frontend displays in live match feed
   ↓
6. Supabase Realtime subscription:
   - Listen for INSERT events on matches table
   - On new match → invalidate React Query cache
   - Auto-refetch to show new matches
```

### 3. User Views Match Details

```
1. User clicks on match card
   ↓
2. GET /api/matches/user/:userId (Next.js API Route)
   ↓
3. Next.js API Handler:
   - Authenticate via withSession middleware
   - Query matches with profile joins:
     SELECT m.*,
            fa.image_path as face_a_image,
            fb.image_path as face_b_image,
            pa.name as user_a_name, pa.school as user_a_school,
            pb.name as user_b_name, pb.school as user_b_school
     FROM matches m
     JOIN faces fa ON m.face_a_id = fa.id
     JOIN faces fb ON m.face_b_id = fb.id
     JOIN profiles pa ON fa.profile_id = pa.id
     JOIN profiles pb ON fb.profile_id = pb.id
     WHERE (pa.id = :current_user_id OR pb.id = :current_user_id)
       AND (pa.id = :target_user_id OR pb.id = :target_user_id)
     ORDER BY m.similarity_score DESC
   ↓
4. Return match details with participant profiles
```

### 5. Baby Generation from Match (Next.js API Route)

```
1. User clicks "Generate Baby" on match detail page
   ↓
2. POST /api/baby (Next.js API Route)
   Body: { "match_id": "<uuid>" }
   ↓
3. Next.js API Handler (src/app/api/baby/route.ts):
   - Authenticate via withSession middleware
   - Fetch match record with joins:
     SELECT m.*,
            face_a.image_path, face_a.profile,
            face_b.image_path, face_b.profile
     FROM matches m
     JOIN faces face_a ON m.face_a_id = face_a.id
     JOIN faces face_b ON m.face_b_id = face_b.id
     WHERE m.id = :match_id
   - Generate signed URLs from Supabase Storage (1 hour TTL)
   ↓
4. Call FAL.AI API (synchronous):
   - POST to https://fal.run/fal-ai/flux/dev
   - Headers: Authorization: Key ${FAL_API_KEY}
   - Payload: {
       prompt: "A cute baby face...",
       image_url: signed_url_a,  // Base image
       num_images: 1,
       guidance_scale: 7.5,
       num_inference_steps: 50
     }
   - Receive generated baby image URL
   ↓
5. Store baby record in database:
   INSERT INTO babies (match_id, parent_a_id, parent_b_id, image_url)
   VALUES (:match_id, :profile_a_id, :profile_b_id, :fal_image_url)
   RETURNING *
   ↓
6. Return response with participant details:
   {
     id: baby.id,
     match_id: baby.match_id,
     image_url: baby.image_url,
     created_at: baby.created_at,
     parents: {
       a: { id, name, gender },
       b: { id, name, gender }
     }
   }
   ↓
7. Frontend:
   - Display generated baby image
   - Store in baby gallery
   - Invalidate baby queries to refresh list
```

**Key Changes from Flask Backend:**
- ✅ Now handled by Next.js API route (src/app/api/baby/route.ts)
- ✅ Direct Supabase integration via @supabase/ssr
- ✅ Simplified authentication via withSession middleware
- ✅ Type-safe with TypeScript
- ✅ Same-origin requests (no CORS issues)

---

## Migration & Seeding

### Database Bootstrap

The `db_bootstrap.py` script ensures all required tables exist:

```python
ensure_supabase_tables(supabase)
```

This creates tables if they don't exist using Supabase RPC `sql()` function.

### Celebrity Data Seeding

Celebrity embeddings are pre-computed and loaded into Qdrant:

```bash
# Located in backend/celeb-data/
python tools/load_celebrities.py
```

This populates Qdrant with celebrity face embeddings and metadata.

---

## Indexes & Performance

### Query Optimization

**Most Common Queries:**
1. **Live Match Feed:** `SELECT * FROM matches ORDER BY created_at DESC LIMIT 20`
   - Indexed on `created_at`
   - Pagination via offset/limit

2. **User Match Details:** `SELECT * FROM matches WHERE face_a_id IN (...) OR face_b_id IN (...)`
   - Indexed on `face_a_id`, `face_b_id`

3. **Top Matches by Score:** `SELECT * FROM matches WHERE user_id = ? ORDER BY similarity_score DESC`
   - Indexed on `similarity_score`

4. **Qdrant Vector Search:** `search(query_vector, limit=20)`
   - HNSW index for fast approximate nearest neighbor search
   - O(log N) complexity

### Caching Strategy

- **React Query:** 60s stale time for most queries
- **Backend:** Supabase built-in connection pooling
- **Qdrant:** In-memory vector index for fast search

---

## Data Consistency

### Eventual Consistency

- **Realtime events** may arrive before PostgreSQL read replicas sync
- Frontend handles by invalidating queries, which triggers refetch

### Transaction Boundaries

- Face upload: Atomic (Storage + Qdrant + PostgreSQL)
- Match creation: Non-atomic (Qdrant search → PostgreSQL insert)
- Reactions: Atomic (PostgreSQL transaction)

### Conflict Resolution

- `user_face_map`: Unique constraint on (user_id, face_id) prevents duplicates
- `reactions`: Unique constraint on (user_id, match_id, reaction_type)

---

## Backup & Recovery

**Supabase:**
- Automated daily backups (managed by Supabase)
- Point-in-time recovery available
- Export options for manual backups

---

## Related Documentation

- [Project Architecture](./project_architecture.md) - Full system overview
- [README](./../README.md) - Documentation index
