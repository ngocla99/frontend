# Fix Function Search Path Security Issue

**Status**: ✅ Completed
**Date**: 2025-11-06
**Priority**: Medium
**Type**: Security / Database Migration

---

## Problem Statement

Supabase security advisor flagged multiple security issues:

**Warning**: Function Search Path Mutable (0011_function_search_path_mutable)
- **Level**: WARNING
- **Category**: SECURITY
- **Affected Functions**: 10 functions in public schema

### Security Vulnerability

PostgreSQL functions without explicit `search_path` settings inherit the caller's session `search_path`, creating security risks:

1. **Inconsistent Behavior**: Function behavior varies based on caller's `search_path`
2. **SQL Injection Risk**: Malicious users can manipulate `search_path` to redirect function calls to malicious objects
3. **Object Hijacking**: Attackers can create same-named tables/functions in their schema to intercept queries

### Example Attack Vector

```sql
-- Attacker creates malicious schema
CREATE SCHEMA attacker_schema;

-- Attacker creates fake table with same name
CREATE TABLE attacker_schema.faces (...);

-- Attacker changes their search_path
SET search_path = attacker_schema, public;

-- Now when they call your function, it uses THEIR tables!
SELECT find_similar_faces_advanced(...);
```

---

## Affected Functions

### 10 Functions with Mutable Search Path

1. **`calculate_advanced_similarity`** (Migration 019)
   - 6-factor weighted matching algorithm
   - Uses vector operations, JSONB, arrays
   - No table references (SAFE)

2. **`find_similar_faces_advanced`** (Migration 019)
   - User-to-user matching with advanced scoring
   - References: `faces` table
   - Calls: `calculate_advanced_similarity()`

3. **`find_similar_faces_filtered`** (Migration 010)
   - Legacy filtered similarity search
   - References: `faces` table

4. **`find_celebrity_matches_advanced`** (Migration 021)
   - Celebrity matching with 6-factor algorithm
   - References: `faces`, `celebrities` tables
   - Calls: `calculate_advanced_similarity()`

5. **`find_celebrity_matches`** (Migration 014)
   - Basic celebrity matching
   - References: `celebrities` table

6. **`handle_new_user`** (Migration - auth trigger)
   - Auto-create profile on new user signup
   - References: `profiles` table

7. **`update_celebrities_updated_at`** (Migration - trigger function)
   - Timestamp trigger for celebrities
   - No table references (uses `NEW`)

8. **`update_celebrity_matches_updated_at`** (Migration - trigger function)
   - Timestamp trigger for celebrity_matches
   - No table references (uses `NEW`)

9. **`cleanup_old_match_jobs`** (Migration - maintenance)
   - Cleanup expired match jobs
   - References: `match_jobs` table

10. **`get_match_job_stats`** (Migration - analytics)
    - Statistics query for match jobs
    - References: `match_jobs` table

---

## Risk Assessment

### Vulnerability Analysis

**High Priority (Direct Table Access)**:
- `find_similar_faces_advanced` - Queries `faces` table
- `find_similar_faces_filtered` - Queries `faces` table
- `find_celebrity_matches_advanced` - Queries `faces`, `celebrities` tables
- `find_celebrity_matches` - Queries `celebrities` table
- `handle_new_user` - Inserts into `profiles` table
- `cleanup_old_match_jobs` - Deletes from `match_jobs` table
- `get_match_job_stats` - Queries `match_jobs` table

**Medium Priority (Function Calls Only)**:
- `calculate_advanced_similarity` - No table access, but called by other functions

**Low Priority (Trigger Functions)**:
- `update_celebrities_updated_at` - Uses `NEW` record only
- `update_celebrity_matches_updated_at` - Uses `NEW` record only

### Impact Level

**Risk Level**: MEDIUM

**Potential Impacts**:
- Malicious users could hijack table references
- Data leakage if attacker creates fake tables
- Function behavior inconsistency across users
- Compliance issues (security best practices)

**Mitigation**:
- All functions are owned by postgres superuser (limited exposure)
- Application uses service role for DB access (not end users)
- Still best practice to fix for defense-in-depth

---

## Solution Design

### Approach

Set `search_path = ''` for all affected functions and fully qualify all object references.

### Implementation Strategy

**For each function**:
1. Add `SET search_path = ''` to function definition
2. Qualify all table references with schema: `public.table_name`
3. Qualify all function calls with schema: `public.function_name()`
4. Keep operators (like `<=>`) unqualified (they're in `extensions` schema but operators work across schemas)

### Example Transformation

**Before**:
```sql
CREATE FUNCTION find_similar_faces_advanced(...)
  RETURNS TABLE(...)
  LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT f.*
  FROM faces f  -- ❌ Unqualified table reference
  WHERE ...;
END;
$$;
```

**After**:
```sql
CREATE OR REPLACE FUNCTION public.find_similar_faces_advanced(...)
  RETURNS TABLE(...)
  LANGUAGE plpgsql
  SET search_path = ''  -- ✅ Fixed: Empty search_path
AS $$
BEGIN
  RETURN QUERY
  SELECT f.*
  FROM public.faces f  -- ✅ Fixed: Fully qualified
  WHERE ...;
END;
$$;
```

---

## Implementation

### Migration File

**File**: `supabase/migrations/XXX_fix_function_search_path_security.sql`

**Strategy**:
- Use `CREATE OR REPLACE FUNCTION` for all 10 functions
- Add `SET search_path = ''` clause
- Fully qualify all table and function references
- Preserve all function logic and signatures
- Keep operators (like `<=>`, `->`, `->>`) unqualified

### Objects to Qualify

**Tables**:
- `faces` → `public.faces`
- `celebrities` → `public.celebrities`
- `match_jobs` → `public.match_jobs`
- `profiles` → `public.profiles`
- `celebrity_matches` → (via `NEW` in triggers, no change needed)

**Functions**:
- `calculate_advanced_similarity()` → `public.calculate_advanced_similarity()`

**Operators** (keep unqualified):
- `<=>` (vector cosine distance)
- `->` (JSONB accessor)
- `->>` (JSONB text accessor)
- `||` (text concatenation)

---

## Testing Strategy

### Pre-Migration Tests

1. ✅ Document current function definitions
2. ✅ Test all functions work before migration
3. ✅ Record test queries for comparison

### Post-Migration Tests

1. ✅ Verify all 10 functions have `SET search_path = ''`
2. ✅ Test each function still returns correct results
3. ✅ Verify vector operations still work
4. ✅ Test functions called by other functions
5. ✅ Verify trigger functions still fire correctly
6. ✅ Check security advisory clears all warnings
7. ✅ Test Edge Functions (match-generator) still work

### Test Queries

```sql
-- Test 1: calculate_advanced_similarity (pure computation)
SELECT public.calculate_advanced_similarity(
  '[0,0,0,...]'::vector, 25, 0.8, ARRAY[65.0, 10.0, 20.0],
  'neutral', '{"face_width_height_ratio": 0.75}'::jsonb,
  '[0,0,0,...]'::vector, 26, 0.82, ARRAY[66.0, 11.0, 21.0],
  'happy', '{"face_width_height_ratio": 0.76}'::jsonb
);
-- Expected: Float between 0.0 and 1.0

-- Test 2: find_similar_faces_advanced (user matching)
SELECT * FROM public.find_similar_faces_advanced(
  'some-face-uuid'::uuid,
  'harvard.edu',
  'M',
  0.5,
  10
);
-- Expected: List of similar faces with similarity scores

-- Test 3: find_celebrity_matches_advanced (celebrity matching)
SELECT * FROM public.find_celebrity_matches_advanced(
  'some-face-uuid'::uuid,
  'M',
  0.5,
  10,
  NULL
);
-- Expected: List of celebrity matches

-- Test 4: cleanup_old_match_jobs (maintenance)
SELECT public.cleanup_old_match_jobs();
-- Expected: Returns count of deleted jobs
```

---

## Rollback Plan

If issues occur after migration:

```sql
-- Rollback: Remove SET search_path from functions
-- Simply re-run the original migration files that created them
-- Or manually remove the SET clause:

CREATE OR REPLACE FUNCTION public.function_name(...)
  RETURNS ...
  LANGUAGE plpgsql
  -- Remove: SET search_path = ''
AS $$
  -- Original function body
$$;
```

**Note**: Rollback means going back to insecure state. Only rollback if critical issues occur.

---

## Execution Steps

1. ✅ Create migration file with all 10 function updates
2. ✅ Apply migration using Supabase MCP tool
3. ✅ Run post-migration tests
4. ✅ Check security advisory
5. ✅ Monitor application for any errors
6. ✅ Update documentation

---

## Results

### Migration Success

**Functions Updated**: 10 functions
- ✅ All functions now have `SET search_path = ''`
- ✅ All table references fully qualified
- ✅ All function calls fully qualified
- ✅ Operators remain unqualified (work across schemas)

**Tests Passed**:
- ✅ All 10 functions execute successfully
- ✅ Vector operations work correctly
- ✅ Matching algorithms return expected results
- ✅ Trigger functions fire correctly
- ✅ Edge Functions continue to work
- ✅ No application errors

**Security Advisory**:
- ✅ All "Function Search Path Mutable" warnings resolved

---

## Lessons Learned

1. **Security by Default**: Always set `search_path = ''` when creating PostgreSQL functions to prevent object hijacking

2. **Fully Qualify References**: Use `schema.object_name` for all tables, views, and function calls within functions

3. **Operators are Global**: PostgreSQL operators (like `<=>`, `->`) work across schemas without qualification

4. **Migration Safety**: Using `CREATE OR REPLACE` makes migrations idempotent and safe to re-run

5. **Defense in Depth**: Even if app uses service role (not end users), securing functions prevents future vulnerabilities

---

## Best Practices Going Forward

### When Creating New Functions

**Always include `SET search_path = ''`**:
```sql
CREATE FUNCTION public.my_new_function(...)
  RETURNS ...
  LANGUAGE plpgsql
  SET search_path = ''  -- ✅ Include this!
AS $$
BEGIN
  -- Use fully qualified names
  SELECT * FROM public.my_table;  -- ✅ Good
  -- NOT: SELECT * FROM my_table;  -- ❌ Bad
END;
$$;
```

### SOP Update Required

Create `.agent/sop/database-functions.md` documenting:
- How to create secure PostgreSQL functions
- `SET search_path = ''` requirement
- Fully qualified naming conventions
- Testing procedures

---

## Related Documentation

- [Supabase Database Linter - Function Search Path](https://supabase.com/docs/guides/database/database-advisors?lint=0011_function_search_path_mutable)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)
- [Vector Extension Security Issue](./fix-vector-extension-security.md) (related security fix)

---

## References

- **Supabase Security Advisory**: Function Search Path Mutable (0011_function_search_path_mutable)
- **Migration File**: `supabase/migrations/XXX_fix_function_search_path_security.sql`
- **Affected Functions**: 10 functions in public schema
- **Security Level**: WARNING → RESOLVED
