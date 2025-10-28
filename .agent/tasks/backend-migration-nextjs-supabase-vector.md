# Backend Migration: Flask → Next.js API Routes + Supabase Vector

**Feature:** Migrate Python Flask backend to Next.js API Routes with Supabase Vector (pgvector)

**Status:** 🚧 IN PROGRESS - Phase 2 Ready for Deployment

**Created:** 2025-10-26

**Estimated Time:** 30-40 hours (1-2 weeks)

**Updated:** 2025-10-27 - Phase 1 complete, Phase 2 files created and ready

---

## Migration Strategy

**Incremental Approach:**
This migration follows an **incremental validation strategy** to reduce risk and enable early testing:

1. **Phase 1 (Day 1):** Start with Next.js API Routes for Auth ONLY
   - Implement auth endpoints first (simple, no dependencies)
   - Build reusable middleware & helpers
   - Validate Next.js API architecture works
   - Test with real frontend immediately

2. **Phase 2 (Day 2-3):** Migrate to Supabase Vector
   - Enable pgvector extension
   - Migrate embeddings from Qdrant
   - Create vector search functions

3. **Phase 3 (Day 2-3):** Python AI Microservice
   - Can run in parallel with Phase 2
   - Extract only face recognition logic
   - Deploy to Railway/Fly.io

4. **Phase 4-8:** Complete remaining endpoints, testing, deployment

**Why This Order?**
✅ Early validation of Next.js API architecture
✅ Test with real frontend from Day 1
✅ Incremental changes reduce risk
✅ Can rollback easily at each phase
✅ Parallel work on Phase 2 & 3 saves time

### Quick Phase Reference

| Phase | Focus | Duration | Dependencies | Status |
|-------|-------|----------|--------------|--------|
| **Phase 1** | Next.js API: Auth Only | 3-4h | None | ✅ COMPLETE |
| **Phase 2** | Supabase Vector Migration | 6-8h | Phase 1 | 📦 READY - Deploy migrations |
| **Phase 3** | Python AI Microservice | 3-4h | None (parallel) | ✅ Yes - standalone |
| **Phase 4** | Remaining API Routes (Matches, Faces, Baby, Reactions) | 10-12h | Phase 1,2,3 | ✅ Yes - each endpoint |
| **Phase 5** | Background Jobs (Vercel Cron) | 3-4h | Phase 4 | ✅ Yes - manual trigger |
| **Phase 6** | Complete Testing | 4-5h | Phase 5 | ✅ Yes - E2E |
| **Phase 7** | Production Deployment | 2-3h | Phase 6 | ✅ Yes - staging |
| **Phase 8** | Cleanup & Documentation | 2h | Phase 7 | N/A |

---

## Overview

This document outlines the complete migration strategy for consolidating the AI Face Matching Application into a **unified Next.js monorepo** with integrated API routes, replacing the separate Python Flask backend and migrating from Qdrant to Supabase Vector (pgvector).

### Migration Goals

**Primary Objectives:**
1. ✅ Consolidate backend + frontend into single Next.js monorepo
2. ✅ Migrate Flask REST endpoints → Next.js Route Handlers (TypeScript)
3. ✅ Replace Qdrant vector DB → Supabase Vector (pgvector)
4. ✅ Keep Python microservice ONLY for AI/ML (InsightFace face recognition)
5. ✅ Replace Celery/Redis → Vercel Cron + database job queue
6. ✅ Deploy to Vercel (serverless Next.js) + Python AI service

---

## Architecture Changes

### Current Architecture (Before)

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                  │
│  - React 19 + TypeScript                            │
│  - TanStack Query                                    │
│  - Supabase Auth                                     │
└─────────────────┬───────────────────────────────────┘
                  │ HTTP (Axios)
                  ▼
┌─────────────────────────────────────────────────────┐
│            Backend (Python Flask)                    │
│  - Auth endpoints                                    │
│  - Face upload/management                            │
│  - Match endpoints                                   │
│  - Baby generation (FAL.AI)                          │
│  - Reactions                                         │
│                                                      │
│  Services:                                           │
│  - InsightFace (face embeddings)                    │
│  - Celery (background jobs)                          │
│  - Redis (task queue)                                │
└─────────┬──────────────────────┬────────────────────┘
          │                      │
          ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│  Supabase        │   │  Qdrant Cloud    │
│  - PostgreSQL    │   │  - Vector DB     │
│  - Storage       │   │  - 512D vectors  │
│  - Auth          │   │  - HNSW index    │
└──────────────────┘   └──────────────────┘
```

### Target Architecture (After)

```
┌─────────────────────────────────────────────────────┐
│           Next.js Monorepo (Vercel)                 │
│                                                      │
│  Frontend (src/app/)                                │
│  - React 19 + TypeScript                            │
│  - TanStack Query                                    │
│  - Supabase Auth                                     │
│                                                      │
│  Backend API (src/app/api/)                         │
│  - /api/auth/*       - Authentication               │
│  - /api/faces/*      - Face management              │
│  - /api/matches/*    - Matching endpoints           │
│  - /api/baby/*       - Baby generation              │
│  - /api/cron/*       - Background jobs (Vercel)     │
│                                                      │
│  Services (src/lib/services/)                       │
│  - ai-service.ts     - Calls Python microservice    │
│  - match-service.ts  - Vector search logic          │
│  - baby-service.ts   - FAL.AI integration           │
│  - storage-service.ts - Supabase Storage            │
└─────────┬──────────────────────┬────────────────────┘
          │                      │
          ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│  Supabase        │   │  Python AI       │
│  - PostgreSQL    │   │  Microservice    │
│  - Vector (pgv)  │   │  (Railway/Fly)   │
│  - Storage       │   │                  │
│  - Auth          │   │  - InsightFace   │
│  - Realtime      │   │  - Extract embed │
└──────────────────┘   └──────────────────┘
```

**Key Changes:**
- ❌ Remove: Separate Flask backend, Qdrant, Celery, Redis
- ✅ Add: Next.js API Routes, Supabase Vector, Vercel Cron
- ⚡ Keep: Python microservice (AI only), Supabase PostgreSQL/Storage/Auth

---

## Current Database Schema Analysis

### Existing Tables (from MCP)

**1. `profiles` (11 rows)**
- User and celebrity profiles
- Links to default face via `default_face_id`

**2. `faces` (19 rows)**
- Face metadata and image storage references
- **Current:** `qdrant_point_id` (UUID) - links to Qdrant
- **Migration needed:** Add `embedding` column (vector(512))

**3. `matches` (102 rows)**
- Face match results with similarity scores
- No changes needed

**4. `babies` (7 rows)**
- AI-generated baby images from matches
- No changes needed

**5. `reactions` (1 row)**
- User reactions to matches
- No changes needed

### Current Vector Extension Status

```sql
-- From MCP list_extensions:
{
  "name": "vector",
  "default_version": "0.8.0",
  "installed_version": null,  -- ❌ NOT INSTALLED YET
  "comment": "vector data type and ivfflat and hnsw access methods"
}
```

**Action Required:** Enable pgvector extension

---

## Phase 1: Next.js API Routes - Auth Only (3-4 hours)

**Goal:** Implement authentication endpoints in Next.js API Routes to validate the architecture and build foundation.

**Strategy:**
- Start with auth endpoints only (simpler, no vector dependencies)
- Build reusable middleware and helpers
- Test with real frontend immediately
- Validate Next.js API architecture works
- Foundation ready for later phases

### 1.1 Project Structure Setup (30 min)

**Create folder structure:**
```
src/
├── app/
│   └── api/                          # NEW: API routes
│       └── auth/
│           └── me/route.ts          # GET /api/auth/me, PATCH /api/auth/me
├── lib/
│   ├── db/                           # NEW: Database clients
│   │   └── supabase-server.ts       # Server-side Supabase client
│   └── middleware/                   # NEW: Request middleware
│       ├── auth.ts                  # Verify Supabase JWT
│       └── error-handler.ts         # Error handling utility
```

**Note:** No new dependencies needed! We only use existing `@supabase/supabase-js`.

### 1.2 Database Client Setup (45 min)

**File:** `src/lib/db/supabase-server.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Helper: Get current user from Authorization header
export async function getCurrentUser(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

// Helper: Get profile by email
export async function getProfileByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('Profile fetch error:', error)
    return null
  }

  return data
}
```

### 1.3 Environment Variables (10 min)

**Update `.env.local`:**
```env
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # NEW: For server-side operations
```

**How to get `SUPABASE_SERVICE_ROLE_KEY`:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api)
2. Navigate to Settings → API
3. Copy the `service_role` key (keep it secret!)

### 1.4 Middleware: Auth Helper (30 min)

**File:** `src/lib/middleware/auth.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getProfileByEmail, supabaseAdmin } from '@/lib/db/supabase-server'

export interface AuthContext {
  user: {
    id: string
    email: string
  }
  profile: {
    id: string
    name: string
    email: string | null
    profile_type: 'user' | 'celebrity'
    default_face_id: string | null
  }
}

/**
 * Verify authentication and return user + profile
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  const authHeader = request.headers.get('authorization')

  // Check if authenticated
  const user = await getCurrentUser(authHeader)

  if (!user || !user.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Get user profile
  const profile = await getProfileByEmail(user.email)

  if (!profile) {
    return NextResponse.json(
      { error: 'Profile not found' },
      { status: 404 }
    )
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
  }
}
```

**File:** `src/lib/middleware/error-handler.ts`

```typescript
import { NextResponse } from 'next/server'

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

### 1.5 API Route: GET /api/auth/me (1 hour)

**File:** `src/app/api/auth/me/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { handleApiError } from '@/lib/middleware/error-handler'
import { supabaseAdmin } from '@/lib/db/supabase-server'

/**
 * GET /api/auth/me - Get current authenticated user profile
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult // Return error response
    }

    const { profile } = authResult

    // Get default face image if exists
    let defaultFaceImage = null
    if (profile.default_face_id) {
      const { data: face } = await supabaseAdmin
        .from('faces')
        .select('image_path')
        .eq('id', profile.default_face_id)
        .single()

      if (face) {
        const { data: signedUrl } = await supabaseAdmin
          .storage
          .from('faces')
          .createSignedUrl(face.image_path, 3600)

        defaultFaceImage = signedUrl?.signedUrl || null
      }
    }

    // Return user profile
    return NextResponse.json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      gender: profile.gender,
      school: profile.school,
      default_face_id: profile.default_face_id,
      image: defaultFaceImage,
    })

  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/auth/me - Update current user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { profile } = authResult
    const body = await request.json()

    // Validate and sanitize input
    const updates: any = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.gender !== undefined) updates.gender = body.gender
    if (body.school !== undefined) updates.school = body.school
    if (body.default_face_id !== undefined) updates.default_face_id = body.default_face_id

    // Update profile
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`)
    }

    return NextResponse.json(data)

  } catch (error) {
    return handleApiError(error)
  }
}
```

### 1.6 Testing Phase 1 (30 min)

**Test Checklist:**

**Auth Endpoint:**
- [ ] GET /api/auth/me returns user profile when authenticated
- [ ] GET /api/auth/me returns 401 when not authenticated
- [ ] GET /api/auth/me includes default face image if set
- [ ] PATCH /api/auth/me updates profile successfully
- [ ] PATCH /api/auth/me validates and sanitizes input

**Test with Thunder Client / Postman:**

```bash
# Get Supabase JWT token first (from browser DevTools after login)
# Application → Cookies → sb-{project}-auth-token

# Test GET endpoint
GET http://localhost:3000/api/auth/me
Authorization: Bearer <your-supabase-jwt-token>

# Expected response:
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "gender": "male",
  "school": "MIT",
  "default_face_id": "uuid",
  "image": "https://...signed-url..."
}

# Test PATCH endpoint
PATCH http://localhost:3000/api/auth/me
Authorization: Bearer <your-supabase-jwt-token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "school": "Stanford"
}
```

**Test with frontend:**
```bash
cd frontend
npm run dev
# Login at http://localhost:3000/auth/sign-in
# Navigate to /profile page
# Verify profile data loads correctly
```

**Success Criteria:**
✅ Auth endpoints work with Supabase JWT
✅ Profile data loads correctly
✅ Profile updates save to database
✅ Middleware properly validates auth
✅ Error handling works (401, 404, 500)

---

## Phase 2: Supabase Vector Migration (6-8 hours)

**Goal:** Migrate from Qdrant to Supabase Vector (pgvector) for face embeddings

### 2.1 Enable pgvector Extension

**Migration:** `enable_pgvector_extension.sql`

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Apply using MCP:**
```typescript
await mcp__supabase__apply_migration({
  name: "enable_pgvector_extension",
  query: "CREATE EXTENSION IF NOT EXISTS vector;"
});
```

### 2.2 Add Embedding Column to `faces` Table

**Migration:** `add_face_embeddings.sql`

```sql
-- Add vector column for 512-dimensional face embeddings
ALTER TABLE faces
ADD COLUMN embedding vector(512);

-- Add index for fast similarity search (HNSW - Hierarchical Navigable Small World)
-- HNSW is faster than IVFFlat for most use cases
CREATE INDEX ON faces
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Alternative: IVFFlat index (faster build, slower search)
-- CREATE INDEX ON faces
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- Add comment for documentation
COMMENT ON COLUMN faces.embedding IS '512-dimensional face embedding from InsightFace model';
```

**Index Options Explained:**
- **HNSW (Recommended):**
  - Better search accuracy
  - Faster queries
  - Slower index build (acceptable for <100k vectors)
  - Parameters:
    - `m = 16` (connections per layer, higher = better accuracy)
    - `ef_construction = 64` (build time quality)

- **IVFFlat (Alternative):**
  - Faster index creation
  - Requires query-time `SET ivfflat.probes = N` tuning
  - Good for very large datasets (>1M vectors)

### 1.3 Migrate Existing Embeddings from Qdrant

**Strategy:** Two-phase migration to avoid downtime

**Option A: Dual-write during transition (Recommended)**
1. Keep Qdrant running
2. Start writing embeddings to BOTH Qdrant AND Supabase
3. Backfill existing embeddings from Qdrant → Supabase
4. Switch reads to Supabase
5. Deprecate Qdrant

**Option B: Bulk migration (Faster, requires downtime)**
1. Export all vectors from Qdrant
2. Import to Supabase in batch
3. Switch application to Supabase
4. Decommission Qdrant

**Implementation (Option A - Zero Downtime):**

```python
# Python script: migrate_qdrant_to_supabase.py
from qdrant_client import QdrantClient
from supabase import create_client
import os

# Initialize clients
qdrant = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# Fetch all points from Qdrant
points = qdrant.scroll(
    collection_name="faces",
    limit=10000,  # Adjust based on total count
    with_payload=True,
    with_vectors=True
)

# Migrate each point
for point in points[0]:
    face_id = point.payload.get("face_id")
    embedding = point.vector

    # Update Supabase faces table
    supabase.table("faces").update({
        "embedding": embedding
    }).eq("qdrant_point_id", point.id).execute()

    print(f"Migrated face {face_id}")

print(f"Migration complete! Total: {len(points[0])} embeddings")
```

**Verification Query:**
```sql
-- Check migration progress
SELECT
    COUNT(*) as total_faces,
    COUNT(embedding) as faces_with_embedding,
    COUNT(qdrant_point_id) as faces_with_qdrant_id,
    ROUND(100.0 * COUNT(embedding) / COUNT(*), 2) as migration_progress_pct
FROM faces;
```

### 1.4 Create Vector Search Functions

**Migration:** `create_vector_search_functions.sql`

```sql
-- Function: Find similar faces using cosine distance
CREATE OR REPLACE FUNCTION find_similar_faces(
    query_embedding vector(512),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 20,
    exclude_profile_id uuid DEFAULT NULL
)
RETURNS TABLE (
    face_id uuid,
    profile_id uuid,
    similarity float,
    image_path text,
    profile_name text,
    profile_type text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id as face_id,
        f.profile_id,
        1 - (f.embedding <=> query_embedding) as similarity,  -- Cosine similarity
        f.image_path,
        p.name as profile_name,
        p.profile_type
    FROM faces f
    JOIN profiles p ON f.profile_id = p.id
    WHERE
        f.embedding IS NOT NULL
        AND (exclude_profile_id IS NULL OR f.profile_id != exclude_profile_id)
        AND (1 - (f.embedding <=> query_embedding)) >= match_threshold
    ORDER BY f.embedding <=> query_embedding  -- Cosine distance (ascending)
    LIMIT match_count;
END;
$$;

-- Function: Find celebrity lookalikes
CREATE OR REPLACE FUNCTION find_celebrity_matches(
    query_embedding vector(512),
    match_count int DEFAULT 10
)
RETURNS TABLE (
    face_id uuid,
    celebrity_name text,
    similarity float,
    image_path text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id as face_id,
        p.name as celebrity_name,
        1 - (f.embedding <=> query_embedding) as similarity,
        f.image_path
    FROM faces f
    JOIN profiles p ON f.profile_id = p.id
    WHERE
        f.embedding IS NOT NULL
        AND p.profile_type = 'celebrity'
    ORDER BY f.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION find_similar_faces TO authenticated;
GRANT EXECUTE ON FUNCTION find_celebrity_matches TO authenticated;
```

**Distance Operators in pgvector:**
- `<->` - Euclidean distance (L2)
- `<=>` - Cosine distance (1 - cosine similarity) ✅ **Use this for face matching**
- `<#>` - Inner product (dot product)

**Why Cosine Distance?**
- InsightFace embeddings are normalized
- Cosine similarity is standard for face recognition
- Range: 0 (identical) to 2 (opposite)
- Convert to similarity: `similarity = 1 - distance`

### 1.5 Performance Tuning

**Query Optimization:**
```sql
-- Set work_mem for better index performance (session-level)
SET work_mem = '256MB';

-- Analyze table for query planner
ANALYZE faces;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'faces';
```

**HNSW Index Tuning:**
```sql
-- For better accuracy (slower build):
CREATE INDEX faces_embedding_hnsw_idx ON faces
USING hnsw (embedding vector_cosine_ops)
WITH (m = 24, ef_construction = 128);

-- For faster build (slightly lower accuracy):
CREATE INDEX faces_embedding_hnsw_idx ON faces
USING hnsw (embedding vector_cosine_ops)
WITH (m = 12, ef_construction = 32);

-- Default (balanced):
-- m = 16, ef_construction = 64
```

---

## Phase 3: Python AI Microservice (3-4 hours)

**Goal:** Extract face recognition logic into minimal Python service

**Note:** This phase can run in parallel with Phase 2 (Supabase Vector) since they're independent.



### 2.1 Create Minimal Flask API

**Purpose:** Extract ONLY face recognition logic from current backend

**File Structure:**
```
python-ai-service/
├── app.py               # Flask app (50-100 lines)
├── requirements.txt     # Minimal dependencies
├── Dockerfile           # Container image
├── .env                 # API key for security
└── README.md            # Setup instructions
```

**File:** `python-ai-service/app.py`

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import insightface
from insightface.app import FaceAnalysis
import numpy as np
import cv2
import os
from werkzeug.utils import secure_filename
import base64

app = Flask(__name__)
CORS(app)

# Security: Require API key
API_KEY = os.getenv("API_KEY", "change-me-in-production")

# Initialize InsightFace model (once at startup)
print("Loading InsightFace model...")
face_app = FaceAnalysis(providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(640, 640))
print("Model loaded successfully!")

def verify_api_key():
    """Verify API key from request header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    return token == API_KEY

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({"status": "healthy", "model": "insightface"})

@app.route('/extract-embedding', methods=['POST'])
def extract_embedding():
    """
    Extract 512D face embedding from uploaded image

    Request body (multipart/form-data):
        - file: image file (JPEG, PNG)

    OR (application/json):
        - image_base64: base64-encoded image

    Response:
        {
            "embedding": [512 float values],
            "face_detected": true,
            "bbox": [x, y, width, height],
            "confidence": 0.99
        }
    """
    # Verify API key
    if not verify_api_key():
        return jsonify({"error": "Unauthorized"}), 401

    try:
        # Handle file upload
        if 'file' in request.files:
            file = request.files['file']
            img_bytes = file.read()
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Handle base64 image
        elif request.json and 'image_base64' in request.json:
            img_data = base64.b64decode(request.json['image_base64'])
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        else:
            return jsonify({"error": "No image provided"}), 400

        # Detect faces
        faces = face_app.get(img)

        if len(faces) == 0:
            return jsonify({
                "face_detected": False,
                "error": "No face detected in image"
            }), 400

        # Use first detected face
        face = faces[0]
        embedding = face.embedding.tolist()  # Convert numpy array to list

        return jsonify({
            "face_detected": True,
            "embedding": embedding,
            "bbox": face.bbox.tolist(),
            "confidence": float(face.det_score)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/compare-faces', methods=['POST'])
def compare_faces():
    """
    Compare two face embeddings and return similarity score

    Request body (application/json):
        {
            "embedding_a": [512 floats],
            "embedding_b": [512 floats]
        }

    Response:
        {
            "similarity": 0.85,  # 0-1, higher = more similar
            "distance": 0.15     # cosine distance
        }
    """
    # Verify API key
    if not verify_api_key():
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = request.json
        emb_a = np.array(data['embedding_a'])
        emb_b = np.array(data['embedding_b'])

        # Compute cosine similarity
        similarity = np.dot(emb_a, emb_b) / (np.linalg.norm(emb_a) * np.linalg.norm(emb_b))
        distance = 1 - similarity

        return jsonify({
            "similarity": float(similarity),
            "distance": float(distance)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)
```

**File:** `python-ai-service/requirements.txt`

```txt
Flask==3.0.0
flask-cors==4.0.0
insightface==0.7.3
onnxruntime==1.16.3
numpy==1.24.3
opencv-python-headless==4.8.1.78
```

**File:** `python-ai-service/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app.py .

# Download InsightFace model (optional - can be done at runtime)
# RUN python -c "from insightface.app import FaceAnalysis; FaceAnalysis()"

EXPOSE 8000

CMD ["python", "app.py"]
```

### 2.2 Deploy Python Microservice

**Option 1: Railway (Recommended - Easiest)**
```bash
# Install Railway CLI
npm install -g railway

# Login and deploy
cd python-ai-service
railway login
railway init
railway up
```

**Cost:** Free tier ($5/month credit) → ~$5-10/month for small workloads

**Option 2: Fly.io (Good performance)**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
cd python-ai-service
fly launch
fly deploy
```

**Cost:** Free tier (3GB RAM) → ~$0-5/month

**Option 3: Google Cloud Run (Serverless)**
```bash
gcloud run deploy ai-service \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Cost:** Pay-per-request, ~$0-10/month for low traffic

### 2.3 Environment Variables

**Next.js (`.env.local`):**
```env
# Python AI Service
PYTHON_AI_SERVICE_URL=https://ai-service.railway.app
PYTHON_AI_SERVICE_API_KEY=<secure-random-key>
```

**Python Service (`.env`):**
```env
API_KEY=<same-secure-random-key>
```

**Generate secure key:**
```bash
openssl rand -base64 32
```

---

## Phase 3: Next.js API Routes (10-12 hours)

### 3.1 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/                    # NEW: API routes
│   │   │   ├── auth/
│   │   │   │   ├── me/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── faces/
│   │   │   │   ├── route.ts        # POST /api/faces, GET /api/faces
│   │   │   │   └── [id]/route.ts   # DELETE /api/faces/:id
│   │   │   ├── matches/
│   │   │   │   ├── top/route.ts
│   │   │   │   ├── user/[userId]/route.ts
│   │   │   │   ├── celebrity/route.ts
│   │   │   │   └── [matchId]/
│   │   │   │       └── react/route.ts
│   │   │   ├── baby/
│   │   │   │   ├── route.ts        # POST /api/baby, GET /api/baby
│   │   │   │   └── list/route.ts
│   │   │   └── cron/
│   │   │       └── process-jobs/route.ts
│   ├── lib/
│   │   ├── db/                     # NEW: Database clients
│   │   │   ├── supabase.ts         # Server-side Supabase client
│   │   │   └── vector.ts           # Vector search helpers
│   │   ├── services/               # NEW: Business logic
│   │   │   ├── ai-service.ts       # Calls Python microservice
│   │   │   ├── face-service.ts
│   │   │   ├── match-service.ts
│   │   │   ├── baby-service.ts
│   │   │   └── storage-service.ts
│   │   └── middleware/             # NEW: Request middleware
│   │       ├── auth.ts             # Verify Supabase JWT
│   │       └── error-handler.ts
```

### 3.2 Database Client Setup

**File:** `src/lib/db/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client (service role key)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Client for auth operations (anon key)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type-safe database types (generate with supabase gen types)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          profile_type: 'user' | 'celebrity'
          name: string
          email: string | null
          gender: string | null
          school: string | null
          default_face_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      faces: {
        Row: {
          id: string
          profile_id: string
          image_path: string
          embedding: number[] | null
          qdrant_point_id: string | null
          image_hash: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['faces']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['faces']['Insert']>
      }
      // ... other tables
    }
  }
}
```

**File:** `src/lib/db/vector.ts`

```typescript
import { supabaseAdmin } from './supabase'

export interface SimilarFace {
  face_id: string
  profile_id: string
  similarity: number
  image_path: string
  profile_name: string
  profile_type: 'user' | 'celebrity'
}

export interface CelebrityMatch {
  face_id: string
  celebrity_name: string
  similarity: number
  image_path: string
}

/**
 * Find similar faces using pgvector cosine similarity
 */
export async function findSimilarFaces(
  embedding: number[],
  options: {
    threshold?: number
    limit?: number
    excludeProfileId?: string
  } = {}
): Promise<SimilarFace[]> {
  const {
    threshold = 0.5,
    limit = 20,
    excludeProfileId,
  } = options

  const { data, error } = await supabaseAdmin.rpc('find_similar_faces', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
    exclude_profile_id: excludeProfileId || null,
  })

  if (error) {
    console.error('Vector search error:', error)
    throw new Error(`Failed to find similar faces: ${error.message}`)
  }

  return data as SimilarFace[]
}

/**
 * Find celebrity lookalikes
 */
export async function findCelebrityMatches(
  embedding: number[],
  limit: number = 10
): Promise<CelebrityMatch[]> {
  const { data, error } = await supabaseAdmin.rpc('find_celebrity_matches', {
    query_embedding: embedding,
    match_count: limit,
  })

  if (error) {
    console.error('Celebrity search error:', error)
    throw new Error(`Failed to find celebrity matches: ${error.message}`)
  }

  return data as CelebrityMatch[]
}

/**
 * Insert or update face embedding
 */
export async function upsertFaceEmbedding(
  faceId: string,
  embedding: number[]
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('faces')
    .update({ embedding })
    .eq('id', faceId)

  if (error) {
    throw new Error(`Failed to update embedding: ${error.message}`)
  }
}
```

### 3.3 AI Service Client

**File:** `src/lib/services/ai-service.ts`

```typescript
interface ExtractEmbeddingResponse {
  face_detected: boolean
  embedding: number[]
  bbox: number[]
  confidence: number
  error?: string
}

interface CompareFacesResponse {
  similarity: number
  distance: number
}

const AI_SERVICE_URL = process.env.PYTHON_AI_SERVICE_URL!
const AI_SERVICE_API_KEY = process.env.PYTHON_AI_SERVICE_API_KEY!

/**
 * Extract face embedding from image using Python microservice
 */
export async function extractEmbedding(
  imageBuffer: Buffer
): Promise<number[]> {
  const formData = new FormData()
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' })
  formData.append('file', blob, 'face.jpg')

  const response = await fetch(`${AI_SERVICE_URL}/extract-embedding`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_SERVICE_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to extract embedding')
  }

  const data: ExtractEmbeddingResponse = await response.json()

  if (!data.face_detected) {
    throw new Error('No face detected in image')
  }

  return data.embedding
}

/**
 * Compare two face embeddings
 */
export async function compareFaces(
  embeddingA: number[],
  embeddingB: number[]
): Promise<number> {
  const response = await fetch(`${AI_SERVICE_URL}/compare-faces`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_SERVICE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      embedding_a: embeddingA,
      embedding_b: embeddingB,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to compare faces')
  }

  const data: CompareFacesResponse = await response.json()
  return data.similarity
}

/**
 * Health check for AI service
 */
export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}
```

### 3.4 Example API Route: Face Upload

**File:** `src/app/api/faces/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractEmbedding } from '@/lib/services/ai-service'
import { upsertFaceEmbedding } from '@/lib/db/vector'
import { supabaseAdmin } from '@/lib/db/supabase'
import crypto from 'crypto'

// Verify Supabase JWT token
async function getCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return null
  }

  return user
}

/**
 * POST /api/faces - Upload face image
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract face embedding via Python microservice
    const embedding = await extractEmbedding(buffer)

    // Upload image to Supabase Storage
    const imageHash = crypto.createHash('sha256').update(buffer).digest('hex')
    const fileName = `${profile.id}/${Date.now()}-${imageHash.substring(0, 8)}.jpg`

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('faces')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Create face record in database
    const { data: face, error: dbError } = await supabaseAdmin
      .from('faces')
      .insert({
        profile_id: profile.id,
        image_path: fileName,
        embedding,
        image_hash: imageHash,
      })
      .select()
      .single()

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    // Get signed URL for client
    const { data: signedUrl } = await supabaseAdmin
      .storage
      .from('faces')
      .createSignedUrl(fileName, 3600)

    return NextResponse.json({
      id: face.id,
      image_url: signedUrl?.signedUrl,
      created_at: face.created_at,
    })

  } catch (error: any) {
    console.error('Face upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/faces - List user's faces
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { data: faces, error } = await supabaseAdmin
      .from('faces')
      .select('id, image_path, created_at')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Generate signed URLs
    const facesWithUrls = await Promise.all(
      faces.map(async (face) => {
        const { data } = await supabaseAdmin
          .storage
          .from('faces')
          .createSignedUrl(face.image_path, 3600)

        return {
          ...face,
          image_url: data?.signedUrl,
        }
      })
    )

    return NextResponse.json(facesWithUrls)

  } catch (error: any) {
    console.error('List faces error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 3.5 Example API Route: Find Matches

**File:** `src/app/api/matches/top/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db/supabase'
import { findSimilarFaces } from '@/lib/db/vector'

/**
 * GET /api/matches/top - Get top matches (live feed)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get recent matches with profile data
    const { data: matches, error } = await supabaseAdmin
      .from('matches')
      .select(`
        id,
        similarity_score,
        created_at,
        face_a:faces!matches_face_a_id_fkey (
          id,
          image_path,
          profile:profiles (
            id,
            name,
            profile_type
          )
        ),
        face_b:faces!matches_face_b_id_fkey (
          id,
          image_path,
          profile:profiles (
            id,
            name,
            profile_type
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    // Generate signed URLs for images
    const matchesWithUrls = await Promise.all(
      matches.map(async (match) => {
        const [urlA, urlB] = await Promise.all([
          supabaseAdmin.storage.from('faces').createSignedUrl(match.face_a.image_path, 3600),
          supabaseAdmin.storage.from('faces').createSignedUrl(match.face_b.image_path, 3600),
        ])

        return {
          id: match.id,
          similarity_score: match.similarity_score,
          created_at: match.created_at,
          users: {
            a: {
              id: match.face_a.profile.id,
              name: match.face_a.profile.name,
              image: urlA.data?.signedUrl,
            },
            b: {
              id: match.face_b.profile.id,
              name: match.face_b.profile.name,
              image: urlB.data?.signedUrl,
            },
          },
        }
      })
    )

    return NextResponse.json(matchesWithUrls)

  } catch (error: any) {
    console.error('Get matches error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Phase 5: Background Jobs Migration (3-4 hours)

### 4.1 Create Job Queue Table

**Migration:** `create_job_queue.sql`

```sql
CREATE TABLE IF NOT EXISTS jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    payload jsonb,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error text,
    scheduled_at timestamptz,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled ON jobs(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_jobs_type ON jobs(type);
```

### 4.2 Job Processor API Route

**File:** `src/app/api/cron/process-jobs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db/supabase'

/**
 * Process pending background jobs
 * Called by Vercel Cron every 5 minutes
 */
export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch pending jobs
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(10)

    if (error) throw error

    const results = []

    for (const job of jobs || []) {
      try {
        // Mark as processing
        await supabaseAdmin
          .from('jobs')
          .update({ status: 'processing', started_at: new Date().toISOString() })
          .eq('id', job.id)

        // Process based on job type
        switch (job.type) {
          case 'celebrity_match':
            await processCelebrityMatch(job)
            break
          case 'batch_embeddings':
            await processBatchEmbeddings(job)
            break
          default:
            throw new Error(`Unknown job type: ${job.type}`)
        }

        // Mark as completed
        await supabaseAdmin
          .from('jobs')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', job.id)

        results.push({ id: job.id, status: 'completed' })

      } catch (jobError: any) {
        // Mark as failed
        await supabaseAdmin
          .from('jobs')
          .update({
            status: 'failed',
            error: jobError.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id)

        results.push({ id: job.id, status: 'failed', error: jobError.message })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    })

  } catch (error: any) {
    console.error('Job processing error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function processCelebrityMatch(job: any) {
  // Implementation for celebrity matching job
  // ...
}

async function processBatchEmbeddings(job: any) {
  // Implementation for batch embedding job
  // ...
}
```

### 4.3 Vercel Cron Configuration

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/process-jobs",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Environment Variable:**
```env
CRON_SECRET=<secure-random-key>
```

---

## Phase 6: Complete Testing & Validation (4-5 hours)

### 5.1 Update API Base URL

**File:** `.env.local`

```env
# Change from backend URL to Next.js API
NEXT_PUBLIC_BASE_API_URL=/api
```

### 5.2 No other changes needed!

The frontend already uses Axios with relative URLs, so changing the base URL to `/api` automatically routes requests to Next.js API Routes instead of the Flask backend.

**Existing code works as-is:**
```typescript
// features/matching/api/get-live-match.ts
export const getLiveMatchApi = async (): Promise<LiveMatchApi[]> => {
  const { data } = await apiClient.get('/matches/top')  // Now calls /api/matches/top
  return data
}
```

---

## Phase 7: Production Deployment (2-3 hours)

### 6.1 Vector Search Performance Testing

```sql
-- Test query performance
EXPLAIN ANALYZE
SELECT
    f.id,
    1 - (f.embedding <=> '[0.1, 0.2, ...]'::vector) as similarity
FROM faces f
WHERE f.embedding IS NOT NULL
ORDER BY f.embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 20;

-- Expected: Index Scan using faces_embedding_hnsw_idx
```

### 6.2 End-to-End Feature Testing

**Test Checklist:**
- [ ] Face upload → embedding extraction → storage → pgvector
- [ ] Find similar faces (user-to-user matching)
- [ ] Celebrity matching
- [ ] Match creation and display
- [ ] Baby generation
- [ ] Reactions
- [ ] Real-time updates (Supabase Realtime still works)

### 6.3 Performance Benchmarks

**Metrics to track:**
- Face upload latency (target: <3s)
- Vector search query time (target: <100ms for 10k vectors)
- API route response time (target: <500ms)
- Python microservice response time (target: <2s)

---

## Phase 8: Cleanup & Documentation (2 hours)

### 7.1 Deploy Python AI Service

```bash
cd python-ai-service
railway up
# Or: fly deploy
# Or: gcloud run deploy
```

### 7.2 Deploy Next.js to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

### 7.3 Environment Variables (Vercel Dashboard)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# Python AI Service
PYTHON_AI_SERVICE_URL=
PYTHON_AI_SERVICE_API_KEY=

# FAL.AI
FAL_AI_API_KEY=

# Cron
CRON_SECRET=
```

---

## Migration Checklist

### Pre-Migration
- [ ] Backup Supabase database
- [ ] Export Qdrant vectors for backup
- [ ] Document current API endpoints
- [ ] Create migration branch: `git checkout -b feat/backend-migration`

### Phase 1: Next.js API Routes - Auth Only (Day 1)
- [ ] Create folder structure (src/lib/db, src/lib/middleware)
- [ ] Create supabase-server.ts (admin client + helpers)
- [ ] Add SUPABASE_SERVICE_ROLE_KEY to .env.local
- [ ] Create auth middleware (requireAuth helper)
- [ ] Create error handler utility
- [ ] Implement GET /api/auth/me (with default face image)
- [ ] Implement PATCH /api/auth/me (with validation)
- [ ] Test GET /api/auth/me with Postman/Thunder Client
- [ ] Test PATCH /api/auth/me with Postman/Thunder Client
- [ ] Test with frontend (profile page)

### Phase 2: Supabase Vector Migration (Day 2-3)
- [ ] Enable pgvector extension
- [ ] Add embedding column to faces table
- [ ] Create HNSW index
- [ ] Create vector search functions
- [ ] Migrate embeddings from Qdrant to Supabase
- [ ] Verify migration with sample queries
- [ ] Performance test vector search

### Phase 3: Python Microservice (Day 2-3 - Parallel)
- [ ] Create python-ai-service folder
- [ ] Write minimal Flask app (extract embedding, compare faces)
- [ ] Write Dockerfile
- [ ] Test locally with Docker
- [ ] Deploy to Railway/Fly.io
- [ ] Test deployed service (health check, extract embedding)
- [ ] Add API key authentication

### Phase 4: Next.js API Routes - Remaining (Day 4-5)
- [ ] Create src/lib/db/vector.ts (Supabase Vector search helpers)
- [ ] Create src/lib/services/ai-service.ts (Python microservice client)
- [ ] Create src/lib/services/match-service.ts (match logic with pgvector)
- [ ] Implement GET /api/matches/top (using Supabase Vector)
- [ ] Implement GET /api/matches/user/[userId] (user matches)
- [ ] Implement GET /api/matches/celebrity (celebrity matches)
- [ ] Implement POST /api/faces (face upload with embedding)
- [ ] Implement GET /api/faces (list user faces)
- [ ] Implement DELETE /api/faces/[id] (delete face)
- [ ] Implement POST /api/baby (generate baby)
- [ ] Implement GET /api/baby (get baby for match)
- [ ] Implement GET /api/baby/list (list user babies)
- [ ] Implement POST /api/matches/[matchId]/react (add reaction)
- [ ] Implement DELETE /api/matches/[matchId]/react (remove reaction)
- [ ] Test each endpoint with Postman/Thunder Client
- [ ] Update NEXT_PUBLIC_BASE_API_URL=/api
- [ ] Test all features with frontend

### Phase 5: Background Jobs (Day 6)
- [ ] Create jobs table
- [ ] Implement job processor route
- [ ] Configure Vercel Cron
- [ ] Test job execution

### Phase 6: Complete Testing (Day 6-7)
- [ ] Update .env.local (NEXT_PUBLIC_BASE_API_URL=/api)
- [ ] Test all features in dev environment
- [ ] Fix any breaking changes

### Phase 7: Deployment (Day 7)
- [ ] End-to-end testing (all features)
- [ ] Performance testing (vector search, API routes)
- [ ] Load testing (Python microservice)
- [ ] Error handling testing
- [ ] Edge cases testing

### Phase 8: Cleanup (Day 7)
- [ ] Deploy Python microservice to production
- [ ] Deploy Next.js to Vercel
- [ ] Configure production environment variables
- [ ] Verify Vercel Cron works
- [ ] Run smoke tests in production
- [ ] Monitor logs for errors

### Post-Migration
- [ ] Monitor performance metrics
- [ ] Decommission Qdrant (after 1-2 weeks)
- [ ] Decommission Flask backend
- [ ] Update documentation
- [ ] Remove unused dependencies

---

## Rollback Plan

If critical issues arise:

1. **Immediate rollback (< 1 hour):**
   - Revert .env.local to old backend URL
   - Old Flask backend still running (keep for 2 weeks)
   - Qdrant still has all vectors

2. **Partial rollback:**
   - Keep Next.js API routes
   - Fall back to Qdrant for vector search
   - Fix issues incrementally

3. **Data recovery:**
   - Qdrant vectors backed up before migration
   - Supabase point-in-time recovery available
   - Python microservice stateless (no data loss risk)

---

## Success Criteria

Migration complete when:
- [ ] All API endpoints respond correctly
- [ ] Vector search performance ≥ Qdrant (< 100ms)
- [ ] Face upload end-to-end works
- [ ] All features functional (matching, baby gen, reactions)
- [ ] No console errors or warnings
- [ ] Production deployment successful
- [ ] 24hr monitoring shows stability
- [ ] Python microservice 99%+ uptime
- [ ] Vercel Cron jobs execute successfully

---

## Cost Comparison

### Before (Current)
- Vercel (frontend): $0 (free tier)
- Backend hosting: $10-50/month (VPS/cloud)
- Qdrant Cloud: $25-100/month
- Redis: Included in backend
- **Total: $35-150/month**

### After (Target)
- Vercel (frontend + API): $20/month (Pro plan for Cron)
- Python AI service: $5-10/month (Railway/Fly.io)
- Supabase: $25/month (Pro plan for Vector)
- **Total: $50-55/month**

**Savings: ~$0-95/month** (depending on current spend)

**Benefits beyond cost:**
- Simpler architecture
- Unified codebase
- Type-safe end-to-end
- Better DX (single deploy)
- Easier debugging

---

## Resources

### Supabase Vector Documentation
- [Vector/Embeddings Guide](https://supabase.com/docs/guides/ai/vector-columns)
- [pgvector Extension](https://github.com/pgvector/pgvector)
- [Similarity Search](https://supabase.com/docs/guides/ai/vector-similarity-search)

### Python Microservice Hosting
- [Railway](https://railway.app/)
- [Fly.io](https://fly.io/)
- [Google Cloud Run](https://cloud.google.com/run)

### Next.js API Routes
- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

**Last Updated:** 2025-10-26

**Status:** 📋 Ready for Implementation

**Estimated Timeline:** 30-40 hours (1-2 weeks full-time, 2-3 weeks part-time)
