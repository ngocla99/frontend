# Database Schema

**Related Docs:** [Project Architecture](./project_architecture.md) | [README](./../README.md)

## Overview

The application uses **Supabase PostgreSQL** for relational data and **Qdrant** for vector embeddings. This document details the database schema, relationships, and data flow.

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

## Qdrant Vector Database

### Collection: `faces`

Stores 512-dimensional face embeddings for similarity search.

**Vector Configuration:**
- **Dimensions:** 512
- **Distance Metric:** Cosine similarity
- **Index:** HNSW (Hierarchical Navigable Small World)

**Payload Schema:**

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | `string` | User who owns this face |
| `face_id` | `string` | Unique face identifier (UUID) |
| `image_url` | `string` | URL to face image in Supabase Storage |
| `uploaded_at` | `timestamp` | Upload time |
| `is_celebrity` | `boolean` | Whether this is a celebrity face |
| `celebrity_name` | `string` | Celebrity name (if applicable) |

**Usage:**
1. Store face embeddings after InsightFace processing
2. Perform similarity search to find top K matches
3. Filter by `is_celebrity` for celebrity-only matching
4. Return `face_id` to join with PostgreSQL data

**Search Query Example:**
```python
results = qdrant_client.search(
    collection_name="faces",
    query_vector=uploaded_face_embedding,  # 512D vector
    limit=20,
    score_threshold=0.5,  # Minimum similarity
    query_filter={
        "must_not": [
            {"key": "user_id", "match": {"value": current_user_id}}
        ]
    }
)
```

---

## Entity Relationships

```
┌─────────────────┐
│     users       │
│ PK: id          │
│ UK: user_id     │
│ UK: email       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐         ┌──────────────────┐
│ user_face_map   │────────▶│ Qdrant: faces    │
│ PK: id          │  joins  │ vector + payload │
│ FK: user_id     │────┐    └──────────────────┘
│     face_id     │    │
└────────┬────────┘    │
         │             │
         │ N:M         │
         ▼             ▼
┌─────────────────┐   ┌──────────────────┐
│    matches      │   │   celebrities    │
│ PK: id          │   │ (embedded data)  │
│     face_a_id   │───┘   └──────────────────┘
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
         │    │ FK: generated_by_    │
         │    │     profile_id       │
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

Background Tasks:
┌─────────────────┐
│   live_tasks    │──┐
│ PK: id          │  │ 1:N
│     status      │  │
└─────────────────┘  ▼
                 ┌──────────────────────┐
                 │ live_match_results   │
                 │ PK: id               │
                 │ FK: task_id          │
                 │     source_user_id   │
                 │     target_user_id   │
                 └──────────────────────┘
```

---

## Data Flow Examples

### 1. User Uploads Face

```
1. User uploads image via frontend
   ↓
2. POST /api/v1/faces
   ↓
3. Backend:
   - Validate image
   - Extract face embedding (InsightFace)
   - Upload image to Supabase Storage
   - Store embedding in Qdrant with payload:
     {
       user_id: "user-123",
       face_id: "face-456",
       image_url: "https://storage.supabase.co/...",
       uploaded_at: "2025-10-15T10:30:00Z"
     }
   - Insert record in user_face_map:
     INSERT INTO user_face_map (user_id, face_id)
     VALUES ('user-123', 'face-456')
   ↓
4. Return face details to frontend
```

### 2. Live Match Discovery

```
1. New user uploads face (triggers background matching)
   ↓
2. Celery task:
   - Fetch embedding from Qdrant
   - Search for top 20 similar faces
   - Filter out existing matches
   ↓
3. For each match:
   - INSERT INTO matches (face_a_id, face_b_id, similarity_score)
   - Supabase Realtime publishes INSERT event
   ↓
4. Frontend:
   - Receives realtime event
   - Invalidates React Query cache
   - Refetches live matches with full user data
   ↓
5. Display in live match feed
```

### 3. User Views Match Details

```
1. User clicks on match card
   ↓
2. GET /api/v1/matches/user/:userId
   ↓
3. Backend query:
   SELECT
     m.*,
     ua.name AS user_a_name,
     ub.name AS user_b_name,
     COUNT(DISTINCT m.id) AS match_count
   FROM matches m
   JOIN user_face_map fa ON m.face_a_id = fa.face_id
   JOIN user_face_map fb ON m.face_b_id = fb.face_id
   JOIN users ua ON fa.user_id = ua.user_id
   JOIN users ub ON fb.user_id = ub.user_id
   WHERE (ua.user_id = :current_user OR ub.user_id = :current_user)
     AND (ua.user_id = :target_user OR ub.user_id = :target_user)
   GROUP BY m.id
   ORDER BY m.similarity_score DESC
   ↓
4. Return aggregated match data with user profiles
```

### 4. Celebrity Matching

```
1. User initiates celebrity match
   ↓
2. GET /api/v1/matches/celeb?face_id=face-456
   ↓
3. Backend:
   - Fetch user's face embedding from Qdrant
   - Search Qdrant with filter: is_celebrity = true
   - Retrieve top N celebrity matches
   ↓
4. Enrich results with celebrity metadata
   ↓
5. INSERT INTO matches for each celebrity match
   ↓
6. Return celebrity match results
```

### 5. Baby Generation from Match

```
1. User clicks "Generate Baby" on match detail page
   ↓
2. POST /api/v1/baby
   Body: { "match_id": "<uuid>" }
   ↓
3. Backend:
   - Fetch match record:
     SELECT * FROM matches WHERE id = :match_id
   - Get face images for face_a_id and face_b_id:
     SELECT image_path FROM faces WHERE id IN (face_a_id, face_b_id)
   - Generate signed URLs from Supabase Storage
   ↓
4. Call FAL.AI API (synchronous):
   - POST to fal-ai/nano-banana/edit model
   - Payload: {
       prompt: "make a photo of a baby.",
       image_urls: [signed_url_a, signed_url_b],
       num_images: 1,
       output_format: "jpeg",
       aspect_ratio: "1:1"
     }
   - Receive generated baby image URL
   ↓
5. Store baby record:
   INSERT INTO babies (match_id, generated_by_profile_id, image_url)
   VALUES (:match_id, :current_user_profile_id, :fal_image_url)
   ↓
6. Fetch participant details:
   - Query profiles for face_a and face_b owners
   - Generate signed URLs for participant images
   - Determine "me" vs "other" based on current user
   ↓
7. Return response:
   {
     id: match_id,
     image_url: baby_image_url,
     me: { id, name, image, school },
     other: { id, name, image, school },
     created_at: timestamp
   }
   ↓
8. Frontend:
   - Display generated baby image
   - Store in baby gallery
   - Invalidate baby queries to refresh list
```

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

**Qdrant:**
- Periodic snapshots (configured in Qdrant Cloud)
- Celebrity data can be re-seeded from `celeb-data/`

---

## Related Documentation

- [Project Architecture](./project_architecture.md) - Full system overview
- [README](./../README.md) - Documentation index
