/**
 * AI Service Client - Python Microservice Integration
 *
 * This client communicates with the Python AI microservice for face recognition tasks.
 * The microservice handles InsightFace model inference for embedding extraction.
 */

import { env } from "@/config/env";

interface VerifyFaceResponse {
	face_detected: boolean;
	confidence: number;
	bbox: number[];
	message: string;
	error?: string;
}

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

const AI_SERVICE_URL = env.PYTHON_AI_SERVICE_URL;
const AI_SERVICE_API_KEY = env.PYTHON_AI_SERVICE_API_KEY;

/**
 * Check if AI service is healthy and ready
 *
 * @returns True if service is healthy, false otherwise
 *
 * @example
 * ```typescript
 * const isHealthy = await checkAIServiceHealth();
 * if (!isHealthy) {
 *   console.error("AI service is down!");
 * }
 * ```
 */
export async function checkAIServiceHealth(): Promise<boolean> {
	try {
		const response = await fetch(`${AI_SERVICE_URL}/health`, {
			method: "GET",
		});

		if (!response.ok) {
			return false;
		}

		const data = await response.json();
		return data.status === "healthy";
	} catch (error) {
		console.error("AI service health check failed:", error);
		return false;
	}
}


/**
 * Verify if a face is detected in an image (lightweight, no embedding extraction)
 *
 * @param imageBuffer - Image file buffer (JPEG, PNG)
 * @returns Face detection result with confidence and bbox
 * @throws Error if API fails
 *
 * @example
 * ```typescript
 * const imageBuffer = await file.arrayBuffer();
 * const result = await verifyFace(Buffer.from(imageBuffer));
 * if (result.face_detected) {
 *   console.log(`Face detected with ${result.confidence} confidence`);
 * }
 * ```
 */
export async function verifyFace(
	imageBuffer: Buffer,
): Promise<VerifyFaceResponse> {
	const formData = new FormData();
	const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" });
	formData.append("file", blob, "face.jpg");

	const response = await fetch(`${AI_SERVICE_URL}/verify-face`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${AI_SERVICE_API_KEY}`,
		},
		body: formData,
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to verify face");
	}

	const data: VerifyFaceResponse = await response.json();
	return data;
}

/**
 * Verify face from base64-encoded image
 *
 * @param imageBase64 - Base64-encoded image data
 * @returns Face detection result
 * @throws Error if API fails
 *
 * @example
 * ```typescript
 * const base64 = imageBuffer.toString('base64');
 * const result = await verifyFaceFromBase64(base64);
 * ```
 */
export async function verifyFaceFromBase64(
	imageBase64: string,
): Promise<VerifyFaceResponse> {
	const response = await fetch(`${AI_SERVICE_URL}/verify-face`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${AI_SERVICE_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			image_base64: imageBase64,
		}),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to verify face");
	}

	const data: VerifyFaceResponse = await response.json();
	return data;
}

/**
 * Extract comprehensive facial attributes for advanced matching
 *
 * NEW: Advanced analysis endpoint that extracts 6+ facial attributes:
 * - Age, gender, expression
 * - Face quality (blur, illumination)
 * - Symmetry score
 * - Skin tone (CIELAB)
 * - Facial geometry ratios
 * - 68-point landmarks
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
	const formData = new FormData();
	const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" });
	formData.append("file", blob, "face.jpg");

	const response = await fetch(`${AI_SERVICE_URL}/analyze-face-advanced`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${AI_SERVICE_API_KEY}`,
		},
		body: formData,
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to analyze face");
	}

	const data: AdvancedFaceAnalysis = await response.json();

	if (!data.face_detected) {
		throw new Error("No face detected in image");
	}

	return data;
}

/**
 * Extract advanced face analysis from base64-encoded image
 *
 * @param imageBase64 - Base64-encoded image data
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
): Promise<AdvancedFaceAnalysis> {
	const response = await fetch(`${AI_SERVICE_URL}/analyze-face-advanced`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${AI_SERVICE_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			image_base64: imageBase64,
		}),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to analyze face");
	}

	const data: AdvancedFaceAnalysis = await response.json();

	if (!data.face_detected) {
		throw new Error("No face detected in image");
	}

	return data;
}
