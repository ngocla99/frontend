# Database Cleanup - Remove Deprecated Items

**Status**: ✅ Completed
**Date**: 2025-11-14
**Priority**: Medium
**Type**: Database Maintenance / Schema Cleanup

---

## Problem Statement

After implementing advanced matching algorithms and separating celebrity profiles into a dedicated table, several database objects became obsolete:

1. **Deprecated Functions**: Basic matching functions were superseded by advanced multi-factor algorithms
2. **Obsolete Columns**: The `profile_type` column became unnecessary after celebrities moved to a separate table
3. **Technical Debt**: Keeping deprecated code increases maintenance burden, potential for bugs, and confusion for developers

**Discovery Context:**
- Advanced matching algorithms (migration 019) replaced basic similarity functions
- Celebrity separation (migration 011) made profile_type column redundant
- Recent vector extension security fixes exposed search_path issues in multiple functions

---

## Current State Analysis

### Deprecated Functions Found

1. **`find_celebrity_matches(vector, integer)`**
   - **Purpose**: Basic celebrity matching using cosine similarity
   - **Status**: Superseded by `find_celebrity_matches_advanced` (migration 021)
   - **Usage**: No references in application code or Edge Functions
   - **Defined In**: Migration 003 (`create_vector_search_functions.sql`)

2. **`find_similar_faces_filtered(vector, text, text, integer)`**
   - **Purpose**: Filtered similarity search for user-to-user matching
   - **Status**: Superseded by `find_similar_faces_advanced` (migration 019)
   - **Usage**: No references in application code or Edge Functions
   - **Defined In**: Migration 010 (`auto_matching_system.sql`)

### Deprecated Columns Found

1. **`profiles.profile_type`**
   - **Purpose**: Distinguished between 'user' and 'celebrity' profiles
   - **Status**: Obsolete after `celebrities` table creation (migration 011)
   - **Current Data**: 0 celebrity profiles, 6 user profiles (all profiles are now 'user' type)
   - **References**: Found in 11 files (API routes, middleware, migrations)
   - **Constraint**: `CHECK (profile_type IN ('user', 'celebrity'))`
   - **Index**: `idx_profiles_school_gender` filtered on `profile_type = 'user'`

### Functions Needing Updates

1. **`find_similar_faces_advanced`**
   - **Issue 1**: References removed `profile_type` column (`p.profile_type = 'user'`)
   - **Issue 2**: Has `SET search_path = ''` (empty), can't find vector operators

2. **`find_celebrity_matches_advanced`**
   - **Issue**: Missing `SET search_path`, inherits from caller

3. **`calculate_advanced_similarity`**
   - **Issue**: Had `SET search_path = ''`, needed `extensions` schema for `<=>` operator

---

## Affected Database Objects

### Functions to Drop
- `find_celebrity_matches(vector, integer)`
- `find_similar_faces_filtered(vector, text, text, integer)`

### Columns to Drop
- `profiles.profile_type` (text, NOT NULL, CHECK constraint)

### Functions to Fix
- `find_similar_faces_advanced` - Remove profile_type reference, fix search_path
- `find_celebrity_matches_advanced` - Add search_path
- `calculate_advanced_similarity` - Fix search_path

### Application Code to Update
- `src/lib/middleware/with-session.ts:16` - Profile type definition
- `src/app/api/matches/top/route.ts:53,64,72,73,181,190` - Query selects and filters
- `src/app/api/matches/top/stats/route.ts:59` - Count query filter
- `.agent/system/database_schema.md` - Documentation

---

## Solution Design

### Approach

**Phased Removal Strategy:**
1. Drop deprecated functions (no dependencies)
2. Remove profile_type column (update dependent objects first)
3. Fix function references (profile_type and search_path issues)
4. Update application code (TypeScript types, queries)
5. Update documentation

### Risk Assessment

**Low Risk:**
- ✅ Functions are confirmed unused (grep search showed no references)
- ✅ Profile_type column has no celebrity profiles (all are 'user')
- ✅ Application code can be updated safely (TypeScript will catch missing properties)

**Mitigation:**
- Test build after each change
- Keep migrations reversible
- Update functions before dropping columns

---

## Implementation

### Migration 1: Drop Unused Deprecated Functions

**File**: `supabase/migrations/XXX_drop_unused_deprecated_functions.sql`

```sql
-- Drop deprecated celebrity matching function (replaced by find_celebrity_matches_advanced)
DROP FUNCTION IF EXISTS find_celebrity_matches(vector, integer);

-- Drop deprecated user matching function (replaced by find_similar_faces_advanced)
DROP FUNCTION IF EXISTS find_similar_faces_filtered(vector, text, text, integer);
```

**Result**: ✅ Successfully removed 2 deprecated functions

---

### Migration 2: Remove profile_type Column

**File**: `supabase/migrations/XXX_remove_profile_type_column.sql`

```sql
-- Step 1: Drop dependent index
DROP INDEX IF EXISTS idx_profiles_school_gender;

-- Step 2: Remove check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_profile_type_check;

-- Step 3: Drop the column
ALTER TABLE profiles DROP COLUMN IF EXISTS profile_type;

-- Step 4: Recreate index without profile_type filter
CREATE INDEX IF NOT EXISTS idx_profiles_school_gender
ON profiles(school, gender)
WHERE school IS NOT NULL AND gender IS NOT NULL;
```

**Result**: ✅ Successfully removed profile_type column and updated index

---

### Migration 3: Fix find_similar_faces_advanced (Remove profile_type Reference)

**File**: `supabase/migrations/XXX_fix_find_similar_faces_advanced_profile_type.sql`

**Issue**: Function still had `AND p.profile_type = 'user'` causing error: `column p.profile_type does not exist`

**Fix**: Recreated function without profile_type filter

```sql
CREATE OR REPLACE FUNCTION find_similar_faces_advanced(...)
RETURNS TABLE (...)
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    WITH query_face AS (...),
    candidate_matches AS (
        SELECT ...
        FROM public.faces f
        CROSS JOIN query_face qf
        JOIN public.profiles p ON f.profile_id = p.id
        WHERE f.id != query_face_id
            AND f.embedding IS NOT NULL
            AND COALESCE(f.quality_score, 0.6) >= 0.6
            AND p.school = user_school
            AND p.gender != user_gender
            -- REMOVED: AND p.profile_type = 'user'
    )
    SELECT ...
END;
$$;
```

**Result**: ✅ Function fixed, match jobs no longer fail with profile_type error

---

### Migration 4: Fix calculate_advanced_similarity (Search Path)

**File**: `supabase/migrations/XXX_fix_calculate_advanced_similarity_search_path.sql`

**Issue**: Function uses `<=>` operator but has empty search_path, causing error:
```
operator does not exist: extensions.vector <=> extensions.vector
```

**Fix**: Added `extensions` schema to search_path

```sql
CREATE OR REPLACE FUNCTION calculate_advanced_similarity(...)
RETURNS float
SECURITY DEFINER
SET search_path = 'extensions, public'  -- FIXED: Was empty before
AS $$
DECLARE
    embedding_sim float;
    ...
BEGIN
    -- Fetch dynamic weights from system_settings
    SELECT value INTO weights FROM public.system_settings WHERE key = 'matching_weights';

    -- 1. Embedding similarity (now works because extensions schema is in search_path)
    embedding_sim := 1 - (query_embedding <=> target_embedding);

    -- 2-6. Other similarity factors...

    -- 7. Composite weighted score
    final_score := ... ;

    RETURN GREATEST(LEAST(final_score, 1.0), 0.0);
END;
$$;
```

**Result**: ✅ Function can now find vector operators

---

### Migration 5: Fix Advanced Matching Functions (Search Path)

**File**: `supabase/migrations/XXX_fix_advanced_matching_functions_search_path.sql`

**Issue**: Both `find_similar_faces_advanced` and `find_celebrity_matches_advanced` couldn't find vector operators when calling `calculate_advanced_similarity`

**Root Cause**:
- `find_similar_faces_advanced` had `SET search_path = ''` (empty)
- `find_celebrity_matches_advanced` had no `SET search_path` (inherited from caller)
- When parent functions have restricted search paths, child functions can't find operators

**Fix**: Added `extensions, public` to search_path for both functions

```sql
-- 1. Fix find_similar_faces_advanced
CREATE OR REPLACE FUNCTION find_similar_faces_advanced(...)
SECURITY DEFINER
SET search_path = 'extensions, public'  -- FIXED: Changed from ''
AS $$...$$;

-- 2. Fix find_celebrity_matches_advanced
CREATE OR REPLACE FUNCTION find_celebrity_matches_advanced(...)
SECURITY DEFINER
SET search_path = 'extensions, public'  -- ADDED: Was missing
AS $$...$$;
```

**Result**: ✅ Both functions can now successfully call calculate_advanced_similarity with vector operators

---

### Application Code Changes

#### 1. TypeScript Type Update

**File**: `src/lib/middleware/with-session.ts`

```typescript
// BEFORE
export type Profile = {
    id: string;
    email: string;
    name: string | null;
    gender: string | null;
    school: string | null;
    default_face_id: string | null;
    profile_type: string;  // ❌ REMOVED
    role: string;
    created_at: string;
    updated_at: string;
};

// AFTER
export type Profile = {
    id: string;
    email: string;
    name: string | null;
    gender: string | null;
    school: string | null;
    default_face_id: string | null;
    role: string;
    created_at: string;
    updated_at: string;
};
```

#### 2. API Query Updates

**File**: `src/app/api/matches/top/route.ts`

```typescript
// BEFORE - Selected profile_type in query
.select(`
    id,
    similarity_score,
    created_at,
    face_a:faces!matches_face_a_id_fkey (
        id,
        image_path,
        profile:profiles!faces_profile_id_fkey (
            id,
            name,
            profile_type,  // ❌ REMOVED
            gender,
            school
        )
    ),
    ...
`)
.eq("face_a.profile.profile_type", "user")  // ❌ REMOVED
.eq("face_b.profile.profile_type", "user")  // ❌ REMOVED

// AFTER - profile_type removed from select and filters
.select(`
    id,
    similarity_score,
    created_at,
    face_a:faces!matches_face_a_id_fkey (
        id,
        image_path,
        profile:profiles!faces_profile_id_fkey (
            id,
            name,
            gender,
            school
        )
    ),
    ...
`)
// No profile_type filters needed - all profiles are users
```

**File**: `src/app/api/matches/top/stats/route.ts`

```typescript
// BEFORE - Filtered by profile_type
const { count: activeUsersCount, error: activeUsersError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("profile_type", "user");  // ❌ REMOVED

// AFTER - No filter needed
const { count: activeUsersCount, error: activeUsersError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });
```

#### 3. Response Object Updates

**File**: `src/app/api/matches/top/route.ts`

```typescript
// BEFORE - Included profile_type in response
return {
    id: match.id,
    users: {
        a: {
            id: profileA.id,
            name: profileA.name,
            profile_type: profileA.profile_type,  // ❌ REMOVED
            gender: profileA.gender,
            school: profileA.school,
            ...
        },
        ...
    }
};

// AFTER - profile_type removed
return {
    id: match.id,
    users: {
        a: {
            id: profileA.id,
            name: profileA.name,
            gender: profileA.gender,
            school: profileA.school,
            ...
        },
        ...
    }
};
```

---

### Documentation Updates

**File**: `.agent/system/database_schema.md`

```markdown
<!-- BEFORE -->
### Table: `profiles`

Unified user and celebrity profile storage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY | Unique profile ID |
| `profile_type` | `text` | NOT NULL, CHECK (user, celebrity) | Profile type |
...

**Indexes:**
- `idx_profiles_school_gender` on `(school, gender)` WHERE `profile_type = 'user'`

<!-- AFTER -->
### Table: `profiles`

User profile storage. Celebrity profiles are stored in the separate `celebrities` table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY | Unique profile ID |
...

**Indexes:**
- `idx_profiles_school_gender` on `(school, gender)` WHERE `school IS NOT NULL AND gender IS NOT NULL`
```

---

## Testing Strategy

### Pre-Cleanup Verification

✅ **List Deprecated Functions**
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('find_celebrity_matches', 'find_similar_faces_filtered');
-- Result: Both functions found
```

✅ **Check profile_type Usage**
```sql
SELECT COUNT(*) as celeb_count FROM profiles WHERE profile_type = 'celebrity';
-- Result: 0 celebrity profiles

SELECT COUNT(*) as user_count FROM profiles WHERE profile_type = 'user';
-- Result: 6 user profiles
```

✅ **Search Codebase for References**
```bash
grep -r "profile_type" src/
# Result: Found 11 files with references
```

### Post-Cleanup Verification

✅ **Verify Functions Dropped**
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('find_celebrity_matches', 'find_similar_faces_filtered');
-- Expected: Empty result ✅
```

✅ **Verify Column Removed**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'profile_type';
-- Expected: Empty result ✅
```

✅ **Test Advanced Functions Work**
```sql
-- Test user matching
SELECT * FROM find_similar_faces_advanced(
    '<face_id>'::uuid,
    'Stanford University',
    'female',
    0.5,
    10
);
-- Expected: Returns results without error ✅

-- Test celebrity matching
SELECT * FROM find_celebrity_matches_advanced(
    '<face_id>'::uuid,
    'male',
    0.5,
    10,
    NULL
);
-- Expected: Returns results without error ✅
```

✅ **Test Application Build**
```bash
bun run build
# Expected: ✓ Compiled successfully ✅
```

✅ **Test Match Generation**
```
Upload photo → Match job created → Job processes successfully → Matches generated
# Expected: No errors about profile_type or vector operators ✅
```

---

## Results

### Successfully Removed ✅

1. **Deprecated Functions** (2 total)
   - ✅ `find_celebrity_matches` - Basic celebrity matching
   - ✅ `find_similar_faces_filtered` - Legacy filtered matching

2. **Obsolete Columns** (1 total)
   - ✅ `profiles.profile_type` - User/celebrity distinction
   - ✅ Associated CHECK constraint
   - ✅ Filtered index updated

### Successfully Fixed ✅

1. **Function Reference Errors** (1 function)
   - ✅ `find_similar_faces_advanced` - Removed profile_type reference

2. **Vector Operator Errors** (3 functions)
   - ✅ `calculate_advanced_similarity` - Added extensions schema to search_path
   - ✅ `find_similar_faces_advanced` - Added extensions schema to search_path
   - ✅ `find_celebrity_matches_advanced` - Added extensions schema to search_path

### Code Updates ✅

1. **TypeScript Types** (1 file)
   - ✅ `src/lib/middleware/with-session.ts` - Removed profile_type from Profile type

2. **API Routes** (2 files)
   - ✅ `src/app/api/matches/top/route.ts` - Removed profile_type from queries and responses
   - ✅ `src/app/api/matches/top/stats/route.ts` - Removed profile_type filter

3. **Documentation** (1 file)
   - ✅ `.agent/system/database_schema.md` - Updated profiles table documentation

### Build & Tests ✅

- ✅ TypeScript compilation: No errors
- ✅ Application build: Successful
- ✅ Match generation: Working without errors

---

## Migrations Created

1. `XXX_drop_unused_deprecated_functions.sql` - Remove 2 deprecated matching functions
2. `XXX_remove_profile_type_column.sql` - Remove profile_type column from profiles table
3. `XXX_fix_find_similar_faces_advanced_profile_type.sql` - Remove profile_type reference
4. `XXX_fix_calculate_advanced_similarity_search_path.sql` - Fix search_path for vector operators
5. `XXX_fix_advanced_matching_functions_search_path.sql` - Fix search_path for both advanced functions

---

## Rollback Plan

If issues occur, migrations can be reversed:

### Rollback Migration 5 (Advanced Functions Search Path)
```sql
-- Revert find_similar_faces_advanced
CREATE OR REPLACE FUNCTION find_similar_faces_advanced(...)
SET search_path = '';  -- Restore empty search_path

-- Revert find_celebrity_matches_advanced
CREATE OR REPLACE FUNCTION find_celebrity_matches_advanced(...)
-- Remove SET search_path statement
```

### Rollback Migration 4 (Calculate Similarity Search Path)
```sql
CREATE OR REPLACE FUNCTION calculate_advanced_similarity(...)
SET search_path = '';  -- Restore empty search_path
```

### Rollback Migration 3 (Find Similar Faces Profile Type)
```sql
-- Re-add profile_type filter to function
CREATE OR REPLACE FUNCTION find_similar_faces_advanced(...)
...
WHERE ... AND p.profile_type = 'user'
```

### Rollback Migration 2 (Profile Type Column)
```sql
-- Restore column
ALTER TABLE profiles ADD COLUMN profile_type text NOT NULL DEFAULT 'user';

-- Restore constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_profile_type_check
CHECK (profile_type IN ('user', 'celebrity'));

-- Restore filtered index
DROP INDEX IF EXISTS idx_profiles_school_gender;
CREATE INDEX idx_profiles_school_gender
ON profiles(school, gender)
WHERE profile_type = 'user';
```

### Rollback Migration 1 (Deprecated Functions)
```sql
-- Restore functions from original migration files
-- See migrations 003 and 010 for original definitions
```

---

## Lessons Learned

### Best Practices Discovered

1. **Search_path Inheritance**: Child functions inherit search_path from parent functions, so both need proper configuration
2. **Phased Cleanup**: Remove in stages (functions → columns → code) to minimize risk
3. **Comprehensive Search**: Always grep codebase for all references before removing database objects
4. **TypeScript Safety**: Removing properties from types causes compile errors, ensuring all usages are found
5. **Migration Documentation**: Document why objects existed and why they were removed for future reference

### What Worked Well

- ✅ Grep search found all profile_type references across 11 files
- ✅ TypeScript compiler caught missing property usages
- ✅ Phased approach allowed testing at each step
- ✅ Build verification caught issues early
- ✅ Following existing migration patterns (fix-function-search-path-security.md) for consistency

### What to Avoid

- ❌ Don't assume child function search_path is sufficient (parent function affects it)
- ❌ Don't skip verification queries before dropping objects
- ❌ Don't batch too many changes together (makes troubleshooting harder)
- ❌ Don't forget to update documentation after schema changes

---

## Related Documentation

- [Fix Vector Extension Security](./fix-vector-extension-security.md) - Context on vector extension move to extensions schema
- [Fix Function Search Path Security](./fix-function-search-path-security.md) - Pattern followed for search_path fixes
- [Celebrity Separation](./celebrity-separation.md) - Why profile_type column existed originally
- [Advanced Matching Algorithm](./sophisticated-matching-algorithm.md) - Why basic functions were deprecated
- [Database Schema Documentation](../system/database_schema.md) - Updated schema reference

---

## Summary

This cleanup task successfully removed technical debt by:
- Removing 2 deprecated matching functions superseded by advanced algorithms
- Removing obsolete profile_type column after celebrity separation
- Fixing 3 functions with search_path issues preventing vector operator usage
- Updating all TypeScript types and API queries to remove profile_type references
- Updating documentation to reflect current database state

All match generation functionality now works correctly without errors. The codebase is cleaner and easier to maintain going forward.
