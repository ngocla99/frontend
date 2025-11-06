-- Migration: Add Advanced Face Attributes for Sophisticated Matching
-- Created: 2025-11-05
-- Description: Extends faces table with comprehensive facial attributes for multi-factor matching algorithm

-- Add new columns to faces table
ALTER TABLE faces
ADD COLUMN IF NOT EXISTS age INT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS landmarks_68 JSONB,
ADD COLUMN IF NOT EXISTS pose JSONB,
ADD COLUMN IF NOT EXISTS quality_score FLOAT,
ADD COLUMN IF NOT EXISTS blur_score FLOAT,
ADD COLUMN IF NOT EXISTS illumination_score FLOAT,
ADD COLUMN IF NOT EXISTS symmetry_score FLOAT,
ADD COLUMN IF NOT EXISTS skin_tone_lab FLOAT[],
ADD COLUMN IF NOT EXISTS expression TEXT,
ADD COLUMN IF NOT EXISTS expression_confidence FLOAT,
ADD COLUMN IF NOT EXISTS emotion_scores JSONB,
ADD COLUMN IF NOT EXISTS geometry_ratios JSONB,
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;

-- Add indexes for filtering and performance
CREATE INDEX IF NOT EXISTS idx_faces_quality ON faces(quality_score) WHERE quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_faces_age ON faces(age) WHERE age IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_faces_expression ON faces(expression) WHERE expression IS NOT NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_faces_attributes ON faces(age, gender, quality_score, expression)
WHERE age IS NOT NULL AND quality_score IS NOT NULL;

-- Add column comments for documentation
COMMENT ON COLUMN faces.age IS 'Estimated age from InsightFace (years)';
COMMENT ON COLUMN faces.gender IS 'Detected gender: male or female';
COMMENT ON COLUMN faces.landmarks_68 IS '68-point facial landmarks as JSON array [[x,y], ...]';
COMMENT ON COLUMN faces.pose IS 'Face pose angles: {yaw, pitch, roll} in degrees';
COMMENT ON COLUMN faces.quality_score IS 'Overall face quality: 0.0-1.0 (higher is better)';
COMMENT ON COLUMN faces.blur_score IS 'Image sharpness: 0.0-1.0 (higher is sharper)';
COMMENT ON COLUMN faces.illumination_score IS 'Lighting quality: 0.0-1.0 (higher is better lit)';
COMMENT ON COLUMN faces.symmetry_score IS 'Facial symmetry: 0.0-1.0 (1.0 = perfect symmetry)';
COMMENT ON COLUMN faces.skin_tone_lab IS 'Dominant skin color in CIELAB: [L, a, b]';
COMMENT ON COLUMN faces.expression IS 'Dominant expression: happy, neutral, sad, angry, surprise, fear, disgust';
COMMENT ON COLUMN faces.expression_confidence IS 'Confidence of expression detection: 0.0-1.0';
COMMENT ON COLUMN faces.emotion_scores IS 'All emotion probabilities as JSON: {happy: 0.85, neutral: 0.10, ...}';
COMMENT ON COLUMN faces.geometry_ratios IS 'Facial proportion ratios as JSON: {face_width_height_ratio, eye_spacing_face_width, ...}';
COMMENT ON COLUMN faces.analyzed_at IS 'Timestamp when advanced analysis was performed';
