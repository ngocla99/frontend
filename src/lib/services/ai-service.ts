/**
 * AI Service Client - Replicate Integration
 *
 * This client communicates with Replicate for face recognition tasks.
 * Uses a custom Cog model deployed on Replicate for comprehensive face analysis.
 */

import Replicate from "replicate";
import { env } from "@/config/env";

/**
 * Advanced face analysis response with comprehensive attributes
 * Used for sophisticated multi-factor matching algorithm
 */
export interface AdvancedFaceAnalysis {
	face_detected: boolean;
	embedding: number[];
	bbox: number[];
	confidence: number;

	// Demographics
	age: number;
	gender: "male" | "female";

	// Landmarks and pose
	landmarks_68: [number, number][];
	pose: {
		yaw: number;
		pitch: number;
		roll: number;
	};

	// Quality metrics
	quality: {
		blur_score: number;
		illumination: number;
		overall: number;
	};

	// Aesthetic features
	symmetry_score: number;
	skin_tone: {
		dominant_color_lab: [number, number, number];
		hex: string;
	};
	expression: {
		dominant: string;
		confidence: number;
		emotions: Record<string, number>;
	};

	// Geometry ratios
	geometry: {
		face_width_height_ratio: number;
		eye_spacing_face_width: number;
		jawline_width_face_width: number;
		nose_width_face_width: number;
	};

	error?: string;
}

const MODEL_URL = "ngocla99/face-analysis";

// Initialize Replicate client
const replicate = new Replicate({
	auth: env.REPLICATE_API_TOKEN,
});

/**
 * Convert image buffer to base64 data URI
 *
 * @param imageBuffer - Image file buffer
 * @param mimeType - Image MIME type (default: image/jpeg)
 * @returns Base64 data URI
 */
function bufferToDataUri(imageBuffer: Buffer, mimeType = "image/jpeg"): string {
	const base64 = imageBuffer.toString("base64");
	return `data:${mimeType};base64,${base64}`;
}

/**
 * Extract comprehensive facial attributes for advanced matching
 *
 * Uses Replicate API to analyze faces with 15+ attributes:
 * - Face embeddings (512D ArcFace)
 * - Age, gender, expression
 * - Face quality (blur, illumination)
 * - Symmetry score
 * - Skin tone (CIELAB)
 * - Facial geometry ratios
 * - 68-point landmarks
 * - Head pose (yaw, pitch, roll)
 *
 * @param imageBuffer - Image file buffer (JPEG, PNG)
 * @returns Comprehensive facial analysis
 * @throws Error if no face detected or API fails
 *
 * @example
 * ```typescript
 * const imageBuffer = await file.arrayBuffer();
 * const analysis = await analyzeAdvancedFace(Buffer.from(imageBuffer));
 *
 * if (analysis.quality.overall < 0.6) {
 *   console.error("Image quality too low");
 * } else {
 *   console.log(`Age: ${analysis.age}, Expression: ${analysis.expression.dominant}`);
 * }
 * ```
 */
export async function analyzeAdvancedFace(
	imageBuffer: Buffer,
): Promise<AdvancedFaceAnalysis> {
	try {
		// Convert buffer to data URI for Replicate
		const dataUri = bufferToDataUri(imageBuffer);

		// Run prediction on Replicate
		const output = (await replicate.run(
			`${MODEL_URL}:${env.REPLICATE_MODEL_VERSION}`,
			{
				input: {
					image: dataUri,
				},
			},
		)) as AdvancedFaceAnalysis;

		// Validate response
		if (!output.face_detected) {
			throw new Error(output.error || "No face detected in image");
		}

		return output;
	} catch (error) {
		console.error("Replicate face analysis error:", error);

		// Re-throw with more context
		if (error instanceof Error) {
			throw new Error(`Face analysis failed: ${error.message}`);
		}

		throw new Error("Face analysis failed: Unknown error");
	}
}
