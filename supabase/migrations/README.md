# Supabase Migrations - Phase 2: Vector Database Migration

This directory contains SQL migrations for migrating from Qdrant to Supabase Vector (pgvector).

## Migration Files

### 001_enable_pgvector_extension.sql
- Enables the `vector` extension in PostgreSQL
- Required for vector similarity search functionality
- **Run this first**

### 002_add_face_embeddings.sql
- Adds `embedding vector(512)` column to `faces` table
- Creates HNSW index for fast similarity search
- HNSW parameters optimized for < 100k vectors

### 003_create_vector_search_functions.sql
- `find_similar_faces()` - User-to-user face matching
- `find_celebrity_matches()` - Celebrity lookalike search
- Uses cosine distance for normalized embeddings

### 004_migration_verification.sql
- Helper function to check migration progress
- Counts faces with/without embeddings
- Useful for monitoring Qdrant → Supabase migration

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Open each migration file in order (001 → 004)
4. Copy the SQL content
5. Paste and **Run** in the SQL Editor
6. Verify success (check output messages)

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Apply migrations
supabase db push
```

### Option 3: Direct psql Connection

```bash
# Get connection string from Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"

# Run migrations
\i 001_enable_pgvector_extension.sql
\i 002_add_face_embeddings.sql
\i 003_create_vector_search_functions.sql
\i 004_migration_verification.sql
```

## Verification

After applying migrations, verify everything is set up correctly:

```sql
-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check faces table has embedding column
\d faces

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'faces' AND indexname LIKE '%embedding%';

-- Check functions exist
\df find_similar_faces
\df find_celebrity_matches
\df verify_migration_progress

-- Test migration progress
SELECT * FROM verify_migration_progress();
```

## Data Migration

After applying SQL migrations, migrate embeddings from Qdrant:

```bash
cd ../scripts

# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
export QDRANT_URL="https://xxx.qdrant.tech"
export QDRANT_API_KEY="your-qdrant-key"
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# Dry run (test without changes)
python migrate_qdrant_to_supabase.py --dry-run

# Run migration
python migrate_qdrant_to_supabase.py

# Verify only
python migrate_qdrant_to_supabase.py --verify-only
```

## Performance Tuning

### HNSW Index Parameters

Current settings (balanced):
- `m = 16` - connections per layer
- `ef_construction = 64` - build quality

For better accuracy (slower build):
```sql
DROP INDEX faces_embedding_hnsw_idx;
CREATE INDEX faces_embedding_hnsw_idx ON faces
USING hnsw (embedding vector_cosine_ops)
WITH (m = 24, ef_construction = 128);
```

For faster build (lower accuracy):
```sql
DROP INDEX faces_embedding_hnsw_idx;
CREATE INDEX faces_embedding_hnsw_idx ON faces
USING hnsw (embedding vector_cosine_ops)
WITH (m = 12, ef_construction = 32);
```

### Query Performance

```sql
-- Analyze table for query planner
ANALYZE faces;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes
WHERE tablename = 'faces';

-- Explain query plan
EXPLAIN ANALYZE
SELECT * FROM find_similar_faces(
    (SELECT embedding FROM faces WHERE embedding IS NOT NULL LIMIT 1),
    0.5,
    20
);
```

## Rollback Plan

If you need to rollback:

```sql
-- Remove vector search functions
DROP FUNCTION IF EXISTS find_similar_faces;
DROP FUNCTION IF EXISTS find_celebrity_matches;
DROP FUNCTION IF EXISTS verify_migration_progress;

-- Remove index
DROP INDEX IF EXISTS faces_embedding_hnsw_idx;

-- Remove embedding column
ALTER TABLE faces DROP COLUMN IF EXISTS embedding;

-- Disable extension (optional - only if not used elsewhere)
-- DROP EXTENSION IF EXISTS vector;
```

## Troubleshooting

### "extension vector is not available"
- pgvector extension not installed on your Supabase instance
- Contact Supabase support or check if it's available in your plan

### "index method hnsw does not exist"
- HNSW requires pgvector >= 0.5.0
- Check version: `SELECT * FROM pg_extension WHERE extname = 'vector';`

### Slow index creation
- Normal for large datasets (>10k vectors)
- HNSW index builds can take 5-30 minutes
- Monitor progress: `SELECT * FROM pg_stat_progress_create_index;`

### Poor search performance
- Run `ANALYZE faces;`
- Increase `work_mem` for index operations
- Check index is being used: `EXPLAIN ANALYZE` on queries

## Next Steps

After Phase 2 migration:
1. ✅ Verify all faces have embeddings
2. ✅ Test vector search functions
3. ✅ Benchmark query performance
4. → Proceed to Phase 3: Python AI Microservice
5. → Implement Next.js API routes (Phase 4)

## Resources

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Supabase Vector Guide](https://supabase.com/docs/guides/ai/vector-columns)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)
