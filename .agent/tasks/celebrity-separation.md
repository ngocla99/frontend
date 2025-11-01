# Celebrity Separation - Implementation Plan

## Overview
Restructure the database to use a dedicated `celebrities` table with embedded face data (no reference to faces table), update the matching system to generate both user and celebrity matches simultaneously, and create a seed migration for celebrity data.

## Status: Phase 1-3 Complete ✅

**Completed:**
- ✅ Phase 1: Database schema changes (migrations 011-015)
- ✅ Phase 2: Backend updates (Edge Function, API endpoints, types)
- ✅ Phase 3: Celebrity seeding infrastructure (script + documentation)

**Pending:**
- ⏳ Phase 4: Frontend updates (optional - depends on UI requirements)
- ⏳ Actual celebrity data collection and seeding

---

## Phase 1: Database Schema Changes

### 1.1 Create New `celebrities` Table
**File:** `supabase/migrations/011_create_celebrities_table.sql`

Create a dedicated celebrities table with embedded face data:

```sql
CREATE TABLE celebrities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  category TEXT, -- 'actor', 'musician', 'athlete', etc.
  gender TEXT CHECK (gender IN ('male', 'female')),
  image_path TEXT NOT NULL, -- Stored in celebrity-images bucket
  embedding vector(512), -- InsightFace embedding stored directly in this table
  image_hash TEXT UNIQUE, -- Prevent duplicate celebrity images
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector index for similarity search
CREATE INDEX idx_celebrities_embedding ON celebrities
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create indexes for filtering
CREATE INDEX idx_celebrities_category ON celebrities(category);
CREATE INDEX idx_celebrities_gender ON celebrities(gender);

COMMENT ON TABLE celebrities IS 'Celebrity profiles with embedded face data for lookalike matching';
COMMENT ON COLUMN celebrities.embedding IS '512-dimensional InsightFace embedding vector';
```

### 1.2 Update `matches` Table Schema
**File:** `supabase/migrations/012_update_matches_for_celebrities.sql`

Add support for celebrity matches:

```sql
-- Add celebrity_id column
ALTER TABLE matches ADD COLUMN celebrity_id UUID REFERENCES celebrities(id);

-- Update match_type constraint to ensure it includes user_to_celebrity
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_match_type_check;
ALTER TABLE matches ADD CONSTRAINT matches_match_type_check
  CHECK (match_type IN ('user_to_user', 'user_to_celebrity'));

-- Add index for celebrity matches
CREATE INDEX idx_matches_celebrity_id ON matches(celebrity_id) WHERE celebrity_id IS NOT NULL;

-- Add constraint: celebrity matches should have face_b_id = NULL
ALTER TABLE matches ADD CONSTRAINT matches_celebrity_structure_check
  CHECK (
    (match_type = 'user_to_user' AND celebrity_id IS NULL AND face_b_id IS NOT NULL) OR
    (match_type = 'user_to_celebrity' AND celebrity_id IS NOT NULL AND face_b_id IS NULL)
  );

COMMENT ON COLUMN matches.celebrity_id IS 'Celebrity ID for user-to-celebrity matches (face_b_id will be NULL)';
```

### 1.3 Create Storage Bucket
**File:** `supabase/migrations/013_create_celebrity_storage_bucket.sql`

```sql
-- Create celebrity-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'celebrity-images',
  'celebrity-images',
  true, -- Public bucket for CDN
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Allow public read access
CREATE POLICY "Public read access for celebrity images"
ON storage.objects FOR SELECT
USING (bucket_id = 'celebrity-images');

-- Allow authenticated uploads (admin only - to be enforced at API level)
CREATE POLICY "Authenticated users can upload celebrity images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'celebrity-images');
```

---

## Phase 2: Vector Search Functions

### 2.1 Update Celebrity Match Function
**File:** `supabase/migrations/014_update_celebrity_vector_search.sql`

```sql
-- Drop old function if exists
DROP FUNCTION IF EXISTS find_celebrity_matches(vector, int);

-- Create new function that queries celebrities table directly
CREATE OR REPLACE FUNCTION find_celebrity_matches(
    query_embedding vector(512),
    match_count int DEFAULT 10,
    gender_filter text DEFAULT NULL,
    category_filter text DEFAULT NULL
)
RETURNS TABLE (
    celebrity_id uuid,
    celebrity_name text,
    similarity float,
    image_path text,
    bio text,
    category text,
    gender text
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    1 - (c.embedding <=> query_embedding) as similarity,
    c.image_path,
    c.bio,
    c.category,
    c.gender
  FROM celebrities c
  WHERE c.embedding IS NOT NULL
    AND (gender_filter IS NULL OR c.gender = gender_filter)
    AND (category_filter IS NULL OR c.category = category_filter)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION find_celebrity_matches IS 'Find celebrity lookalikes using vector similarity search';
```

---

## Phase 3: Background Matching System Updates

### 3.1 Update Match Job Schema
**File:** `supabase/migrations/015_update_match_jobs_schema.sql`

```sql
-- Add job_type column to distinguish match types
ALTER TABLE match_jobs
  ADD COLUMN job_type TEXT DEFAULT 'both'
  CHECK (job_type IN ('user_match', 'celebrity_match', 'both'));

-- Add index
CREATE INDEX idx_match_jobs_job_type ON match_jobs(job_type);

COMMENT ON COLUMN match_jobs.job_type IS 'Type of matching to perform: user_match, celebrity_match, or both';
```

### 3.2 Update Edge Function: Match Generator
**File:** `supabase/functions/match-generator/index.ts`

Update the existing match generator to handle both user and celebrity matches:

```typescript
// After generating user-to-user matches, add celebrity matching:

// Step 1: Get the user's face embedding
const { data: userFace, error: faceError } = await supabaseClient
  .from('faces')
  .select('id, profile_id, embedding')
  .eq('id', job.face_id)
  .single();

if (faceError || !userFace?.embedding) {
  throw new Error('Failed to fetch user face embedding');
}

// Step 2: Get user's gender for opposite gender filtering
const { data: userProfile } = await supabaseClient
  .from('profiles')
  .select('gender')
  .eq('id', userFace.profile_id)
  .single();

const oppositeGender = userProfile?.gender === 'male' ? 'female' : 'male';

// Step 3: Generate celebrity matches if job_type allows
if (job.job_type === 'celebrity_match' || job.job_type === 'both') {
  const { data: celebrityMatches, error: celebError } = await supabaseClient
    .rpc('find_celebrity_matches', {
      query_embedding: userFace.embedding,
      match_count: 20, // Top 20 celebrity matches
      gender_filter: oppositeGender
    });

  if (celebError) {
    console.error('Celebrity matching error:', celebError);
  } else if (celebrityMatches && celebrityMatches.length > 0) {
    // Insert celebrity matches
    const celebMatchInserts = celebrityMatches.map((celeb: any) => ({
      face_a_id: userFace.id,
      face_b_id: null, // No face reference for celebrities
      celebrity_id: celeb.celebrity_id,
      similarity_score: celeb.similarity,
      match_type: 'user_to_celebrity'
    }));

    const { error: insertError } = await supabaseClient
      .from('matches')
      .upsert(celebMatchInserts, {
        onConflict: 'face_a_id,celebrity_id',
        ignoreDuplicates: false
      });

    if (insertError) {
      console.error('Failed to insert celebrity matches:', insertError);
    } else {
      console.log(`Generated ${celebMatchInserts.length} celebrity matches for face ${userFace.id}`);
    }
  }
}
```

### 3.3 Update Face Upload Endpoint
**File:** `src/app/api/faces/route.ts`

Change match job creation to generate both match types:

```typescript
// After inserting the new face, create match job
const { error: jobError } = await supabase.from('match_jobs').insert({
  face_id: newFace.id,
  profile_id: session.user.id,
  status: 'pending',
  job_type: 'both' // Generate both user and celebrity matches
});
```

---

## Phase 4: Celebrity Seed Data & Scripts

### 4.1 Create Celebrity Seed Migration Template
**File:** `supabase/migrations/016_seed_celebrities.sql`

```sql
-- Initial celebrity seed data (embeddings to be added via script)
INSERT INTO celebrities (id, name, bio, category, gender, image_path) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Sample Celebrity 1', 'Famous actor known for...', 'actor', 'male', 'celebrities/celeb-001.jpg'),
  ('c1000000-0000-0000-0000-000000000002', 'Sample Celebrity 2', 'Popular musician...', 'musician', 'female', 'celebrities/celeb-002.jpg');
  -- Add more celebrities here

-- Note: Embeddings will be generated and updated via Python script (see scripts/generate-celebrity-embeddings.py)
```

### 4.2 Create TypeScript Embedding Generator Script
**File:** `scripts/generate-celebrity-embeddings.ts`

Create a TypeScript script that uses your existing AI service:
1. Process celebrity images from a local folder
2. Generate InsightFace embeddings via existing `extractEmbedding()` service
3. Upload images to Supabase `celebrity-images` bucket
4. Update `celebrities` table with image_path and embedding

```typescript
#!/usr/bin/env tsx
/**
 * Celebrity Embedding Generator
 *
 * This script:
 * 1. Loads celebrity images from ./data/celebrities/ folder
 * 2. Extracts 512D InsightFace embeddings using existing AI service
 * 3. Uploads images to Supabase celebrity-images bucket
 * 4. Updates celebrities table with embeddings
 *
 * Usage:
 *   npx tsx scripts/generate-celebrity-embeddings.ts
 *
 * Requirements:
 *   - Celebrity images in ./data/celebrities/
 *   - AI service running (PYTHON_AI_SERVICE_URL)
 *   - Supabase credentials in .env
 *
 * Image folder structure:
 *   ./data/celebrities/
 *     ├── actors/
 *     │   ├── tom-cruise.jpg
 *     │   └── jennifer-lawrence.jpg
 *     ├── musicians/
 *     │   ├── taylor-swift.jpg
 *     │   └── bruno-mars.jpg
 *     └── metadata.json  (optional: contains bio, gender, etc.)
 */

import { createClient } from '@supabase/supabase-js';
import { extractEmbedding } from '../src/lib/services/ai-service';
import { readdir, readFile } from 'fs/promises';
import { join, basename, extname } from 'path';
import { createHash } from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CELEBRITIES_DIR = './data/celebrities';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface CelebrityMetadata {
  name: string;
  bio?: string;
  category: string;
  gender: 'male' | 'female';
  filename: string;
}

async function loadMetadata(): Promise<Map<string, CelebrityMetadata>> {
  try {
    const metadataPath = join(CELEBRITIES_DIR, 'metadata.json');
    const content = await readFile(metadataPath, 'utf-8');
    const data = JSON.parse(content);

    const map = new Map<string, CelebrityMetadata>();
    for (const celeb of data.celebrities) {
      map.set(celeb.filename, celeb);
    }
    return map;
  } catch (error) {
    console.warn('No metadata.json found, will use filename as name');
    return new Map();
  }
}

async function processCelebrityImage(
  filePath: string,
  filename: string,
  category: string,
  metadata?: CelebrityMetadata
) {
  console.log(`Processing: ${filename}...`);

  // 1. Read image file
  const imageBuffer = await readFile(filePath);

  // 2. Generate image hash for deduplication
  const imageHash = createHash('md5').update(imageBuffer).digest('hex');

  // 3. Extract embedding using existing AI service
  let embedding: number[];
  try {
    embedding = await extractEmbedding(Buffer.from(imageBuffer));
    console.log(`  ✓ Embedding extracted (${embedding.length}D)`);
  } catch (error: any) {
    console.error(`  ✗ Failed to extract embedding: ${error.message}`);
    return { success: false, filename, error: error.message };
  }

  // 4. Upload image to Supabase storage
  const storagePath = `celebrities/${category}/${filename}`;
  const { error: uploadError } = await supabase.storage
    .from('celebrity-images')
    .upload(storagePath, imageBuffer, {
      contentType: `image/${extname(filename).slice(1)}`,
      upsert: true
    });

  if (uploadError) {
    console.error(`  ✗ Upload failed: ${uploadError.message}`);
    return { success: false, filename, error: uploadError.message };
  }
  console.log(`  ✓ Uploaded to storage: ${storagePath}`);

  // 5. Insert/update celebrity in database
  const name = metadata?.name || basename(filename, extname(filename))
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  const { error: dbError } = await supabase
    .from('celebrities')
    .upsert({
      name,
      bio: metadata?.bio,
      category,
      gender: metadata?.gender || 'male', // Default, should be in metadata
      image_path: storagePath,
      embedding: `[${embedding.join(',')}]`, // PostgreSQL vector format
      image_hash: imageHash
    }, {
      onConflict: 'image_hash',
      ignoreDuplicates: false
    });

  if (dbError) {
    console.error(`  ✗ Database insert failed: ${dbError.message}`);
    return { success: false, filename, error: dbError.message };
  }

  console.log(`  ✓ Saved to database: ${name}`);
  return { success: true, filename, name };
}

async function main() {
  console.log('🎭 Celebrity Embedding Generator\n');

  // Load metadata
  const metadata = await loadMetadata();
  console.log(`Loaded metadata for ${metadata.size} celebrities\n`);

  // Get all categories (subdirectories)
  const categories = await readdir(CELEBRITIES_DIR, { withFileTypes: true });

  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[]
  };

  for (const category of categories) {
    if (!category.isDirectory()) continue;

    const categoryName = category.name;
    console.log(`\n📁 Processing category: ${categoryName}`);

    const categoryPath = join(CELEBRITIES_DIR, categoryName);
    const files = await readdir(categoryPath);

    for (const file of files) {
      // Skip non-image files
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extname(file).toLowerCase())) {
        continue;
      }

      const filePath = join(categoryPath, file);
      const meta = metadata.get(file);

      const result = await processCelebrityImage(
        filePath,
        file,
        categoryName,
        meta
      );

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(result);
      }

      // Rate limit: wait 500ms between requests to avoid overwhelming AI service
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`  ✓ Success: ${results.success}`);
  console.log(`  ✗ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => {
      console.log(`  - ${err.filename}: ${err.error}`);
    });
  }
}

main().catch(console.error);
```

**Example metadata.json:**

```json
{
  "celebrities": [
    {
      "filename": "tom-cruise.jpg",
      "name": "Tom Cruise",
      "bio": "American actor known for Mission Impossible series",
      "category": "actors",
      "gender": "male"
    },
    {
      "filename": "taylor-swift.jpg",
      "name": "Taylor Swift",
      "bio": "Grammy-winning singer-songwriter",
      "category": "musicians",
      "gender": "female"
    }
  ]
}
```

**Run the script:**

```bash
# Install tsx if not already installed
npm install -D tsx

# Make sure AI service is running
# Make sure PYTHON_AI_SERVICE_URL is set in .env

# Run the script
npx tsx scripts/generate-celebrity-embeddings.ts
```

### 4.3 Celebrity Data Collection Checklist
- [ ] Collect 20-50 celebrity images
- [ ] Ensure gender balance (50/50 male/female)
- [ ] Categories: actors, musicians, athletes, influencers
- [ ] Image requirements:
  - Front-facing portraits
  - Good lighting
  - Clear face visibility
  - High resolution (min 512x512)
- [ ] Organize in `data/celebrities/` folder
- [ ] Create metadata CSV with: filename, name, bio, category, gender

---

## Phase 5: API Updates

### 5.1 Create Celebrity Match API Endpoint
**File:** `src/app/api/matches/celebrity/route.ts`

Create new endpoint for fetching celebrity matches:

```typescript
import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { STORAGE_BUCKETS } from "@/lib/constants/constant";
import { withSession } from "@/lib/middleware/with-session";

/**
 * GET /api/matches/celebrity - Get celebrity lookalike matches for current user
 *
 * Query params:
 *   - face_id: Optional face ID to get matches for (defaults to default_face_id)
 *   - limit: Number of results (default: 20)
 *   - category: Filter by celebrity category (optional)
 */
export const GET = withSession(async ({ session, searchParams, supabase }) => {
  const faceId = searchParams.face_id;
  const limit = parseInt(searchParams.limit || "20", 10);
  const category = searchParams.category;

  // Get user's default face if not specified
  let targetFaceId = faceId;
  if (!targetFaceId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_face_id')
      .eq('id', session.user.id)
      .single();

    targetFaceId = profile?.default_face_id;
  }

  if (!targetFaceId) {
    return NextResponse.json({ error: 'No face found for user' }, { status: 404 });
  }

  // Fetch celebrity matches
  let query = supabase
    .from('matches')
    .select(`
      id,
      similarity_score,
      created_at,
      celebrity:celebrities!matches_celebrity_id_fkey (
        id,
        name,
        bio,
        category,
        gender,
        image_path
      )
    `)
    .eq('match_type', 'user_to_celebrity')
    .eq('face_a_id', targetFaceId)
    .order('similarity_score', { ascending: false })
    .limit(limit);

  if (category) {
    // Filter by category through the celebrity relationship
    query = query.eq('celebrity.category', category);
  }

  const { data: matches, error } = await query;

  if (error) {
    throw error;
  }

  // Sign celebrity image URLs
  const matchesWithSignedUrls = await Promise.all(
    (matches || []).map(async (match: any) => {
      const celebrity = match.celebrity;

      const { data: signedUrl } = await supabase.storage
        .from(STORAGE_BUCKETS.CELEBRITY_IMAGES)
        .createSignedUrl(celebrity.image_path, env.SUPABASE_SIGNED_URL_TTL);

      return {
        id: match.id,
        similarity_score: match.similarity_score,
        created_at: match.created_at,
        celebrity: {
          ...celebrity,
          image_url: signedUrl?.signedUrl || ''
        }
      };
    })
  );

  return NextResponse.json({
    matches: matchesWithSignedUrls,
    total: matchesWithSignedUrls.length
  });
});
```

### 5.2 Update Constants
**File:** `src/lib/constants/constant.ts`

Add new storage bucket constant:

```typescript
export const STORAGE_BUCKETS = {
  USER_IMAGES: "user-images",
  CELEBRITY_IMAGES: "celebrity-images", // Add this
} as const;
```

### 5.3 Update TypeScript Types
**File:** `src/types/api.ts`

Add celebrity-related types:

```typescript
export type Celebrity = {
  id: string;
  name: string;
  bio?: string;
  category?: string;
  gender?: string;
  image_path: string;
  image_url?: string; // Signed URL
};

export type CelebrityMatch = {
  id: string;
  similarity_score: number;
  celebrity: Celebrity;
  created_at: string;
};
```

---

## Phase 6: Data Migration (Existing Celebrity Data)

### 6.1 Migrate Existing Celebrity Profiles
**File:** `supabase/migrations/017_migrate_existing_celebrities.sql`

```sql
-- Copy existing celebrity profiles from profiles+faces to celebrities table
INSERT INTO celebrities (name, gender, image_path, embedding, created_at)
SELECT
  p.name,
  p.gender,
  f.image_path,
  f.embedding,
  p.created_at
FROM profiles p
JOIN faces f ON f.profile_id = p.id
WHERE p.profile_type = 'celebrity'
  AND f.embedding IS NOT NULL
ON CONFLICT (image_hash) DO NOTHING;

-- Update existing user_to_celebrity matches to reference new celebrities table
UPDATE matches m
SET celebrity_id = c.id,
    face_b_id = NULL
FROM celebrities c
JOIN faces f ON f.embedding = c.embedding
WHERE m.match_type = 'user_to_celebrity'
  AND m.face_b_id = f.id
  AND m.celebrity_id IS NULL;

-- Optional: Clean up old celebrity data from profiles/faces
-- Uncomment after verifying migration worked correctly:
-- DELETE FROM faces WHERE profile_id IN (SELECT id FROM profiles WHERE profile_type = 'celebrity');
-- DELETE FROM profiles WHERE profile_type = 'celebrity';
```

---

## Phase 7: Frontend Updates

### 7.1 Update Celebrity Match Hook
**File:** `src/features/matching/api/get-celebrity-matches.ts`

Create new API hook:

```typescript
import { queryOptions, useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { QueryConfig } from "@/lib/react-query";
import type { CelebrityMatch } from "@/types/api";

export type GetCelebrityMatchesInput = {
  faceId?: string;
  limit?: number;
  category?: string;
};

export const getCelebrityMatchesApi = async (
  input: GetCelebrityMatchesInput = {},
  _signal?: AbortSignal,
): Promise<CelebrityMatch[]> => {
  const response = await api.get<{
    matches: CelebrityMatch[];
    total: number;
  }>("/matches/celebrity", { params: input });
  return response.matches;
};

export const getCelebrityMatchesQueryOptions = (
  input: GetCelebrityMatchesInput = {},
) => {
  return queryOptions({
    queryKey: ["celebrity-matches", input],
    queryFn: ({ signal }) => getCelebrityMatchesApi(input, signal),
  });
};

export const useCelebrityMatches = ({
  input = {},
  queryConfig,
}: {
  input?: GetCelebrityMatchesInput;
  queryConfig?: QueryConfig<typeof getCelebrityMatchesQueryOptions>;
} = {}) => {
  return useQuery({
    ...getCelebrityMatchesQueryOptions(input),
    ...queryConfig,
  });
};
```

### 7.2 Update Celebrity Match Component
**File:** `src/features/matching/components/user-match/celebrity-match/celebrity-match-tab.tsx`

Update to use new API and display celebrity bio/category:

```typescript
// Update to use useCelebrityMatches hook
const { data: celebrityMatches = [], isLoading } = useCelebrityMatches();

// Update card rendering to show bio and category
{celebrityMatches.map((match) => (
  <Card key={match.id}>
    <div className="flex items-center gap-4">
      <BlurImage
        src={match.celebrity.image_url}
        alt={match.celebrity.name}
        width={80}
        height={80}
        className="rounded-full"
      />
      <div className="flex-1">
        <h3 className="font-semibold">{match.celebrity.name}</h3>
        {match.celebrity.bio && (
          <p className="text-sm text-muted-foreground">{match.celebrity.bio}</p>
        )}
        {match.celebrity.category && (
          <Badge variant="outline">{match.celebrity.category}</Badge>
        )}
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-primary">
          {Math.round(match.similarity_score * 100)}%
        </div>
        <p className="text-xs text-muted-foreground">Match</p>
      </div>
    </div>
  </Card>
))}
```

---

## Phase 8: Testing & Validation

### 8.1 Database Tests
- [ ] Run all migrations in order
- [ ] Verify celebrities table created with correct indexes
- [ ] Test vector search function with sample embedding
- [ ] Check constraint enforcement (celebrity_id vs face_b_id)
- [ ] Verify storage bucket created with correct policies

### 8.2 API Tests
- [ ] Upload a face → verify match job created with job_type='both'
- [ ] Wait for background job → verify both user and celebrity matches generated
- [ ] Test GET /api/matches/celebrity endpoint
- [ ] Verify signed URLs for celebrity images work
- [ ] Test category filtering

### 8.3 Integration Tests
- [ ] Upload multiple faces → check match generation
- [ ] Verify Realtime events for both match types
- [ ] Test frontend celebrity match tab
- [ ] Verify match quality (similarity scores > 0.5)
- [ ] Check performance with 50+ celebrities

### 8.4 Performance Tests
- [ ] Benchmark vector search with 100+ celebrities
- [ ] Check match generation time for both user+celebrity
- [ ] Verify index usage in query plans
- [ ] Test concurrent match job processing

---

## Implementation Checklist

### Database (Phases 1-2)
- [ ] Create celebrities table migration (011)
- [ ] Update matches table migration (012)
- [ ] Create storage bucket migration (013)
- [ ] Update vector search function (014)
- [ ] Update match_jobs schema (015)
- [ ] Run all migrations

### Seed Data (Phase 4)
- [ ] Collect celebrity images (20-50)
- [ ] Create celebrity seed migration (016)
- [ ] Build Python embedding generator script
- [ ] Generate embeddings for celebrities
- [ ] Upload to celebrity-images bucket
- [ ] Update celebrities table with embeddings

### Backend (Phases 3, 5)
- [ ] Update match generator Edge Function
- [ ] Update face upload endpoint
- [ ] Create celebrity match API endpoint
- [ ] Add STORAGE_BUCKETS.CELEBRITY_IMAGES constant
- [ ] Add celebrity types to api.ts

### Data Migration (Phase 6)
- [ ] Create migration script (017)
- [ ] Test migration on staging
- [ ] Run migration on production
- [ ] Verify existing matches updated
- [ ] Clean up old celebrity data (optional)

### Frontend (Phase 7)
- [ ] Create celebrity matches API hook
- [ ] Update celebrity match component
- [ ] Add celebrity bio/category display
- [ ] Update types

### Testing (Phase 8)
- [ ] Database tests
- [ ] API tests
- [ ] Integration tests
- [ ] Performance tests

---

## Rollback Plan

If something goes wrong:

1. **Revert migrations** in reverse order:
   ```bash
   supabase migration revert 017
   supabase migration revert 016
   # ... etc
   ```

2. **Restore old celebrity matching**:
   - Keep old `find_celebrity_matches()` function
   - Keep profiles.profile_type = 'celebrity'
   - Revert match generator changes

3. **Data backup**: Before Phase 6, backup:
   ```sql
   -- Backup existing celebrity data
   CREATE TABLE profiles_backup AS SELECT * FROM profiles WHERE profile_type = 'celebrity';
   CREATE TABLE faces_backup AS SELECT f.* FROM faces f JOIN profiles p ON p.id = f.profile_id WHERE p.profile_type = 'celebrity';
   ```

---

## Success Criteria

- ✅ Celebrities stored in separate table with embedded face data
- ✅ No references from celebrities → faces table
- ✅ User face upload triggers both user and celebrity matching
- ✅ Celebrity matches generated within 1-2 minutes of face upload
- ✅ Celebrity images served from separate bucket
- ✅ Celebrity match API returns bio, category, and similarity score
- ✅ Frontend displays celebrity matches with additional metadata
- ✅ 20+ celebrities seeded with valid embeddings
- ✅ All tests passing

---

## Notes

- Celebrity images should be high-quality, front-facing portraits
- Consider adding more categories: politicians, social_media, historical
- Celebrity data can be updated via admin interface (future feature)
- Monitor vector search performance as celebrity count grows
- Consider caching celebrity matches for popular celebrities
