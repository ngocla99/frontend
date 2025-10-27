# Phase 2: Supabase Vector Migration - Summary

## ✅ Completed Tasks

### 1. SQL Migration Files Created

All SQL migration files have been created in `supabase/migrations/`:

- ✅ **001_enable_pgvector_extension.sql** - Enables pgvector extension
- ✅ **002_add_face_embeddings.sql** - Adds vector(512) column + HNSW index
- ✅ **003_create_vector_search_functions.sql** - Search functions for matching
- ✅ **004_migration_verification.sql** - Progress tracking function

### 2. Data Migration Script

Created Python script for migrating embeddings from Qdrant to Supabase:

- ✅ **scripts/migrate_qdrant_to_supabase.py** - Full migration tool
- ✅ **scripts/requirements.txt** - Python dependencies
- Features:
  - Batch processing
  - Dry-run mode
  - Progress tracking
  - Error handling
  - Verification

### 3. TypeScript Vector Search Library

Created vector search helpers for Next.js API routes:

- ✅ **src/lib/db/vector.ts** - Vector search functions
- Functions:
  - `findSimilarFaces()` - User-to-user matching
  - `findCelebrityMatches()` - Celebrity lookalikes
  - `upsertFaceEmbedding()` - Save embeddings
  - `getMigrationProgress()` - Check migration status

### 4. Documentation

- ✅ **supabase/migrations/README.md** - Complete migration guide
- Includes:
  - Step-by-step instructions
  - Verification queries
  - Performance tuning guide
  - Troubleshooting tips
  - Rollback procedures

## 📋 Next Steps (Action Required)

### Step 1: Apply SQL Migrations to Supabase

Choose one method:

**Method A: Supabase Dashboard (Easiest)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project
2. Navigate to **SQL Editor**
3. Run each migration file in order:
   ```sql
   -- Copy & paste content from each file:
   -- 001_enable_pgvector_extension.sql
   -- 002_add_face_embeddings.sql
   -- 003_create_vector_search_functions.sql
   -- 004_migration_verification.sql
   ```

**Method B: Supabase CLI**

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### Step 2: Verify SQL Migrations

Run verification queries in Supabase SQL Editor:

```sql
-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check embedding column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'faces' AND column_name = 'embedding';

-- Check HNSW index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'faces' AND indexname LIKE '%embedding%';

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('find_similar_faces', 'find_celebrity_matches', 'verify_migration_progress');

-- Check initial migration status (should be 0% if not migrated yet)
SELECT * FROM verify_migration_progress();
```

Expected results:
- ✅ Extension `vector` version 0.8.0+
- ✅ Column `embedding` type `vector(512)`
- ✅ Index `faces_embedding_hnsw_idx`
- ✅ 3 functions exist
- ✅ Migration progress shows 0% (before data migration)

### Step 3: Migrate Data from Qdrant

**Prerequisites:**
```bash
cd frontend/scripts
pip install -r requirements.txt
```

**Set environment variables:**
```bash
export QDRANT_URL="https://xxx.qdrant.tech"
export QDRANT_API_KEY="your-qdrant-key"
export SUPABASE_URL="https://lsbzbltpmmtplakdrjvq.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Run migration:**

```bash
# Test first (no changes made)
python migrate_qdrant_to_supabase.py --dry-run

# Run actual migration
python migrate_qdrant_to_supabase.py

# Verify afterwards
python migrate_qdrant_to_supabase.py --verify-only
```

Expected output:
```
✓ Fetched X vectors from Qdrant
✓ Migrated X/X embeddings
✓ Migration complete!

📊 Migration Statistics:
   Total faces: X
   Faces with embeddings: X
   Migration progress: 100%
```

### Step 4: Test Vector Search

Run test queries in Supabase SQL Editor:

```sql
-- Get a sample embedding
SELECT embedding FROM faces WHERE embedding IS NOT NULL LIMIT 1;

-- Test find_similar_faces (replace embedding with actual value)
SELECT * FROM find_similar_faces(
    (SELECT embedding FROM faces WHERE embedding IS NOT NULL LIMIT 1),
    0.7,  -- 70% similarity threshold
    5     -- top 5 matches
);

-- Test find_celebrity_matches
SELECT * FROM find_celebrity_matches(
    (SELECT embedding FROM faces WHERE embedding IS NOT NULL LIMIT 1),
    5  -- top 5 celebrities
);
```

Expected results:
- ✅ Queries return results in < 100ms
- ✅ Similarity scores between 0 and 1
- ✅ Results sorted by similarity (highest first)

### Step 5: Performance Benchmarking

```sql
-- Analyze table for query planner
ANALYZE faces;

-- Check index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes
WHERE tablename = 'faces';

-- Explain query plan (should use HNSW index)
EXPLAIN ANALYZE
SELECT * FROM find_similar_faces(
    (SELECT embedding FROM faces WHERE embedding IS NOT NULL LIMIT 1),
    0.5,
    20
);
```

Look for: `Index Scan using faces_embedding_hnsw_idx`

## 🎯 Success Criteria

Phase 2 is complete when:

- ✅ pgvector extension enabled
- ✅ `embedding` column exists on `faces` table
- ✅ HNSW index created and active
- ✅ Vector search functions working
- ✅ All embeddings migrated from Qdrant (100% progress)
- ✅ Vector search queries return results < 100ms
- ✅ No errors in Supabase logs

## 🔧 Troubleshooting

### "extension vector is not available"
- pgvector may not be enabled on your Supabase plan
- Contact Supabase support

### "HNSW index build is slow"
- Normal for datasets > 10k vectors
- Can take 5-30 minutes
- Monitor: `SELECT * FROM pg_stat_progress_create_index;`

### "No face found with id=xxx" during migration
- Face record deleted but Qdrant vector still exists
- Normal - these will be skipped
- Check skipped count in migration summary

### Vector search returns empty results
- Check embeddings exist: `SELECT COUNT(*) FROM faces WHERE embedding IS NOT NULL;`
- Lower similarity threshold
- Verify index is being used: `EXPLAIN ANALYZE ...`

## 📊 Migration Checklist

- [ ] SQL migrations applied to Supabase
- [ ] pgvector extension verified
- [ ] HNSW index created
- [ ] Vector search functions created
- [ ] Python migration script environment configured
- [ ] Dry-run migration successful
- [ ] Data migration completed
- [ ] Migration progress = 100%
- [ ] Vector search queries tested
- [ ] Query performance verified (< 100ms)
- [ ] Documentation updated

## 🚀 After Phase 2

Once Phase 2 is complete, you can proceed to:

**Phase 3: Python AI Microservice** (can run in parallel)
- Extract face recognition logic
- Deploy minimal Flask API
- Keep only InsightFace functionality

**Phase 4: Next.js API Routes** (depends on Phase 2)
- Implement face upload endpoints
- Implement match endpoints
- Use new vector search functions
- Replace Flask backend calls

## 📚 Resources

- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Supabase Vector Docs](https://supabase.com/docs/guides/ai/vector-columns)
- [HNSW Algorithm Paper](https://arxiv.org/abs/1603.09320)

---

**Created:** 2025-10-27
**Status:** ✅ Files created, awaiting deployment
**Next:** Apply SQL migrations to Supabase
