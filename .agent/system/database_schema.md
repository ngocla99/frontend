# Database Schema

**Related Docs:** [Project Architecture](./project_architecture.md) | [README](./../README.md)

## Overview

The application uses **Supabase PostgreSQL** for relational data. This document details the database schema, relationships, and data flow.

**Database Access Patterns:**
- **Next.js API Routes:** Direct Supabase client access via `@supabase/ssr`
- **Frontend:** Supabase client for real-time subscriptions and auth

---

## Supabase PostgreSQL Schema

### Table: `profiles`

Unified user and celebrity profile storage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY | Unique profile ID (matches auth.users.id for users) |
| `profile_type` | `text` | NOT NULL, CHECK (user, celebrity) | Profile type |
| `name` | `text` | | Display name |
| `email` | `text` | UNIQUE | User email (from Supabase Auth) |
| `gender` | `text` | | Gender (male, female, other) |
| `school` | `text` | | User location/school |
| `role` | `text` | NOT NULL, DEFAULT 'user', CHECK (user, admin) | User role for access control |
| `default_face_id` | `uuid` | FK → faces(id) | Default face for matching |
| `last_seen` | `timestamptz` | | Last online timestamp (presence tracking) |
| `created_at` | `timestamptz` | DEFAULT now() | Account creation time |
| `updated_at` | `timestamptz` | DEFAULT now() | Last update time |

**Indexes:**
- `profiles_pkey` (UNIQUE) on `id`
- `profiles_email_key` (UNIQUE) on `email`
- `idx_profiles_school_gender` on `(school, gender)` WHERE `profile_type = 'user'`
- `idx_profiles_last_seen` on `last_seen`
- `idx_profiles_role` on `role` WHERE `role = 'admin'`

**Usage:**
- Stores both user and celebrity profile data
- Automatically created on Supabase Auth signup (via trigger)
- `last_seen` tracks online/offline status for real-time presence
- `default_face_id` references the primary face for matching

---

### Table: `faces`

Stores face images and embeddings with advanced facial analysis.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique face ID |
| `profile_id` | `uuid` | NOT NULL, FK → profiles(id) | Owner profile |
| `image_path` | `text` | NOT NULL | Storage path in Supabase Storage |
| `image_hash` | `text` | | MD5 hash for deduplication |
| `created_at` | `timestamptz` | DEFAULT now() | Upload timestamp |
| **Vector Embedding** |
| `embedding` | `vector(512)` | | 512D face embedding (InsightFace) |
| **Basic Attributes** |
| `age` | `integer` | | Estimated age (years) |
| `gender` | `text` | | Detected gender (male/female) |
| **Quality Metrics** |
| `quality_score` | `float8` | | Overall quality 0.0-1.0 (higher = better) |
| `blur_score` | `float8` | | Sharpness 0.0-1.0 (Laplacian variance) |
| `illumination_score` | `float8` | | Lighting quality 0.0-1.0 |
| **Geometry & Landmarks** |
| `landmarks_68` | `jsonb` | | 68-point facial landmarks [[x,y], ...] |
| `pose` | `jsonb` | | Head pose {yaw, pitch, roll} in degrees |
| `geometry_ratios` | `jsonb` | | Facial proportions (face_width_height_ratio, eye_spacing, etc.) |
| `symmetry_score` | `float8` | | Facial symmetry 0.0-1.0 (1.0 = perfect) |
| **Appearance** |
| `skin_tone_lab` | `float8[]` | | Dominant skin color in CIELAB [L, a, b] |
| `expression` | `text` | | Dominant expression (happy, neutral, sad, angry, surprise, fear, disgust) |
| `expression_confidence` | `float8` | | Confidence 0.0-1.0 |
| `emotion_scores` | `jsonb` | | All emotion probabilities {happy: 0.85, neutral: 0.10, ...} |
| `analyzed_at` | `timestamptz` | | Timestamp of advanced analysis |

**Indexes:**
- `faces_pkey` (UNIQUE) on `id`
- `idx_faces_profile_id` on `profile_id`
- `ux_faces_profile_hash` (UNIQUE) on `(profile_id, image_hash)` WHERE `image_hash IS NOT NULL`
- `idx_faces_image_hash` on `image_hash`
- **Vector Index:** `faces_embedding_hnsw_idx` (HNSW) on `embedding vector_cosine_ops` WITH (m=16, ef_construction=64)
- **Advanced Attribute Indexes:**
  - `idx_faces_age` on `age` WHERE `age IS NOT NULL`
  - `idx_faces_quality` on `quality_score` WHERE `quality_score IS NOT NULL`
  - `idx_faces_expression` on `expression` WHERE `expression IS NOT NULL`
  - `idx_faces_attributes` on `(age, gender, quality_score, expression)` WHERE `age IS NOT NULL AND quality_score IS NOT NULL`

**Usage:**
- Links users to their face embeddings
- Supports multi-face uploads per user
- HNSW index enables fast similarity search (O(log N))
- Advanced facial analysis for enhanced matching algorithms
- Unique constraint prevents duplicate image uploads per user

**Relationships:**
- `profile_id` → `profiles.id`
- Referenced by `profiles.default_face_id`

---

### Table: `matches`

Stores user-to-user face match results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique match ID |
| `face_a_id` | `uuid` | NOT NULL, FK → faces(id) | First face ID |
| `face_b_id` | `uuid` | NOT NULL, FK → faces(id) | Second face ID |
| `similarity_score` | `float8` | NOT NULL | Similarity 0.0-1.0 (1 - cosine_distance, higher = more similar) |
| `created_at` | `timestamptz` | DEFAULT now() | Match discovery time |

**Indexes:**
- `matches_pkey` (UNIQUE) on `id`
- `idx_matches_face_a_id` on `face_a_id`
- `idx_matches_face_b_id` on `face_b_id`
- `idx_matches_similarity_score` on `similarity_score DESC`

**Usage:**
- Central table for user-to-user match results
- `similarity_score` is computed as `1 - cosine_distance(embedding_a, embedding_b)`
- Migrated from raw distance values on 2025-11-01
- Used for live match feed and match history

**Relationships:**
- `face_a_id`, `face_b_id` → `faces.id`

---

### Table: `celebrities`

Celebrity profiles with face embeddings and advanced attributes for lookalike matching.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique celebrity ID |
| `name` | `text` | NOT NULL | Celebrity full name |
| `bio` | `text` | | Short biography |
| `category` | `text` | | Category (actor, musician, athlete, influencer) |
| `gender` | `text` | CHECK (male, female) | Gender for filtering |
| `image_path` | `text` | NOT NULL | Storage path in celebrity-images bucket |
| `image_hash` | `text` | UNIQUE | MD5 hash for deduplication |
| `created_at` | `timestamptz` | DEFAULT now() | Creation timestamp |
| `updated_at` | `timestamptz` | DEFAULT now() | Last update timestamp |
| **Vector Embedding** |
| `embedding` | `vector(512)` | | 512D InsightFace embedding |
| **Facial Attributes** |
| `age` | `integer` | | Estimated age (InsightFace) |
| `quality_score` | `float8` | | Overall quality 0.0-1.0 (blur + illumination composite) |
| `blur_score` | `float8` | | Blur detection 0.0-1.0 (Laplacian variance) |
| `illumination_score` | `float8` | | Illumination quality 0.0-1.0 |
| `symmetry_score` | `float8` | | Facial symmetry 0.0-1.0 |
| **Geometry & Appearance** |
| `landmarks_68` | `jsonb` | | 68-point facial landmarks |
| `pose` | `jsonb` | | Head pose (yaw, pitch, roll) |
| `geometry_ratios` | `jsonb` | | Facial proportions (face_width_height_ratio, eye_spacing, etc.) |
| `skin_tone_lab` | `float8[]` | | Dominant skin color in CIELAB [L, a, b] |
| **Expression** |
| `expression` | `text` | | Dominant expression (neutral, happy, sad, angry, etc.) |
| `expression_confidence` | `float8` | | Confidence 0.0-1.0 |
| `emotion_scores` | `jsonb` | | Detailed emotion scores from DeepFace |
| `analyzed_at` | `timestamptz` | | Timestamp of advanced analysis |

**Indexes:**
- `celebrities_pkey` (UNIQUE) on `id`
- `celebrities_image_hash_key` (UNIQUE) on `image_hash`
- **Vector Index:** `idx_celebrities_embedding` (IVFFlat) on `embedding vector_cosine_ops` WITH (lists=100)
- **Attribute Indexes:**
  - `idx_celebrities_created_at` on `created_at DESC`
  - `idx_celebrities_category` on `category`
  - `idx_celebrities_gender` on `gender`
  - `idx_celebrities_age` on `age`
  - `idx_celebrities_quality` on `quality_score`
  - `idx_celebrities_expression` on `expression`
  - `idx_celebrities_attributes` on `(age, gender, quality_score, expression)`

**RLS Policies:**
- Public read access (anon can SELECT)
- Service role write access only

**Usage:**
- Stores celebrity profiles for lookalike matching
- IVFFlat index for fast vector similarity search
- Advanced facial attributes enable attribute-aware matching
- Image deduplication via `image_hash`

---

### Table: `celebrity_matches`

Stores user-to-celebrity face match results from vector similarity search.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique match ID |
| `face_id` | `uuid` | NOT NULL, FK → faces(id) | User face that was matched |
| `celebrity_id` | `uuid` | NOT NULL, FK → celebrities(id) | Matched celebrity |
| `similarity_score` | `float8` | NOT NULL, CHECK (>= 0) | Cosine similarity 0.0-1.0 (higher = more similar) |
| `created_at` | `timestamptz` | DEFAULT now() | Match timestamp |
| `updated_at` | `timestamptz` | DEFAULT now() | Last update timestamp |

**Indexes:**
- `celebrity_matches_pkey` (UNIQUE) on `id`
- `unique_face_celebrity` (UNIQUE) on `(face_id, celebrity_id)`
- `idx_celebrity_matches_face_id` on `face_id`
- `idx_celebrity_matches_celebrity_id` on `celebrity_id`
- `idx_celebrity_matches_similarity` on `(face_id, similarity_score DESC)`
- `idx_celebrity_matches_created_at` on `created_at DESC`

**Usage:**
- Stores results from celebrity matching jobs
- Unique constraint prevents duplicate matches
- Optimized for queries: "Get top N celebrity matches for a user face"
- Updated when new celebrity matches are found

**Relationships:**
- `face_id` → `faces.id`
- `celebrity_id` → `celebrities.id`

---

### Table: `reactions`

Stores user reactions to matches (favorites, viewed status, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique reaction ID |
| `user_profile_id` | `uuid` | NOT NULL, FK → profiles(id) | User who reacted |
| `match_id` | `uuid` | NOT NULL, FK → matches(id) | Match being reacted to |
| `reaction_type` | `text` | NOT NULL | Type: "like", "viewed" |
| `created_at` | `timestamptz` | DEFAULT now() | Reaction timestamp |

**Unique Constraint:**
- `reactions_match_user_type_unique` on `(match_id, user_profile_id, reaction_type)` - Allows multiple reaction types per match

**Indexes:**
- `reactions_pkey` (UNIQUE) on `id`
- `idx_reactions_type` on `reaction_type`
- `idx_reactions_user_type` on `(user_profile_id, reaction_type)`

**Supported Reaction Types:**
- `"like"` - User favorited the match (favorites feature)
- `"viewed"` - User viewed the match (viewed filter in live-match)

**Usage:**
- Tracks user engagement with matches
- Allows multiple reaction types per user per match (e.g., both "like" AND "viewed")
- Powers favorites/likes functionality and viewed status tracking
- Used in aggregated match stats

**Relationships:**
- `user_profile_id` → `profiles.id`
- `match_id` → `matches.id`

**Migration History:**
- **2025-11-10:** Changed UNIQUE constraint to include `reaction_type`, enabling multiple reaction types per match

---

### Table: `babies`

Stores AI-generated baby images from matched faces.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique baby image ID |
| `match_id` | `uuid` | NOT NULL, FK → matches(id) ON DELETE CASCADE | Source match |
| `generated_by_profile_id` | `uuid` | FK → profiles(id) ON DELETE SET NULL | User who generated this baby |
| `image_url` | `text` | NOT NULL | FAL.AI generated image URL |
| `created_at` | `timestamptz` | DEFAULT now() | Generation timestamp |

**Indexes:**
- `babies_pkey` (UNIQUE) on `id`
- `idx_babies_match_id` on `match_id`
- `idx_babies_created_at` on `created_at DESC`

**Usage:**
- Stores AI-generated baby images from two matched faces
- Links to the match that generated the baby
- Tracks who generated each baby image
- Supports multiple generations per match (regeneration supported)
- Used for baby gallery and history features

**Relationships:**
- `match_id` → `matches.id` (CASCADE DELETE: deleting match removes babies)
- `generated_by_profile_id` → `profiles.id` (SET NULL: user deletion preserves babies)

**Business Logic:**
- A match can have multiple baby images
- Baby generation performed by FAL.AI service (async)
- Images hosted on FAL.AI CDN (external URLs)
- Latest baby per match shown in UI by default

---

### Table: `match_jobs`

Background job queue for automated face matching tasks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique job ID |
| `face_id` | `uuid` | NOT NULL, FK → faces(id) | Face to match |
| `user_id` | `uuid` | NOT NULL, FK → profiles(id) | Job owner |
| `status` | `text` | NOT NULL, DEFAULT 'pending', CHECK (pending, processing, completed, failed) | Job status |
| `job_type` | `text` | DEFAULT 'both', CHECK (user_match, celebrity_match, both) | Match type to perform |
| `attempts` | `integer` | NOT NULL, DEFAULT 0 | Number of retry attempts |
| `max_attempts` | `integer` | NOT NULL, DEFAULT 3 | Max retry limit |
| `error_message` | `text` | | Error details if failed |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Job creation time |
| `started_at` | `timestamptz` | | Processing start time |
| `completed_at` | `timestamptz` | | Completion time |

**Indexes:**
- `match_jobs_pkey` (UNIQUE) on `id`
- `idx_match_jobs_status` on `(status, created_at)`
- `idx_match_jobs_pending` on `created_at` WHERE `status = 'pending'`
- `idx_match_jobs_job_type` on `job_type`
- `idx_match_jobs_status_type_created` on `(status, job_type, created_at)` WHERE `status = 'pending'`

**Job Types:**
- `user_match` - User-to-user matching only
- `celebrity_match` - Celebrity matching only
- `both` - Both user and celebrity matching (default)

**Job Statuses:**
- `pending` - Queued, waiting to be processed
- `processing` - Currently being processed
- `completed` - Successfully completed
- `failed` - Failed after max_attempts

**Usage:**
- Automatic job creation on face upload (via trigger)
- Background worker polls for pending jobs
- Retry logic with exponential backoff
- Results stored in `matches` and `celebrity_matches` tables

**Relationships:**
- `face_id` → `faces.id`
- `user_id` → `profiles.id`

---

### Table: `notifications`

User notification system for baby generation, mutual matches, and messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique notification ID |
| `user_id` | `uuid` | NOT NULL, FK → profiles(id) | Recipient user |
| `type` | `text` | NOT NULL, CHECK (baby_generated, mutual_match, new_message) | Notification type |
| `title` | `text` | NOT NULL | Notification title |
| `message` | `text` | | Notification message body |
| `related_id` | `uuid` | | Related entity ID |
| `related_type` | `text` | CHECK (baby, match, message, connection) | Related entity type |
| `read_at` | `timestamptz` | | Read timestamp (NULL = unread) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Creation timestamp |

**Indexes:**
- `notifications_pkey` (UNIQUE) on `id`
- `idx_notifications_user_id` on `user_id`
- `idx_notifications_created_at` on `created_at DESC`
- `idx_notifications_read_at` on `read_at` WHERE `read_at IS NULL`

**Notification Types:**
- `baby_generated` - Baby image was generated (related_type: baby)
- `mutual_match` - New mutual match discovered (related_type: match)
- `new_message` - New chat message received (related_type: message)

**Usage:**
- Real-time notification system
- Unread notifications tracked via NULL `read_at`
- Related entity linkage for navigation
- Delete policy allows users to delete their own notifications

**Relationships:**
- `user_id` → `profiles.id`

---

### Table: `mutual_connections`

Tracks active connections between matched users for messaging.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique connection ID |
| `profile_a_id` | `uuid` | NOT NULL, FK → profiles(id) | First user |
| `profile_b_id` | `uuid` | NOT NULL, FK → profiles(id) | Second user |
| `match_id` | `uuid` | NOT NULL, FK → matches(id) | Source match |
| `baby_id` | `uuid` | FK → babies(id) | Associated baby (if generated) |
| `status` | `text` | NOT NULL, DEFAULT 'active', CHECK (active, blocked, archived) | Connection status |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Connection creation time |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update time |

**Indexes:**
- `mutual_connections_pkey` (UNIQUE) on `id`
- `idx_mutual_connections_profile_a` on `profile_a_id`
- `idx_mutual_connections_profile_b` on `profile_b_id`
- `idx_mutual_connections_match_id` on `match_id`
- `idx_mutual_connections_status` on `status`

**Connection Statuses:**
- `active` - Active connection (can message)
- `blocked` - User blocked the connection
- `archived` - Connection archived/hidden

**Usage:**
- Created when both users mutually like a match
- Enables direct messaging between matched users
- Links to source match and optional baby image
- Status controls visibility and messaging permissions

**Relationships:**
- `profile_a_id` → `profiles.id`
- `profile_b_id` → `profiles.id`
- `match_id` → `matches.id`
- `baby_id` → `babies.id` (optional)

---

### Table: `messages`

Chat messaging system for mutual connections.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique message ID |
| `connection_id` | `uuid` | NOT NULL, FK → mutual_connections(id) | Connection this message belongs to |
| `sender_id` | `uuid` | NOT NULL, FK → profiles(id) | Message sender |
| `content` | `text` | NOT NULL | Message content |
| `message_type` | `text` | NOT NULL, DEFAULT 'text', CHECK (text, image, icebreaker) | Message type |
| `read_at` | `timestamptz` | | Read timestamp (NULL = unread) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Send timestamp |

**Indexes:**
- `messages_pkey` (UNIQUE) on `id`
- `idx_messages_connection_id` on `connection_id`
- `idx_messages_sender_id` on `sender_id`
- `idx_messages_created_at` on `created_at DESC`
- `idx_messages_read_at` on `read_at` WHERE `read_at IS NULL`

**Message Types:**
- `text` - Standard text message
- `image` - Image message (content = image URL)
- `icebreaker` - AI-generated icebreaker message

**Usage:**
- Real-time chat messaging
- Messages scoped to mutual connections
- Unread tracking via `read_at`
- Optimized for recent message queries

**Relationships:**
- `connection_id` → `mutual_connections.id`
- `sender_id` → `profiles.id`

---

### Table: `system_settings`

Configurable system settings managed by admins.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `key` | `text` | PRIMARY KEY | Unique setting identifier (e.g., matching_weights, allow_non_edu_emails) |
| `value` | `jsonb` | NOT NULL | JSON value for the setting (supports complex types) |
| `description` | `text` | | Human-readable description of the setting |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | Last update timestamp |
| `updated_by` | `uuid` | FK → profiles(id) | Admin user who last updated this setting |

**Indexes:**
- `system_settings_pkey` (UNIQUE) on `key`
- `idx_system_settings_updated_at` on `updated_at DESC`

**Current Settings:**
- `matching_weights` - Weights for the 6-factor matching algorithm (must sum to 1.0)
  ```json
  {
    "embedding": 0.20,    // Facial embedding similarity
    "geometry": 0.20,     // Facial proportions
    "age": 0.15,          // Age compatibility
    "symmetry": 0.15,     // Symmetry score
    "skin_tone": 0.15,    // Skin tone similarity
    "expression": 0.15    // Expression match
  }
  ```
- `allow_non_edu_emails` - Allow non-.edu email addresses to register (boolean)
- `match_threshold` - Minimum similarity score (0.0-1.0) required to create a match

**Usage:**
- Dynamic configuration of matching algorithm weights
- Email validation settings
- All settings are admin-configurable via `/admin` page
- Used by `calculate_advanced_similarity()` function for real-time weight adjustments

**RLS Policies:**
- SELECT: Public read access
- INSERT/UPDATE/DELETE: Admin role only (via `profiles.role = 'admin'`)

**Relationships:**
- `updated_by` → `profiles.id`

---

## Entity Relationships

```
┌─────────────────┐
│   profiles      │
│ PK: id          │
│ UK: email       │
│     last_seen   │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐              ┌──────────────────┐
│     faces       │─────────────▶│  celebrities     │
│ PK: id          │  similarity  │ PK: id           │
│ FK: profile_id  │   search     │     embedding    │
│     embedding   │              │     name, bio    │
│     (advanced   │              │     (advanced    │
│      attrs)     │              │      attrs)      │
└────────┬────────┘              └────────┬─────────┘
         │                                │
         │ N:M                            │
         ▼                                │
┌─────────────────┐              ┌───────▼──────────┐
│    matches      │              │ celebrity_       │
│ PK: id          │              │   matches        │
│     face_a_id   │              │ PK: id           │
│     face_b_id   │              │ FK: face_id      │
│ similarity_score│              │ FK: celebrity_id │
└────────┬────────┘              │ similarity_score │
         │                       └──────────────────┘
         ├─────────────┬─────────────┐
         │             │             │
         │ 1:N         │ 1:N         │ 1:N
         ▼             ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────────────┐
│   babies     │ │reactions │ │ mutual_          │
│ PK: id       │ │PK: id    │ │   connections    │
│ FK: match_id │ │FK: match │ │ PK: id           │
│   image_url  │ │FK: user  │ │ FK: profile_a_id │
│ FK: generated│ │   type   │ │ FK: profile_b_id │
│    _by       │ └──────────┘ │ FK: match_id     │
└──────────────┘              │ FK: baby_id      │
                              │     status       │
                              └────────┬─────────┘
                                       │
                                       │ 1:N
                                       ▼
┌────────────────────────────┐  ┌──────────────────┐
│      match_jobs            │  │    messages      │
│ PK: id                     │  │ PK: id           │
│ FK: face_id                │  │ FK: connection_id│
│ FK: user_id                │  │ FK: sender_id    │
│     status, job_type       │  │     content      │
│     attempts, error        │  │     message_type │
└────────────────────────────┘  │     read_at      │
                                └──────────────────┘
┌────────────────────────────┐
│     notifications          │
│ PK: id                     │
│ FK: user_id                │
│     type, title, message   │
│     related_id/type        │
│     read_at                │
└────────────────────────────┘
```

---

## Data Flow Examples

### 1. User Uploads Face (with Auto-Matching)

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
     INSERT INTO faces (profile_id, image_path, image_hash)
     VALUES (current_user_id, 'path/to/image.jpg', md5_hash)
     RETURNING *
   ↓
4. Database Trigger: auto_create_match_job()
   - Automatically creates match_job record:
     INSERT INTO match_jobs (face_id, user_id, job_type, status)
     VALUES (new_face_id, user_id, 'both', 'pending')
   ↓
5. Background Worker (polls match_jobs):
   - Picks up pending job
   - Sends face to Python AI service for embedding extraction
   - Receives embedding + advanced facial attributes
   - Updates faces table with embedding and attributes
   - Performs vector similarity search:
     * User-to-user: Search faces.embedding
     * Celebrity: Search celebrities.embedding
   - Inserts results into matches and celebrity_matches tables
   - Updates job status to 'completed'
   ↓
6. Frontend:
   - Real-time updates via Supabase Realtime
   - Invalidates queries to show new matches
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
            fa.image_path as face_a_image,
            fb.image_path as face_b_image,
            pa.name as user_a_name,
            pb.name as user_b_name
     FROM matches m
     JOIN faces fa ON m.face_a_id = fa.id
     JOIN faces fb ON m.face_b_id = fb.id
     JOIN profiles pa ON fa.profile_id = pa.id
     JOIN profiles pb ON fb.profile_id = pb.id
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

### 3. Celebrity Matching

```
1. Background worker processes celebrity_match job
   ↓
2. Python AI Service:
   - Receives face embedding from faces table
   - Performs vector similarity search:
     SELECT c.id, c.name, c.category, c.image_path,
            1 - (f.embedding <=> c.embedding) as similarity
     FROM celebrities c,
          LATERAL (SELECT embedding FROM faces WHERE id = :face_id) f
     WHERE c.embedding IS NOT NULL
     ORDER BY f.embedding <=> c.embedding
     LIMIT 10
   ↓
3. Insert results into celebrity_matches:
   INSERT INTO celebrity_matches (face_id, celebrity_id, similarity_score)
   VALUES (:face_id, :celebrity_id, :similarity)
   ON CONFLICT (face_id, celebrity_id)
   DO UPDATE SET similarity_score = EXCLUDED.similarity_score
   ↓
4. Frontend:
   - GET /api/matches/celebrity/:faceId
   - Display top celebrity lookalikes
```

### 4. Baby Generation from Match

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
            face_a.image_path, face_a.profile_id as profile_a_id,
            face_b.image_path, face_b.profile_id as profile_b_id
     FROM matches m
     JOIN faces face_a ON m.face_a_id = face_a.id
     JOIN faces face_b ON m.face_b_id = face_b.id
     WHERE m.id = :match_id
   - Generate signed URLs from Supabase Storage (24 hour TTL)
   ↓
4. Call FAL.AI API (synchronous):
   - POST to https://fal.run/fal-ai/flux/dev
   - Headers: Authorization: Key ${FAL_API_KEY}
   - Payload: {
       prompt: "A cute baby face...",
       image_url: signed_url_a,
       num_images: 1,
       guidance_scale: 7.5,
       num_inference_steps: 50
     }
   - Receive generated baby image URL
   ↓
5. Store baby record in database:
   INSERT INTO babies (match_id, generated_by_profile_id, image_url)
   VALUES (:match_id, :current_user_id, :fal_image_url)
   RETURNING *
   ↓
6. Create notification:
   INSERT INTO notifications (user_id, type, title, related_id, related_type)
   VALUES (:other_user_id, 'baby_generated', 'Baby Generated!', :baby_id, 'baby')
   ↓
7. Return response with participant details
   ↓
8. Frontend:
   - Display generated baby image
   - Store in baby gallery
   - Invalidate baby queries to refresh list
```

### 5. Real-time Presence Tracking

```
1. User connects to app
   ↓
2. Frontend subscribes to Supabase Realtime:
   - Channel: presence-global
   - Track user ID in channel presence
   ↓
3. On user disconnect:
   - Supabase Realtime detects disconnect
   - Updates profiles table:
     UPDATE profiles
     SET last_seen = now()
     WHERE id = :user_id
   ↓
4. Other users receive presence updates:
   - Zustand store tracks online users
   - UI shows green dot (online) or "Last seen X ago"
```

---

## Database Extensions

The following PostgreSQL extensions are installed:

| Extension | Schema | Version | Description |
|-----------|--------|---------|-------------|
| `vector` | `extensions` | 0.8.0 | Vector data type and HNSW/IVFFlat indexes for similarity search |
| `pgcrypto` | `extensions` | 1.3 | Cryptographic functions (hashing, encryption) |
| `uuid-ossp` | `extensions` | 1.1 | UUID generation functions |
| `pg_stat_statements` | `extensions` | 1.11 | Track SQL execution statistics |
| `pg_net` | `extensions` | 0.19.5 | Async HTTP requests from database |
| `pg_graphql` | `graphql` | 1.5.11 | GraphQL API support |
| `supabase_vault` | `vault` | 0.3.1 | Secrets management |
| `pg_cron` | `pg_catalog` | 1.6.4 | Job scheduler for periodic tasks |
| `plpgsql` | `pg_catalog` | 1.0 | PL/pgSQL procedural language |

**Note:** The `vector` extension was moved from `public` to `extensions` schema on 2025-11-06 for security compliance (Supabase advisory).

---

## Migration History

### Major Migrations (2025-10-29 to 2025-11-11)

**Infrastructure:**
- `20251029032359` - Created `notifications` table
- `20251029032707` - Created `mutual_connections` table
- `20251029032815` - Created `messages` table
- `20251030230740` - Auto-matching system with `match_jobs` table
- `20251031021655` - Enabled `pg_net` extension for HTTP requests

**Face Processing:**
- `20251031012103` - Removed Qdrant point_id from faces (switched to direct embedding storage)
- `20251106032110` - Added advanced face attributes (age, gender, landmarks, quality scores, etc.)
- `20251106032145` - Advanced matching algorithm with attribute-aware scoring

**Celebrity Matching:**
- `20251101070218` - Created `celebrities` table
- `20251101070240` - Updated matches schema for celebrity support
- `20251101070339` - Created celebrity storage bucket
- `20251101070403` - Celebrity vector search functions
- `20251101123419` - Created `celebrity_matches` table
- `20251106045624` - Added advanced attributes to celebrities
- `20251106045647` - Celebrity advanced matching algorithm

**Match Scoring:**
- `20251031025353` - Fixed similarity threshold logic
- `20251031135408` - Updated match threshold to 2.0
- `20251101140736` - Migrated to similarity scoring (0-1 scale)
- `20251101141013` - Migrated existing match scores to similarity
- `20251101142232` - Allow negative similarity in user matching

**Security & Performance:**
- `20251106061054` - **[CRITICAL]** Moved vector extension to `extensions` schema (security fix)
- `20251106062904` - Fixed function search_path security (6 iterations of refinement)
- `20251102080926` - Optimized RLS policies for auth.uid() performance
- `20251102114551` - Added delete policies for notifications and reactions

**Features:**
- `20251030010330` - Added babies insert policy
- `20251031030857` - Added match_type column to matches
- `20251031032750` - Added composite indexes for matches
- `20251031033837` - Auto-create profile on signup trigger
- `20251102130614` - Added presence tracking (`last_seen` column)
- `20251110101202` - Updated reactions table for multiple reaction types per match
- `20251111065954` - Added insert policy for reactions
- `20251111070013` - Added select/update policies for reactions

**Cleanup:**
- `20251101141922` - Dropped unused `find_top_celebrity_matches` function
- `20251106145302` - Fixed celebrity similarity ambiguity
- `20251110084540` - Removed embedding column from match_jobs

**Total Migrations:** 40+ migrations applied

---

## Indexes & Performance

### Query Optimization

**Most Common Queries:**

1. **Live Match Feed:**
   ```sql
   SELECT * FROM matches
   ORDER BY similarity_score DESC, created_at DESC
   LIMIT 20
   ```
   - Indexed on `similarity_score DESC`
   - Pagination via offset/limit

2. **User Match Details:**
   ```sql
   SELECT * FROM matches
   WHERE face_a_id IN (user_faces) OR face_b_id IN (user_faces)
   ```
   - Indexed on `face_a_id`, `face_b_id`

3. **Celebrity Matches:**
   ```sql
   SELECT * FROM celebrity_matches
   WHERE face_id = :face_id
   ORDER BY similarity_score DESC
   LIMIT 10
   ```
   - Composite index on `(face_id, similarity_score DESC)`

4. **Vector Similarity Search (Faces):**
   ```sql
   SELECT id, 1 - (embedding <=> :query_embedding) as similarity
   FROM faces
   ORDER BY embedding <=> :query_embedding
   LIMIT 20
   ```
   - HNSW index: O(log N) complexity
   - Parameters: m=16, ef_construction=64

5. **Vector Similarity Search (Celebrities):**
   ```sql
   SELECT id, 1 - (embedding <=> :query_embedding) as similarity
   FROM celebrities
   ORDER BY embedding <=> :query_embedding
   LIMIT 10
   ```
   - IVFFlat index: Fast approximate search
   - Parameters: lists=100

6. **Unread Notifications:**
   ```sql
   SELECT * FROM notifications
   WHERE user_id = :user_id AND read_at IS NULL
   ORDER BY created_at DESC
   ```
   - Partial index on `read_at` WHERE `read_at IS NULL`

7. **Pending Match Jobs:**
   ```sql
   SELECT * FROM match_jobs
   WHERE status = 'pending'
   ORDER BY created_at
   LIMIT 10
   ```
   - Partial index on `created_at` WHERE `status = 'pending'`

### Caching Strategy

- **React Query:** 60s stale time for most queries
- **Backend:** Supabase built-in connection pooling
- **Vector Search:** In-memory HNSW index for fast search
- **Signed URLs:** 24-hour TTL (configurable via `SUPABASE_SIGNED_URL_TTL`)

---

## Data Consistency

### Eventual Consistency

- **Realtime events** may arrive before PostgreSQL read replicas sync
- Frontend handles by invalidating queries, which triggers refetch

### Transaction Boundaries

- Face upload: Atomic (Storage + PostgreSQL)
- Match creation: Non-atomic (Background job → PostgreSQL insert)
- Reactions: Atomic (PostgreSQL transaction)
- Baby generation: Atomic (FAL.AI call + PostgreSQL insert)

### Conflict Resolution

- `faces`: Unique constraint on `(profile_id, image_hash)` prevents duplicates
- `reactions`: Unique constraint on `(match_id, user_profile_id, reaction_type)`
- `celebrity_matches`: Unique constraint on `(face_id, celebrity_id)`

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

---

**Last Updated:** 2025-11-11

**Schema Version:** 40+ migrations applied (20251029032359 → 20251111070013)
