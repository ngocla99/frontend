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
		const output = (await replicate.run(env.REPLICATE_MODEL_VERSION, {
			input: {
				image: dataUri,
			},
		})) as AdvancedFaceAnalysis;

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

/**
 * Extract advanced face analysis from base64-encoded image
 *
 * @param imageBase64 - Base64-encoded image data (without data URI prefix)
 * @param mimeType - Image MIME type (default: image/jpeg)
 * @returns Comprehensive facial analysis
 * @throws Error if no face detected or API fails
 *
 * @example
 * ```typescript
 * const base64 = imageBuffer.toString('base64');
 * const analysis = await analyzeAdvancedFaceFromBase64(base64);
 * ```
 */
export async function analyzeAdvancedFaceFromBase64(
	imageBase64: string,
	mimeType = "image/jpeg",
): Promise<AdvancedFaceAnalysis> {
	try {
		// Add data URI prefix if not present
		const dataUri = imageBase64.startsWith("data:")
			? imageBase64
			: `data:${mimeType};base64,${imageBase64}`;

		// Run prediction on Replicate
		const output = (await replicate.run(env.REPLICATE_MODEL_VERSION, {
			input: {
				image: dataUri,
			},
		})) as AdvancedFaceAnalysis;

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

/**
 * Verify if a face is detected in an image (lightweight check)
 *
 * Note: With Replicate, this still runs the full analysis but only checks
 * for face detection. Consider using analyzeAdvancedFace directly to avoid
 * redundant API calls.
 *
 * @param imageBuffer - Image file buffer (JPEG, PNG)
 * @returns True if face detected, false otherwise
 *
 * @example
 * ```typescript
 * const imageBuffer = await file.arrayBuffer();
 * const hasFace = await verifyFace(Buffer.from(imageBuffer));
 * if (hasFace) {
 *   console.log("Face detected!");
 * }
 * ```
 */
export async function verifyFace(imageBuffer: Buffer): Promise<boolean> {
	try {
		const result = await analyzeAdvancedFace(imageBuffer);
		return result.face_detected;
	} catch (error) {
		console.error("Face verification error:", error);
		return false;
	}
}

/**
 * Verify face from base64-encoded image
 *
 * @param imageBase64 - Base64-encoded image data
 * @param mimeType - Image MIME type (default: image/jpeg)
 * @returns True if face detected, false otherwise
 *
 * @example
 * ```typescript
 * const base64 = imageBuffer.toString('base64');
 * const hasFace = await verifyFaceFromBase64(base64);
 * ```
 */
export async function verifyFaceFromBase64(
	imageBase64: string,
	mimeType = "image/jpeg",
): Promise<boolean> {
	try {
		const result = await analyzeAdvancedFaceFromBase64(imageBase64, mimeType);
		return result.face_detected;
	} catch (error) {
		console.error("Face verification error:", error);
		return false;
	}
}

/**
 * Check if Replicate service is accessible
 *
 * Note: Replicate doesn't have a health check endpoint, so this is a simplified
 * version that just checks if the API token is configured.
 *
 * @returns True if service is configured, false otherwise
 *
 * @example
 * ```typescript
 * const isHealthy = await checkAIServiceHealth();
 * if (!isHealthy) {
 *   console.error("Replicate is not configured!");
 * }
 * ```
 */
export async function checkAIServiceHealth(): Promise<boolean> {
	try {
		// Check if environment variables are configured
		if (!env.REPLICATE_API_TOKEN || !env.REPLICATE_MODEL_VERSION) {
			console.error("Replicate environment variables not configured");
			return false;
		}

		// Could optionally make a test prediction here, but that costs money
		// For now, just return true if env vars are set
		return true;
	} catch (error) {
		console.error("Replicate health check failed:", error);
		return false;
	}
}
