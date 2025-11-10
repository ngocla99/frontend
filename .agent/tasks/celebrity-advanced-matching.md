# Celebrity Advanced Matching Algorithm

**Status:** Planning
**Priority:** High
**Created:** 2025-11-06
**Updated:** 2025-11-06

## Overview

Upgrade celebrity matching system to use the same sophisticated 6-factor matching algorithm currently used for user-to-user matching, ensuring consistent match quality across both systems.

## Current State Analysis

### What's Working
- ✅ Celebrity infrastructure complete (separate `celebrities` table, `celebrity_matches` table)
- ✅ Celebrity images stored in public `celebrity-images` storage bucket
- ✅ Celebrity generation script functional (`scripts/generate-celebrity-embeddings.ts`)
- ✅ Celebrity separation from user data complete (Phase 1-3)
- ✅ Edge Function generates celebrity matches alongside user matches
- ✅ API endpoint `/api/matches/celebrity` retrieves matches with signed URLs

### What's Missing
- ❌ Celebrity matching uses OLD simple cosine similarity (embedding-only)
- ❌ User matching uses NEW 6-factor advanced algorithm
- ❌ Celebrity generation script only extracts basic 512D embeddings
- ❌ No quality gates for celebrity images
- ❌ No multi-factor scoring (geometry, age, symmetry, skin tone, expression)

### Algorithm Comparison

**User Matching (Current - Advanced):**
```
Composite Score =
  20% × Embedding Similarity (cosine) +
  20% × Geometry Ratios (Euclidean) +
  15% × Age Compatibility +
  15% × Symmetry Score +
  15% × Skin Tone Similarity (CIELAB) +
  15% × Expression Match

Quality Gate: Reject if quality_score < 0.6
Threshold: 0.5 (50% minimum similarity)
```

**Celebrity Matching (Current - Simple):**
```
Similarity = 1 - cosine_distance(embedding_a, embedding_b)

No quality gate
No multi-factor scoring
Gender filter only
```

## Customer Requirements

- Consistent match quality between user-user and user-celebrity matches
- Same sophisticated 6-factor algorithm for all matching
- Quality gates to ensure only high-quality celebrity images are matched
- Better celebrity match accuracy using facial attributes beyond embeddings

## Technical Architecture

### Database Schema Changes

#### 1. Celebrities Table Extension (Migration 020)

Add 14 new columns to match `faces` table structure:

```sql
ALTER TABLE celebrities
ADD COLUMN IF NOT EXISTS age INT,
ADD COLUMN IF NOT EXISTS symmetry_score FLOAT,
ADD COLUMN IF NOT EXISTS skin_tone_lab FLOAT[],
ADD COLUMN IF NOT EXISTS expression TEXT,
ADD COLUMN IF NOT EXISTS geometry_ratios JSONB,
ADD COLUMN IF NOT EXISTS quality_score FLOAT,
ADD COLUMN IF NOT EXISTS blur_score FLOAT,
ADD COLUMN IF NOT EXISTS illumination_score FLOAT,
ADD COLUMN IF NOT EXISTS landmarks_68 JSONB,
ADD COLUMN IF NOT EXISTS pose JSONB,
ADD COLUMN IF NOT EXISTS emotion_scores JSONB,
ADD COLUMN IF NOT EXISTS expression_confidence FLOAT,
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;
```

**Indexes:**
```sql
CREATE INDEX idx_celebrities_quality ON celebrities(quality_score);
CREATE INDEX idx_celebrities_age ON celebrities(age);
CREATE INDEX idx_celebrities_expression ON celebrities(expression);
CREATE INDEX idx_celebrities_gender ON celebrities(gender);
```

### 2. Advanced Celebrity Matching Function (Migration 021)

**Function Signature:**
```sql
CREATE OR REPLACE FUNCTION find_celebrity_matches_advanced(
    query_face_id uuid,
    user_gender text,
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 20,
    category_filter text DEFAULT NULL
) RETURNS TABLE (
    celebrity_id uuid,
    celebrity_name text,
    similarity float,
    image_path text,
    age int,
    expression text,
    bio text,
    category text,
    gender text
)
```

**Algorithm:**
```sql
WITH query_face AS (
    SELECT embedding, age, symmetry_score, skin_tone_lab, expression, geometry_ratios
    FROM faces
    WHERE id = query_face_id
),
candidate_matches AS (
    SELECT
        c.id as celebrity_id,
        c.name as celebrity_name,
        calculate_advanced_similarity(
            qf.embedding, qf.age, qf.symmetry_score, qf.skin_tone_lab, qf.expression, qf.geometry_ratios,
            c.embedding, c.age, c.symmetry_score, c.skin_tone_lab, c.expression, c.geometry_ratios
        ) as similarity,
        c.image_path,
        c.age,
        c.expression,
        c.bio,
        c.category,
        c.gender
    FROM celebrities c
    CROSS JOIN query_face qf
    WHERE
        c.embedding IS NOT NULL
        AND COALESCE(c.quality_score, 0.6) >= 0.6  -- Quality gate
        AND c.gender != user_gender  -- Opposite gender
        AND (category_filter IS NULL OR c.category = category_filter)
)
SELECT *
FROM candidate_matches
WHERE similarity >= match_threshold
ORDER BY similarity DESC
LIMIT match_count;
```

**Key Features:**
- Reuses existing `calculate_advanced_similarity()` function (from migration 019)
- Same 6-factor scoring as user matching
- Quality gate at 0.6+ threshold
- Opposite gender filtering
- Optional category filtering (actors, musicians, athletes)

## Implementation Steps

### Step 1: Database Migrations

**File:** `supabase/migrations/020_celebrity_advanced_attributes.sql`
- Add 14 new columns to `celebrities` table
- Create performance indexes
- Add comments for documentation

**File:** `supabase/migrations/021_celebrity_advanced_matching.sql`
- Create `find_celebrity_matches_advanced()` RPC function
- Reuse `calculate_advanced_similarity()` from migration 019
- Apply quality gate and gender filtering

### Step 2: Update Celebrity Generation Script

**File:** `scripts/generate-celebrity-embeddings.ts`

**Changes:**
1. Import advanced face analysis:
```typescript
import { analyzeAdvancedFace } from "../src/lib/services/ai-service";
```

2. Replace embedding extraction:
```typescript
// OLD: const embedding = await extractEmbedding(Buffer.from(imageBuffer));
// NEW: const analysis = await analyzeAdvancedFace(Buffer.from(imageBuffer));
```

3. Add quality gate check:
```typescript
if (analysis.quality.overall < 0.6) {
    console.log(`   ⏭️  Quality too low (${analysis.quality.overall}), skipping`);
    return { success: false, filename, error: "Quality too low", skipped: true };
}
```

4. Store all 14 attributes:
```typescript
await supabase.from("celebrities").upsert({
    name,
    bio: metadata?.bio,
    category,
    gender,
    image_path: storagePath,
    embedding: `[${analysis.embedding.join(",")}]`,
    image_hash: imageHash,
    // NEW: Advanced attributes
    age: analysis.age,
    symmetry_score: analysis.symmetry_score,
    skin_tone_lab: analysis.skin_tone.dominant_color_lab,
    expression: analysis.expression.dominant,
    geometry_ratios: analysis.geometry,
    quality_score: analysis.quality.overall,
    blur_score: analysis.quality.blur_score,
    illumination_score: analysis.quality.illumination,
    landmarks_68: analysis.landmarks_68,
    pose: analysis.pose,
    emotion_scores: analysis.expression.emotions,
    expression_confidence: analysis.expression.confidence,
    analyzed_at: new Date().toISOString()
});
```

### Step 3: Update Edge Function

**File:** `supabase/functions/match-generator/index.ts`

**Changes (lines 298-363):**

```typescript
// OLD:
const { data: celebrityMatches } = await supabase.rpc(
    "find_celebrity_matches",
    {
        query_embedding: typedJob.embedding,
        match_count: 20,
        gender_filter: oppositeGender,
        category_filter: null
    }
);

// NEW:
const { data: celebrityMatches } = await supabase.rpc(
    "find_celebrity_matches_advanced",
    {
        query_face_id: typedJob.face_id,
        user_gender: typedProfile.gender,
        match_threshold: 0.5,  // Same as user matching
        match_count: 20,
        category_filter: null  // Optional: filter by actor/musician/athlete
    }
);
```

**Key Changes:**
- Replace `find_celebrity_matches` → `find_celebrity_matches_advanced`
- Replace `query_embedding` → `query_face_id` (to access all attributes)
- Add `match_threshold: 0.5` (same as user matching)
- Rename `gender_filter` → `user_gender` for clarity

## Testing Checklist

### Database Tests
- [ ] Migration 020 applies successfully
- [ ] Migration 021 applies successfully
- [ ] `calculate_advanced_similarity()` function works with celebrity data
- [ ] `find_celebrity_matches_advanced()` returns expected results
- [ ] Indexes created successfully

### Script Tests
- [ ] Celebrity generation script runs without errors
- [ ] Advanced face analysis extracts all 14 attributes
- [ ] Quality gate rejects low-quality images (< 0.6)
- [ ] All attributes stored correctly in database
- [ ] Image hash deduplication still works

### Edge Function Tests
- [ ] Edge Function deploys successfully (version 13+)
- [ ] Celebrity matches use advanced algorithm
- [ ] User matches continue to work (no regression)
- [ ] Both user and celebrity matches inserted correctly
- [ ] Logs show composite similarity scores (not just cosine distance)

### Integration Tests
- [ ] Upload user photo with high quality (> 0.6)
- [ ] Verify match job created
- [ ] Edge Function processes job successfully
- [ ] User matches generated with advanced algorithm
- [ ] Celebrity matches generated with advanced algorithm
- [ ] API `/api/matches/celebrity` returns results
- [ ] Match scores are consistent (not all 0.95+)

## Deployment Steps

1. **Apply Database Migrations:**
```bash
# Use MCP Supabase
mcp__supabase__apply_migration(name: "020_celebrity_advanced_attributes", query: "...")
mcp__supabase__apply_migration(name: "021_celebrity_advanced_matching", query: "...")
```

2. **Deploy Edge Function:**
```bash
supabase functions deploy match-generator
```

3. **Re-generate Celebrity Embeddings:**
```bash
# Ensure celebrity images are in ./data/celebrities/
npx tsx scripts/generate-celebrity-embeddings.ts
```

4. **Verify Deployment:**
```bash
# Check Edge Function logs
supabase functions logs match-generator --tail

# Query celebrities with new attributes
SELECT id, name, age, quality_score, symmetry_score, expression
FROM celebrities
WHERE quality_score IS NOT NULL
LIMIT 5;
```

## Expected Outcomes

### Before (Current State)
- Celebrity matching: Simple cosine similarity (embedding-only)
- Typical scores: 0.85-0.95 (too high, not discriminative)
- No quality control
- No facial attribute consideration

### After (Advanced Algorithm)
- Celebrity matching: 6-factor composite scoring
- Typical scores: 0.50-0.85 (more realistic, better distribution)
- Quality gate ensures high-quality celebrity images only
- Considers facial geometry, age, symmetry, skin tone, expression

### Benefits
1. **Consistency:** Same algorithm for user-user and user-celebrity matches
2. **Accuracy:** Multi-factor scoring provides better match quality
3. **Reliability:** Quality gates ensure robust matching
4. **Discriminative:** Better score distribution (not all matches > 0.9)

## Future Enhancements

### Phase 2: UI Improvements
- Display celebrity match scores with breakdown (embedding: 85%, geometry: 75%, etc.)
- Show celebrity attributes in match card (age, expression, category)
- Filter celebrities by category (actors, musicians, athletes)

### Phase 3: Performance Optimization
- Pre-compute celebrity embeddings and attributes
- Cache celebrity match results for common user profiles
- Optimize vector search with HNSW indexing

### Phase 4: Advanced Features
- Weighted category preferences (prefer actors over musicians)
- Time-based trending celebrities
- Celebrity lookalike leaderboard

## References

- User matching algorithm: `supabase/migrations/019_advanced_matching_algorithm.sql`
- Advanced face analysis: `src/lib/services/ai-service.ts`
- Celebrity infrastructure: `.agent/tasks/celebrity-separation.md`
- Face attributes: `supabase/migrations/018_advanced_face_attributes.sql`
