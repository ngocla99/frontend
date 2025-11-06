# Fix Vector Extension Security Issue

**Status**: ✅ Completed
**Date**: 2025-11-06
**Priority**: Medium
**Type**: Security / Database Migration

---

## Problem Statement

Supabase security advisor flagged a security issue:

**Warning**: Extension in Public Schema
- **Entity**: `public.vector`
- **Issue**: Extension `vector` is installed in the public schema and should be moved to another schema
- **Level**: WARNING
- **Category**: SECURITY

### Why This Matters

Installing extensions in the `public` schema creates security vulnerabilities:
1. Exposes extension functions/types to all users with public schema access
2. Can lead to naming conflicts with user-defined objects
3. Makes permission and access control management harder
4. Not following PostgreSQL and Supabase best practices

---

## Current State Analysis

### Vector Extension Usage

**Tables Using Vector Type** (3 tables):
- `faces.embedding` - 512-dimensional user face embeddings
- `celebrities.embedding` - 512-dimensional celebrity face embeddings
- `match_jobs.embedding` - 512-dimensional job queue embeddings

**Vector Indexes** (2 indexes):
- `faces_embedding_hnsw_idx` - HNSW index (m=16, ef_construction=64)
- `idx_celebrities_embedding` - IVFFlat index (lists=100)

**Functions Using Vector Operations** (5 functions):
1. `calculate_advanced_similarity()` - 6-factor weighted matching
2. `find_similar_faces_advanced()` - User-to-user matching
3. `find_similar_faces_filtered()` - Legacy filtered similarity
4. `find_celebrity_matches_advanced()` - Celebrity matching with advanced algorithm
5. `find_celebrity_matches()` - Basic celebrity matching

All functions use the `<=>` cosine distance operator for similarity calculations.

---

## Solution Design

### Approach

Move the `vector` extension from `public` schema to a dedicated `extensions` schema, following Supabase best practices.

### Migration Strategy

**Option Chosen**: Schema Migration with Search Path

1. Create `extensions` schema
2. Move `vector` extension to `extensions` schema
3. Add `extensions` to default search_path
4. PostgreSQL automatically resolves vector types from extensions schema

**Why This Works**:
- PostgreSQL's search_path allows transparent type resolution across schemas
- No need to update column definitions (vector type resolved automatically)
- No need to update function definitions (operators work across schemas)
- All existing queries continue to work without modification

### Risk Assessment

**Risk Level**: MEDIUM

**Potential Impacts**:
- Database schema change requires migration
- Temporary downtime during migration (~30 seconds)
- Need to ensure search_path includes extensions schema

**Mitigation**:
- Test migration in development first
- Create rollback migration
- Monitor post-migration for any issues
- All data remains intact (only extension location changes)

---

## Implementation

### Migration File

**File**: `supabase/migrations/XXX_move_vector_extension_to_extensions_schema.sql`

**Contents**:
```sql
-- Move vector extension from public to extensions schema
-- This resolves Supabase security advisory: Extension in Public

-- Step 1: Create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Step 2: Move vector extension to extensions schema
ALTER EXTENSION vector SET SCHEMA extensions;

-- Step 3: Update search_path to include extensions schema
-- This ensures vector types are automatically resolved
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Step 4: Verify the change
-- The extension should now be in the extensions schema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'vector' AND n.nspname = 'extensions'
  ) THEN
    RAISE EXCEPTION 'Vector extension was not moved to extensions schema';
  END IF;
END $$;
```

### Application Changes Required

**None!**

- TypeScript/JavaScript code only calls RPC functions
- No direct vector type references in application code
- PostgreSQL's search_path handles type resolution automatically
- All existing queries continue to work

---

## Testing Strategy

### Pre-Migration Tests

1. ✅ Verify current extension location (public schema)
2. ✅ List all tables with vector columns
3. ✅ List all vector indexes
4. ✅ Test vector similarity queries work

### Post-Migration Tests

1. ✅ Verify extension moved to extensions schema
2. ✅ Test vector similarity search (cosine distance)
3. ✅ Test HNSW index on faces table
4. ✅ Test IVFFlat index on celebrities table
5. ✅ Execute all 5 vector-dependent functions
6. ✅ Check Supabase security advisor (warning should be gone)
7. ✅ Test Edge Function (match-generator) still works

### Test Queries

```sql
-- Test 1: Verify extension schema
SELECT n.nspname as schema, e.extname as extension
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'vector';
-- Expected: schema = 'extensions'

-- Test 2: Test cosine similarity search
SELECT id, 1 - (embedding <=> '[0,0,0,...]'::vector) as similarity
FROM faces
LIMIT 5;
-- Expected: Returns results without error

-- Test 3: Test function execution
SELECT * FROM find_similar_faces_advanced(
  '[0,0,0,...]'::vector,
  'school_id',
  'M'
);
-- Expected: Returns results without error
```

---

## Rollback Plan

If issues occur after migration, rollback with this migration:

```sql
-- Rollback: Move vector extension back to public schema
ALTER EXTENSION vector SET SCHEMA public;

-- Restore original search_path
ALTER DATABASE postgres SET search_path TO public;
```

**Note**: All data remains intact. Only extension schema location changes.

---

## Execution Steps

1. ✅ Create migration file in Supabase
2. ✅ Apply migration using Supabase MCP tool
3. ✅ Run post-migration tests
4. ✅ Check security advisory
5. ✅ Monitor application for any errors
6. ✅ Update documentation

---

## Results

### Migration Success

**Extension Location**:
- Before: `public.vector`
- After: `extensions.vector`

**Tests Passed**:
- ✅ All 3 tables with vector columns work correctly
- ✅ Both vector indexes (HNSW, IVFFlat) functional
- ✅ All 5 functions using vector operations execute successfully
- ✅ Cosine distance operator (`<=>`) works
- ✅ Edge Functions continue to work
- ✅ No application errors

**Security Advisory**:
- ✅ "Extension in Public" warning resolved

---

## Lessons Learned

1. **PostgreSQL's search_path is powerful**: By adding `extensions` to search_path, all type resolution happens automatically without needing to update any code

2. **Schema migrations are safe**: Moving extensions between schemas doesn't affect data or require reindexing

3. **Supabase MCP tools are effective**: The `apply_migration` tool made it easy to execute and verify the migration

4. **Follow best practices early**: Installing extensions in dedicated schemas from the start avoids this migration work

---

## Related Documentation

- [Supabase Database Linter - Extension in Public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)
- [PostgreSQL Extensions Documentation](https://www.postgresql.org/docs/current/sql-createextension.html)
- [pgvector GitHub](https://github.com/pgvector/pgvector)

---

## References

- **Supabase Security Advisory**: Extension in Public (0014_extension_in_public)
- **Migration File**: `supabase/migrations/XXX_move_vector_extension_to_extensions_schema.sql`
- **Affected Tables**: `faces`, `celebrities`, `match_jobs`
- **Affected Indexes**: `faces_embedding_hnsw_idx`, `idx_celebrities_embedding`
- **Affected Functions**: 5 functions using vector operations
