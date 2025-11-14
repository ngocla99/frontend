# Replicate Migration Plan

## Overview
Migrate Python face analysis service from self-hosted Flask to Replicate using Cog, enabling pay-per-use pricing and eliminating infrastructure management while preserving all 15+ facial analysis features.

## Current Architecture
```
Next.js Frontend → Next.js API Routes → Flask AI Service (self-hosted)
                                              ↓
                                    InsightFace + DeepFace + OpenCV
                                              ↓
                                    15+ Facial Attributes Extracted
```

## Target Architecture
```
Next.js Frontend → Next.js API Routes → Replicate API
                                              ↓
                                    Custom Cog Model Container
                                              ↓
                                    InsightFace + DeepFace + OpenCV
                                              ↓
                                    15+ Facial Attributes Extracted
```

## Benefits
- **Cost Optimization**: Pay-per-use model (~$0.00022/prediction), no idle infrastructure costs
- **Zero Infrastructure Management**: No Docker containers, servers, or scaling concerns
- **Automatic GPU Scaling**: Replicate handles load balancing and resource allocation
- **High Availability**: Built-in redundancy and uptime monitoring

## Features Preserved
All current face analysis capabilities will be maintained:
1. Face detection with bounding boxes
2. 512D face embeddings (ArcFace)
3. Age estimation
4. Gender classification
5. 68-point facial landmarks
6. Head pose estimation (yaw, pitch, roll)
7. Blur detection & quality metrics
8. Illumination analysis
9. Overall quality score
10. Symmetry analysis
11. Skin tone extraction (K-means + CIELAB)
12. Expression/emotion detection (7 emotions)
13. Facial geometry ratios (4 ratios)
14. Confidence scores
15. Error handling & validation

## Implementation Phases

### Phase 1: Create Replicate Model Package
**Duration**: 2-3 hours

#### 1.1 Setup Project Structure
Create new directory structure:
```
ai-matching/
├── replicate-model/
│   ├── cog.yaml              # Cog configuration
│   ├── predict.py            # Main prediction logic
│   ├── requirements.txt      # Python dependencies (backup)
│   └── README.md            # Model documentation
```

#### 1.2 Create cog.yaml
Configuration file with all dependencies:
```yaml
build:
  gpu: true
  python_version: "3.11"
  python_packages:
    - "insightface==0.7.3"
    - "onnxruntime-gpu==1.23.2"
    - "deepface==0.0.95"
    - "tensorflow==2.15.0"
    - "tf-keras==2.15.0"
    - "opencv-python-headless==4.10.0.84"
    - "numpy==1.26.4"
    - "scikit-learn==1.7.2"
    - "scipy==1.16.3"
    - "protobuf==3.20.3"
predict: "predict.py:Predictor"
```

#### 1.3 Create predict.py
Migrate Flask logic to Cog Predictor class:
```python
from cog import BasePredictor, Input, Path
import cv2
import numpy as np
from insightface.app import FaceAnalysis
from deepface import DeepFace
from sklearn.cluster import KMeans

class Predictor(BasePredictor):
    def setup(self):
        """Load models into memory (called once on container start)"""
        # Load InsightFace
        self.face_app = FaceAnalysis(providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
        self.face_app.prepare(ctx_id=0, det_size=(640, 640))

    def predict(
        self,
        image: Path = Input(description="Input image file")
    ) -> dict:
        """Run face analysis and return comprehensive attributes"""
        # Implementation migrated from app.py
        pass
```

Key changes from Flask version:
- Remove Flask/CORS/auth code
- Use `Path` input type instead of multipart form data
- Return dict directly (Cog handles JSON serialization)
- Use GPU providers for faster inference

#### 1.4 Migrate Core Logic
Copy functions from `ai-service/app.py`:
- `detect_and_analyze_face()` → Main analysis pipeline
- `detect_emotion()` → DeepFace emotion detection
- `calculate_blur_score()` → OpenCV blur detection
- `calculate_illumination()` → Brightness/contrast analysis
- `calculate_symmetry()` → Face symmetry computation
- `extract_skin_tone()` → K-means skin tone extraction
- `calculate_facial_geometry()` → Geometry ratio calculations

### Phase 2: Local Development & Testing
**Duration**: 1-2 hours

#### 2.1 Install Cog
```bash
# Windows (WSL2 required)
wsl
sudo curl -o /usr/local/bin/cog -L https://github.com/replicate/cog/releases/latest/download/cog_$(uname -s)_$(uname -m)
sudo chmod +x /usr/local/bin/cog
```

#### 2.2 Build Container Locally
```bash
cd replicate-model
cog build
```

#### 2.3 Test Predictions
```bash
# Test with sample image
cog predict -i image=@../test-images/sample-face.jpg

# Expected output structure:
{
  "face_detected": true,
  "embedding": [512 floats],
  "bbox": [x1, y1, x2, y2],
  "confidence": 0.99,
  "age": 25,
  "gender": "male",
  "landmarks_68": [[x, y], ...],
  "pose": {"yaw": 5.2, "pitch": -2.1, "roll": 0.8},
  "quality": {"blur_score": 0.85, "illumination": 0.75, "overall": 0.80},
  "symmetry_score": 0.88,
  "skin_tone": {"dominant_color_lab": [65, 10, 20], "hex": "#d4a373"},
  "expression": {
    "dominant": "happy",
    "confidence": 0.85,
    "emotions": {"happy": 0.85, "neutral": 0.10, ...}
  },
  "geometry": {
    "face_width_height_ratio": 0.75,
    "eye_spacing_face_width": 0.42,
    "jawline_width_face_width": 0.68,
    "nose_width_face_width": 0.25
  }
}
```

#### 2.4 Validation Tests
- ✅ Test with valid face image
- ✅ Test with no face (should return `face_detected: false`)
- ✅ Test with multiple faces (should analyze first face)
- ✅ Test with invalid image format
- ✅ Compare output with Flask service (should match)

### Phase 3: Deploy to Replicate
**Duration**: 1 hour

#### 3.1 Create Model on Replicate
1. Visit https://replicate.com/create
2. Create new model: `<username>/face-analysis-advanced`
3. Set visibility (private recommended initially)

#### 3.2 Authenticate & Push
```bash
cog login
cog push r8.im/<username>/face-analysis-advanced
```

First push takes 10-20 minutes (uploads Docker layers + model weights).

#### 3.3 Test on Replicate
1. Visit model page on Replicate
2. Upload test image via web UI
3. Verify output matches local testing
4. Note the model version ID (e.g., `abc123def456...`)

### Phase 4: Update Next.js Integration
**Duration**: 2-3 hours

#### 4.1 Install Replicate SDK
```bash
cd web
npm install replicate
```

#### 4.2 Update Environment Configuration

**web/.env.example**
```env
# Add Replicate configuration
REPLICATE_API_TOKEN=r8_your_token_here
REPLICATE_MODEL_VERSION=your_model_version_id

# Remove old Python service vars (optional - keep for rollback)
# PYTHON_AI_SERVICE_URL=http://localhost:5000
# PYTHON_AI_SERVICE_API_KEY=your-api-key
```

**web/src/config/env.ts**
Add Zod validation for new env vars:
```typescript
const serverSchema = z.object({
  // ... existing vars
  REPLICATE_API_TOKEN: z.string().min(1),
  REPLICATE_MODEL_VERSION: z.string().min(1),
});
```

#### 4.3 Rewrite AI Service Client

**web/src/lib/services/ai-service.ts**
Complete rewrite to use Replicate:

```typescript
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function analyzeFaceAdvanced(imageFile: File) {
  try {
    // Convert File to base64 data URI for Replicate
    const buffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${imageFile.type};base64,${base64}`;

    // Run prediction
    const output = await replicate.run(
      process.env.REPLICATE_MODEL_VERSION!,
      {
        input: {
          image: dataUri
        }
      }
    ) as FaceAnalysisResult;

    return {
      success: true,
      data: output
    };
  } catch (error) {
    console.error('Replicate face analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

#### 4.4 Update API Routes
No changes required if using the updated `ai-service.ts` client, but verify:
- `web/src/app/api/faces/upload/route.ts`
- `web/src/app/api/faces/analyze/route.ts`

Ensure they use the new Replicate client properly.

#### 4.5 Update Type Definitions
Verify `web/src/types/face.ts` matches the output format from Replicate model.

### Phase 5: Testing & Validation
**Duration**: 2-3 hours

#### 5.1 Integration Testing
Test complete user flows:
1. **Face Upload**: Upload new photo → Verify analysis completes
2. **Match Generation**: Ensure background matching still works
3. **Celebrity Matching**: Test celebrity comparison feature
4. **Baby Generation**: Verify AI baby feature (uses FAL.AI, should be unaffected)

#### 5.2 Performance Testing
Compare metrics:
- **Cold Start Time**: First prediction after inactivity (~30-60s expected)
- **Warm Prediction Time**: Subsequent predictions (~1-3s expected)
- **Accuracy**: Compare face embeddings and attributes with Flask service
- **Error Rate**: Monitor for any new errors

#### 5.3 Cost Analysis
Monitor usage:
- Track predictions per day
- Calculate cost: `predictions × $0.00022`
- Compare with previous hosting costs

#### 5.4 Error Handling
Test edge cases:
- Network failures
- Invalid images
- Rate limit exceeded (600/min)
- Model downtime (rare but possible)

### Phase 6: Deployment & Monitoring
**Duration**: 1 hour

#### 6.1 Deploy to Production
1. Add Replicate env vars to production environment (Vercel, etc.)
2. Deploy Next.js app with updated code
3. Monitor logs for any errors
4. Keep Flask service running initially for rollback

#### 6.2 Monitoring Setup
Track key metrics:
- Prediction success rate
- Average response time
- Daily prediction count
- Total cost
- Error types and frequency

#### 6.3 Gradual Rollout (Optional)
Implement feature flag:
```typescript
const USE_REPLICATE = process.env.FEATURE_FLAG_REPLICATE === 'true';

if (USE_REPLICATE) {
  // Use Replicate
} else {
  // Use Flask service (fallback)
}
```

Start with 10% traffic → 50% → 100% over 1-2 weeks.

### Phase 7: Cleanup & Documentation
**Duration**: 1 hour

#### 7.1 Archive Flask Service
```bash
# Move to archive folder (don't delete immediately)
mkdir archive
mv ai-service archive/ai-service-flask-backup
```

#### 7.2 Update Documentation
Update README files:
- Remove Flask setup instructions
- Add Replicate setup instructions
- Update architecture diagrams
- Document cost structure

#### 7.3 Update Docker Compose
If using docker-compose.yml, remove Python service:
```yaml
# Remove this service:
# ai-service:
#   build: ./ai-service
#   ports:
#     - "5000:5000"
```

## File Changes Summary

### New Files
- `replicate-model/cog.yaml` - Cog configuration
- `replicate-model/predict.py` - Main prediction logic (600+ lines)
- `replicate-model/README.md` - Model documentation
- `web/.agent/tasks/replicate-migration.md` - This plan document

### Modified Files
- `web/package.json` - Add `replicate` dependency
- `web/.env.example` - Add Replicate env vars
- `web/src/config/env.ts` - Add Replicate env validation
- `web/src/lib/services/ai-service.ts` - Complete rewrite (~100 lines)

### Removed/Archived Files (Phase 7)
- `ai-service/` directory (entire Flask service)
- Remove from `docker-compose.yml` if exists

## Cost Analysis

### Current Costs (Self-Hosted Flask)
- Server/container hosting: $10-50/month
- Idle time: 24/7 regardless of usage
- Maintenance: Developer time for updates/scaling

### Replicate Costs
- Per prediction: ~$0.00022
- 1,000 predictions/day = $0.22/day = $6.60/month
- 10,000 predictions/day = $2.20/day = $66/month
- Only pay for actual usage
- Zero maintenance overhead

**Break-even point**: ~45,000-227,000 predictions/month depending on current hosting costs.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Cold starts (30-60s) | Poor UX for first user after idle | Keep model warm with periodic health checks |
| Rate limits (600/min) | Blocked requests during spikes | Contact Replicate for higher limits; implement queuing |
| Model downtime | Service unavailable | Keep Flask service archived for emergency rollback |
| Higher costs than expected | Budget overrun | Monitor usage daily; set up cost alerts |
| Different results vs Flask | User confusion | Thorough testing; version same model weights |

## Rollback Plan

If issues arise, rollback is straightforward:
1. Restore `ai-service/` directory from archive
2. Revert `web/src/lib/services/ai-service.ts` to Flask version
3. Restore old environment variables
4. Redeploy Next.js app
5. Restart Flask service

**Rollback time**: ~15-30 minutes

## Success Criteria

Migration is successful when:
- ✅ All 15+ facial attributes extracted correctly
- ✅ Response times < 3s for warm predictions
- ✅ Error rate < 1%
- ✅ Cost reduction vs self-hosted (for typical usage)
- ✅ Zero infrastructure management required
- ✅ Matching algorithm produces same results
- ✅ No user-facing bugs or regressions

## Timeline

**Total Estimated Time**: 10-15 hours

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Create Model Package | 2-3 hours | Critical |
| Phase 2: Local Testing | 1-2 hours | Critical |
| Phase 3: Deploy to Replicate | 1 hour | Critical |
| Phase 4: Update Next.js | 2-3 hours | Critical |
| Phase 5: Testing & Validation | 2-3 hours | Critical |
| Phase 6: Deployment & Monitoring | 1 hour | High |
| Phase 7: Cleanup & Docs | 1 hour | Medium |

## Next Steps

1. Review and approve this migration plan
2. Set up Replicate account (if not already)
3. Begin Phase 1: Create model package
4. Test thoroughly before production deployment
5. Monitor costs and performance post-migration

## References

- [Replicate Documentation](https://replicate.com/docs)
- [Cog Documentation](https://github.com/replicate/cog)
- [Current Flask Service](../../../ai-service/app.py)
- [InsightFace Documentation](https://insightface.ai/)
- [DeepFace Documentation](https://github.com/serengil/deepface)
