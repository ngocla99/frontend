# Sophisticated Multi-Factor Facial Matching Algorithm

**Status:** In Progress
**Priority:** High
**Created:** 2025-11-05
**Approach:** MVP-first with iterative expansion
**Budget:** Minimal cost - open-source models only

---

## Customer Requirements Summary

Implement a sophisticated 0-100% matching algorithm that considers multiple facial attributes beyond simple embedding similarity.

### Customer's 11-Point Feature List

1. ✅ **Facial Embeddings** - Base similarity score (cosine similarity from FaceNet/ArcFace)
2. ✅ **Facial Geometry Ratios** - Landmark-based proportions (jawline, eye spacing, face width-to-height)
3. ✅ **Symmetry Score** - Left-right facial balance for perceived attractiveness
4. ✅ **Skin Tone & Texture Similarity** - Color and smoothness descriptors
5. ✅ **Expression & Emotion Analysis** - Detect dominant expressions and emotional valence
6. ⚠️ **Aesthetic/Style Embedding** - CLIP-style visual vibe encoding (Phase 2)
7. ✅ **Age & Ethnicity Estimation** - Normalization to avoid demographic bias
8. ⚠️ **Attractiveness Prediction** - Pretrained aesthetic models (Phase 2)
9. ⚠️ **Face Shape Classification** - Oval, heart, square, round categories (Phase 2)
10. ❌ **Morph Test Score** - StyleGAN-based blend evaluation (Phase 3 - optional)
11. ✅ **Composite Weighted Score** - Combine all normalized features into 0-100% score

### Adjusted Requirements

- ❌ **Gender confidence removed** - Gender is already filtered in SQL (same school + opposite gender)
- ⬇️ **Embedding weight reduced** - From 40% to 20% to balance other factors
- ⬆️ **Other factors boosted** - More emphasis on geometry, age, aesthetics, emotion

---

## Current System Architecture

### Existing Components

```
┌─────────────────────────────────────────────────────────────┐
│ User uploads photo                                           │
│   ↓                                                          │
│ Next.js API Route (/api/faces)                              │
│   ↓                                                          │
│ Python AI Service (InsightFace)                             │
│   → Extract 512D embedding ONLY                             │
│   ↓                                                          │
│ Supabase PostgreSQL (pgvector)                              │
│   → Store face + embedding                                  │
│   ↓                                                          │
│ Background Job Queue (match_jobs table)                     │
│   ↓                                                          │
│ pg_cron (triggers every 1 minute)                           │
│   ↓                                                          │
│ Supabase Edge Function (match-generator)                    │
│   → Process pending jobs                                    │
│   → Vector similarity search (cosine distance)              │
│   → Filter: same school + opposite gender                   │
│   → Threshold: 50%+ similarity                              │
│   ↓                                                          │
│ Insert matches → Supabase Realtime → Frontend auto-updates  │
└─────────────────────────────────────────────────────────────┘
```

### Current Matching Algorithm

**Simple cosine similarity only:**
```typescript
similarity = 1 - cosine_distance(embedding_a, embedding_b)
match_percentage = similarity * 100
```

**Limitations:**
- Only considers facial embeddings
- No facial attribute analysis
- No multi-factor weighting
- No quality assessment

---

## MVP Implementation Plan (Phase 1)

### Goal
Extend the matching algorithm from **1-factor** (embeddings only) to **6-factor** (embeddings + 5 additional attributes) using open-source models.

### MVP Features

| # | Feature | Complexity | Weight | Implementation |
|---|---------|------------|--------|----------------|
| 1 | **Facial Embeddings** | Already exists | 20% | InsightFace (current) |
| 2 | **Facial Geometry Ratios** | Easy | 20% | InsightFace landmarks |
| 3 | **Age Compatibility** | Easy | 15% | InsightFace age detector |
| 4 | **Symmetry Score** | Medium | 15% | OpenCV + landmarks |
| 5 | **Skin Tone Similarity** | Easy | 15% | K-means + CIELAB |
| 6 | **Expression Match** | Medium | 15% | DeepFace/FER emotion |
| - | **Face Quality Gate** | Medium | Filter | OpenCV blur + lighting |

### Composite Scoring Formula (Updated)

```
Raw Score =
  0.20 × Embedding Similarity +
  0.20 × Geometry Ratio Similarity +
  0.15 × Age Compatibility +
  0.15 × Symmetry Score +
  0.15 × Skin Tone Similarity +
  0.15 × Expression Match

Quality Gate: Reject if face_quality < 0.6

Final Score = Raw Score × 100  (converts to 0-100%)
```

**Key Changes:**
- ❌ Removed gender confidence (already filtered)
- ⬇️ Embedding weight: 40% → 20%
- ⬆️ Geometry weight: 15% → 20%
- ⬆️ Age weight: 10% → 15%
- ⬆️ Symmetry weight: 10% → 15%
- ⬆️ Skin tone weight: 10% → 15%
- ⬆️ Expression weight: 10% → 15%

---

## Technical Implementation

### 1. Python AI Service Enhancement

**Location:** `../ai-service/app.py`

#### New Endpoint: `/analyze-face-advanced`

**Input:** Image file (multipart/form-data or base64)

**Output:**
```json
{
  "face_detected": true,
  "embedding": [0.123, -0.456, ...],  // 512D float array
  "bbox": [x1, y1, x2, y2],
  "confidence": 0.98,

  // Demographics
  "age": 25,
  "gender": "male",

  // Landmarks and pose
  "landmarks_68": [[x, y], ...],
  "pose": {
    "yaw": 5.2,
    "pitch": -2.1,
    "roll": 0.8
  },

  // Quality metrics
  "quality": {
    "blur_score": 0.85,
    "illumination": 0.75,
    "overall": 0.80
  },

  // Aesthetic features
  "symmetry_score": 0.88,
  "skin_tone": {
    "dominant_color_lab": [65, 10, 20],
    "hex": "#d4a373"
  },
  "expression": {
    "dominant": "smile",
    "confidence": 0.92,
    "emotions": {
      "happy": 0.85,
      "neutral": 0.10,
      "surprise": 0.05
    }
  },

  // Geometry ratios
  "geometry": {
    "face_width_height_ratio": 0.75,
    "eye_spacing_face_width": 0.42,
    "jawline_width_face_width": 0.68,
    "nose_width_face_width": 0.25
  }
}
```

#### Python Dependencies

```txt
# requirements.txt additions
insightface==0.7.3         # Already have
opencv-python==4.8.1.78    # Already have
deepface==0.0.79           # NEW - emotion detection
scikit-learn==1.3.2        # NEW - K-means for skin tone
scipy==1.11.4              # NEW - statistical calculations
numpy==1.24.3              # Already have
Pillow==10.1.0             # Already have
```

#### Implementation Functions

```python
def extract_landmarks_68(face):
    """Extract 68-point facial landmarks from InsightFace"""
    return face.landmark_2d_106[:68].tolist()

def calculate_symmetry_score(landmarks):
    """Compare left vs right facial features (0.0-1.0)"""
    left_half = np.array(landmarks[:34])
    right_half = np.array(landmarks[34:68])
    # Mirror right half and compute distance
    mirrored_right = np.flip(right_half, axis=0)
    distance = np.mean(np.abs(left_half - mirrored_right))
    symmetry = 1.0 - min(distance / 100, 1.0)
    return float(symmetry)

def extract_skin_tone(image, bbox):
    """Extract dominant skin color using K-means in CIELAB"""
    x1, y1, x2, y2 = map(int, bbox)
    face_region = image[y1:y2, x1:x2]
    lab_image = cv2.cvtColor(face_region, cv2.COLOR_BGR2LAB)
    pixels = lab_image.reshape(-1, 3)
    kmeans = KMeans(n_clusters=3, random_state=0, n_init=10).fit(pixels)
    dominant = kmeans.cluster_centers_[0]
    return dominant.tolist()

def calculate_blur_score(image, bbox):
    """Detect image blur using Laplacian variance (0.0-1.0)"""
    x1, y1, x2, y2 = map(int, bbox)
    face_region = image[y1:y2, x1:x2]
    gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    blur_score = min(variance / 500, 1.0)
    return float(blur_score)

def calculate_illumination(image, bbox):
    """Check lighting quality using histogram (0.0-1.0)"""
    x1, y1, x2, y2 = map(int, bbox)
    face_region = image[y1:y2, x1:x2]
    gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    std_brightness = np.std(gray)
    # Ideal: mean ~130, std > 30
    illumination = min(std_brightness / 50, 1.0) * (1.0 - abs(mean_brightness - 130) / 130)
    return float(max(illumination, 0.0))

def detect_emotion(image, bbox):
    """Detect facial expression using DeepFace"""
    from deepface import DeepFace
    x1, y1, x2, y2 = map(int, bbox)
    face_region = image[y1:y2, x1:x2]
    result = DeepFace.analyze(face_region, actions=['emotion'], enforce_detection=False, silent=True)
    emotions = result[0]['emotion']
    dominant = max(emotions, key=emotions.get)
    return dominant, emotions

def calculate_geometry_ratios(landmarks):
    """Calculate facial proportions from 68-point landmarks"""
    landmarks = np.array(landmarks)
    # Face dimensions
    face_width = np.linalg.norm(landmarks[16] - landmarks[0])
    face_height = np.linalg.norm(landmarks[8] - landmarks[27])
    eye_spacing = np.linalg.norm(landmarks[45] - landmarks[36])
    jawline_width = np.linalg.norm(landmarks[14] - landmarks[2])
    nose_width = np.linalg.norm(landmarks[35] - landmarks[31])

    return {
        "face_width_height_ratio": float(face_width / face_height),
        "eye_spacing_face_width": float(eye_spacing / face_width),
        "jawline_width_face_width": float(jawline_width / face_width),
        "nose_width_face_width": float(nose_width / face_width)
    }
```

---

### 2. Database Schema Updates

**Migration:** `supabase/migrations/018_advanced_face_attributes.sql`

```sql
-- Add new columns to faces table
ALTER TABLE faces
ADD COLUMN age INT,
ADD COLUMN gender TEXT,
ADD COLUMN landmarks_68 JSONB,
ADD COLUMN pose JSONB,
ADD COLUMN quality_score FLOAT,
ADD COLUMN blur_score FLOAT,
ADD COLUMN illumination_score FLOAT,
ADD COLUMN symmetry_score FLOAT,
ADD COLUMN skin_tone_lab FLOAT[],
ADD COLUMN expression TEXT,
ADD COLUMN expression_confidence FLOAT,
ADD COLUMN emotion_scores JSONB,
ADD COLUMN geometry_ratios JSONB,
ADD COLUMN analyzed_at TIMESTAMPTZ;

-- Add indexes
CREATE INDEX idx_faces_quality ON faces(quality_score) WHERE quality_score IS NOT NULL;
CREATE INDEX idx_faces_age ON faces(age) WHERE age IS NOT NULL;
CREATE INDEX idx_faces_expression ON faces(expression) WHERE expression IS NOT NULL;
CREATE INDEX idx_faces_attributes ON faces(age, gender, quality_score, expression);

-- Add comments
COMMENT ON COLUMN faces.age IS 'Estimated age from InsightFace';
COMMENT ON COLUMN faces.gender IS 'Detected gender: male/female';
COMMENT ON COLUMN faces.quality_score IS 'Overall face quality: 0.0-1.0';
COMMENT ON COLUMN faces.symmetry_score IS 'Facial symmetry: 0.0-1.0';
COMMENT ON COLUMN faces.skin_tone_lab IS 'Dominant skin color in CIELAB: [L, a, b]';
COMMENT ON COLUMN faces.expression IS 'Dominant expression: happy, neutral, sad, etc.';
COMMENT ON COLUMN faces.geometry_ratios IS 'Facial proportion ratios as JSON';
```

---

### 3. TypeScript AI Client Update

**File:** `src/lib/services/ai-service.ts`

```typescript
export interface AdvancedFaceAnalysis {
  face_detected: boolean;
  embedding: number[];
  bbox: number[];
  confidence: number;
  age: number;
  gender: 'male' | 'female';
  landmarks_68: [number, number][];
  pose: { yaw: number; pitch: number; roll: number };
  quality: { blur_score: number; illumination: number; overall: number };
  symmetry_score: number;
  skin_tone: { dominant_color_lab: [number, number, number]; hex: string };
  expression: { dominant: string; confidence: number; emotions: Record<string, number> };
  geometry: {
    face_width_height_ratio: number;
    eye_spacing_face_width: number;
    jawline_width_face_width: number;
    nose_width_face_width: number;
  };
}

export async function analyzeAdvancedFace(
  imageBuffer: Buffer
): Promise<AdvancedFaceAnalysis> {
  const formData = new FormData();
  const blob = new Blob([imageBuffer]);
  formData.append('file', blob, 'face.jpg');

  const response = await fetch(
    `${process.env.PYTHON_AI_SERVICE_URL}/analyze-face-advanced`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PYTHON_AI_SERVICE_API_KEY}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`AI service error: ${response.statusText}`);
  }

  return await response.json();
}
```

---

### 4. Advanced Matching Algorithm

**Migration:** `supabase/migrations/019_advanced_matching_function.sql`

```sql
-- Function to calculate advanced similarity score
CREATE OR REPLACE FUNCTION calculate_advanced_similarity(
    query_embedding vector(512),
    query_age int,
    query_symmetry float,
    query_skin_tone float[],
    query_expression text,
    query_geometry jsonb,
    target_embedding vector(512),
    target_age int,
    target_symmetry float,
    target_skin_tone float[],
    target_expression text,
    target_geometry jsonb
) RETURNS float AS $$
DECLARE
    embedding_sim float;
    geometry_sim float;
    age_compat float;
    symmetry_avg float;
    skin_tone_sim float;
    expression_match float;
    final_score float;
BEGIN
    -- 1. Embedding similarity (20% weight)
    embedding_sim := 1 - (query_embedding <=> target_embedding);

    -- 2. Geometry ratio similarity (20% weight)
    geometry_sim := 1.0 - LEAST(
        sqrt(
            power((query_geometry->>'face_width_height_ratio')::float -
                  (target_geometry->>'face_width_height_ratio')::float, 2) +
            power((query_geometry->>'eye_spacing_face_width')::float -
                  (target_geometry->>'eye_spacing_face_width')::float, 2) +
            power((query_geometry->>'jawline_width_face_width')::float -
                  (target_geometry->>'jawline_width_face_width')::float, 2) +
            power((query_geometry->>'nose_width_face_width')::float -
                  (target_geometry->>'nose_width_face_width')::float, 2)
        ) / 1.0,
        1.0
    );

    -- 3. Age compatibility (15% weight)
    age_compat := CASE
        WHEN abs(query_age - target_age) <= 2 THEN 1.0
        WHEN abs(query_age - target_age) <= 5 THEN 0.9
        WHEN abs(query_age - target_age) <= 10 THEN 0.7
        ELSE 0.5
    END;

    -- 4. Symmetry average (15% weight)
    symmetry_avg := (query_symmetry + target_symmetry) / 2.0;

    -- 5. Skin tone similarity (15% weight) - CIELAB distance
    skin_tone_sim := 1.0 - LEAST(
        sqrt(
            power(query_skin_tone[1] - target_skin_tone[1], 2) +
            power(query_skin_tone[2] - target_skin_tone[2], 2) +
            power(query_skin_tone[3] - target_skin_tone[3], 2)
        ) / 100.0,
        1.0
    );

    -- 6. Expression match (15% weight)
    expression_match := CASE
        WHEN query_expression = target_expression THEN 1.0
        WHEN query_expression IN ('happy', 'smile') AND target_expression IN ('happy', 'smile') THEN 0.9
        ELSE 0.6
    END;

    -- 7. Composite weighted score (updated weights)
    final_score :=
        0.20 * embedding_sim +
        0.20 * geometry_sim +
        0.15 * age_compat +
        0.15 * symmetry_avg +
        0.15 * skin_tone_sim +
        0.15 * expression_match;

    RETURN final_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Enhanced find_similar_faces function
CREATE OR REPLACE FUNCTION find_similar_faces_advanced(
    query_face_id uuid,
    user_school text,
    user_gender text,
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 20
) RETURNS TABLE (
    face_id uuid,
    profile_id uuid,
    similarity float,
    image_path text,
    name text,
    age int,
    expression text
) AS $$
BEGIN
    RETURN QUERY
    WITH query_face AS (
        SELECT
            f.embedding,
            f.age,
            f.symmetry_score,
            f.skin_tone_lab,
            f.expression,
            f.geometry_ratios
        FROM faces f
        WHERE f.id = query_face_id
    )
    SELECT
        f.id as face_id,
        p.id as profile_id,
        calculate_advanced_similarity(
            qf.embedding, qf.age, qf.symmetry_score, qf.skin_tone_lab, qf.expression, qf.geometry_ratios,
            f.embedding, f.age, f.symmetry_score, f.skin_tone_lab, f.expression, f.geometry_ratios
        ) as similarity,
        f.image_path,
        p.name,
        f.age,
        f.expression
    FROM faces f
    CROSS JOIN query_face qf
    JOIN profiles p ON f.profile_id = p.id
    WHERE
        f.id != query_face_id
        AND f.embedding IS NOT NULL
        AND f.quality_score >= 0.6  -- Quality gate
        AND p.school = user_school
        AND p.gender != user_gender  -- Gender already filtered here
        AND p.profile_type = 'user'
    HAVING calculate_advanced_similarity(
        qf.embedding, qf.age, qf.symmetry_score, qf.skin_tone_lab, qf.expression, qf.geometry_ratios,
        f.embedding, f.age, f.symmetry_score, f.skin_tone_lab, f.expression, f.geometry_ratios
    ) >= match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

---

### 5. Update Face Upload API

**File:** `src/app/api/faces/route.ts`

```typescript
import { analyzeAdvancedFace } from '@/lib/services/ai-service';

export async function POST(req: NextRequest) {
  // ... existing auth and upload logic ...

  // Use advanced analysis
  const analysis = await analyzeAdvancedFace(buffer);

  if (!analysis.face_detected) {
    return NextResponse.json(
      { error: 'No face detected in the image' },
      { status: 400 }
    );
  }

  // Quality checks
  if (analysis.quality.overall < 0.6) {
    return NextResponse.json(
      {
        error: 'Image quality too low',
        details: {
          blur: analysis.quality.blur_score < 0.5 ? 'Image is too blurry' : null,
          lighting: analysis.quality.illumination < 0.5 ? 'Poor lighting' : null
        }
      },
      { status: 400 }
    );
  }

  // Save face with all attributes
  const { data: face, error: faceError } = await supabase
    .from('faces')
    .insert({
      profile_id: profile.id,
      image_path: fileName,
      image_hash: imageHash,
      embedding: analysis.embedding,
      age: analysis.age,
      gender: analysis.gender,
      landmarks_68: analysis.landmarks_68,
      pose: analysis.pose,
      quality_score: analysis.quality.overall,
      blur_score: analysis.quality.blur_score,
      illumination_score: analysis.quality.illumination,
      symmetry_score: analysis.symmetry_score,
      skin_tone_lab: analysis.skin_tone.dominant_color_lab,
      expression: analysis.expression.dominant,
      expression_confidence: analysis.expression.confidence,
      emotion_scores: analysis.expression.emotions,
      geometry_ratios: analysis.geometry,
      analyzed_at: new Date().toISOString()
    })
    .select()
    .single();

  // ... rest of logic (create job, return response) ...
}
```

---

### 6. Update Match Generator Edge Function

**File:** `supabase/functions/match-generator/index.ts`

```typescript
// Replace find_similar_faces_filtered with find_similar_faces_advanced
const { data: similarFaces, error: searchError } = await supabase
  .rpc('find_similar_faces_advanced', {
    query_face_id: job.face_id,
    user_school: profile.school,
    user_gender: profile.gender,
    match_threshold: 0.5,
    match_count: 20
  });
```

---

### 7. Update Match Percentage Utility

**File:** `src/lib/utils/match-percentage.ts`

```typescript
/**
 * Calculate match percentage from advanced composite score
 * Score is already weighted: 20% embeddings + 20% geometry +
 * 15% age + 15% symmetry + 15% skin + 15% expression
 */
export function calculateMatchPercentage(similarity: number): number {
  return Math.round(similarity * 100);
}

export function getMatchLevel(percentage: number): string {
  if (percentage >= 90) return 'Excellent Match';
  if (percentage >= 80) return 'Very Good Match';
  if (percentage >= 70) return 'Good Match';
  if (percentage >= 60) return 'Moderate Match';
  return 'Low Match';
}
```

---

## Implementation Steps

### Step 1: Python AI Service (3-4 days)
1. Set up development environment
2. Install dependencies (DeepFace, scikit-learn)
3. Implement helper functions
4. Create `/analyze-face-advanced` endpoint
5. Test with sample images
6. Deploy to production

### Step 2: Database Migration (1 day)
1. Create `018_advanced_face_attributes.sql`
2. Test locally
3. Deploy: `supabase db push`
4. Verify columns created

### Step 3: TypeScript Client (1 day)
1. Update `ai-service.ts`
2. Update face upload API
3. Test end-to-end
4. Verify attributes stored

### Step 4: Advanced Matching Algorithm (2 days)
1. Create `019_advanced_matching_function.sql`
2. Implement scoring functions
3. Test with real data
4. Deploy migration

### Step 5: Update Edge Function (1 day)
1. Update `match-generator/index.ts`
2. Test background jobs
3. Deploy function

### Step 6: Testing & Validation (2 days)
1. Upload diverse test images
2. Verify quality gate works
3. Check match scores
4. Compare old vs new results

### Step 7: Documentation (1 day)
1. Update this document
2. Add monitoring queries
3. Create troubleshooting guide

**Total: 10-12 days**

---

## Testing Checklist

### Quality Gate
- [ ] Blurry image rejected
- [ ] Dark image rejected
- [ ] Clear image accepted

### Attributes
- [ ] Age detected correctly
- [ ] Expression detected
- [ ] Symmetry score reasonable
- [ ] Skin tone extracted
- [ ] Geometry ratios calculated

### Matching
- [ ] Similar faces → High score (80%+)
- [ ] Dissimilar faces → Low score (<60%)
- [ ] Same age → Age bonus
- [ ] Large age gap → Age penalty
- [ ] Matching expressions → Expression bonus

### Performance
- [ ] Upload: <500ms
- [ ] Match generation: <15s
- [ ] No degradation with 100+ faces

### Integration
- [ ] End-to-end flow works
- [ ] Filters by school + gender
- [ ] Top 20 matches returned
- [ ] Realtime updates work

---

## Success Criteria

✅ **Technical:**
1. Python service extracts 6+ attributes
2. Database stores all attributes
3. Advanced algorithm deployed
4. Quality gate functional
5. Performance targets met

✅ **Business:**
1. Match quality more accurate
2. Fewer bad matches
3. Wider score distribution
4. Better image quality overall

---

## Related Documentation

- [Auto-Match Generation](./auto-match-generation.md)
- [Project Architecture](../.agent/system/project_architecture.md)
- [Database Schema](../.agent/system/database_schema.md)

---

## References

- **InsightFace:** https://github.com/deepinsight/insightface
- **DeepFace:** https://github.com/serengil/deepface
- **pgvector:** https://github.com/pgvector/pgvector
- **CIELAB Color Space:** https://en.wikipedia.org/wiki/CIELAB_color_space

---

## Changelog

- **2025-11-05:** Initial plan created
- **2025-11-05:** Updated weights (embedding 40%→20%, removed gender)
- **2025-11-05:** MVP scope finalized with 6-factor algorithm
