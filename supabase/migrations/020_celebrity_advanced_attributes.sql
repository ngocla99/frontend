-- Migration: Celebrity Advanced Attributes
-- Created: 2025-11-06
-- Description: Add advanced facial analysis attributes to celebrities table to enable sophisticated 6-factor matching

-- Add advanced facial analysis columns to celebrities table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_celebrities_quality ON celebrities(quality_score);
CREATE INDEX IF NOT EXISTS idx_celebrities_age ON celebrities(age);
CREATE INDEX IF NOT EXISTS idx_celebrities_expression ON celebrities(expression);
CREATE INDEX IF NOT EXISTS idx_celebrities_gender ON celebrities(gender);
CREATE INDEX IF NOT EXISTS idx_celebrities_attributes ON celebrities(age, gender, quality_score, expression);

-- Add comments for documentation
COMMENT ON COLUMN celebrities.age IS 'Estimated age from facial analysis (InsightFace)';
COMMENT ON COLUMN celebrities.symmetry_score IS 'Facial symmetry score 0.0-1.0 (higher = more symmetric)';
COMMENT ON COLUMN celebrities.skin_tone_lab IS 'Dominant skin color in CIELAB color space [L, a, b]';
COMMENT ON COLUMN celebrities.expression IS 'Dominant facial expression (neutral, happy, sad, angry, etc.)';
COMMENT ON COLUMN celebrities.geometry_ratios IS 'Facial geometry proportions (face_width_height_ratio, eye_spacing, etc.)';
COMMENT ON COLUMN celebrities.quality_score IS 'Overall image quality score 0.0-1.0 (blur + illumination composite)';
COMMENT ON COLUMN celebrities.blur_score IS 'Blur detection score 0.0-1.0 (Laplacian variance)';
COMMENT ON COLUMN celebrities.illumination_score IS 'Illumination quality score 0.0-1.0 (histogram analysis)';
COMMENT ON COLUMN celebrities.landmarks_68 IS '68-point facial landmarks for geometry analysis';
COMMENT ON COLUMN celebrities.pose IS 'Head pose estimation (yaw, pitch, roll in degrees)';
COMMENT ON COLUMN celebrities.emotion_scores IS 'Detailed emotion scores from DeepFace (happy, sad, angry, etc.)';
COMMENT ON COLUMN celebrities.expression_confidence IS 'Confidence score for dominant expression 0.0-1.0';
COMMENT ON COLUMN celebrities.analyzed_at IS 'Timestamp when advanced analysis was performed';
