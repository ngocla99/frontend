import { type NextRequest, NextResponse } from "next/server";
import { verifyFace } from "@/lib/services/ai-service";

/**
 * POST /api/faces/verify
 * Verify if a face is detected in an uploaded image
 *
 * This is a lightweight endpoint that checks for face presence without extracting embeddings.
 * Used during photo upload to validate that the image contains a clear face.
 */
export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		// Validate file size (10MB max)
		const MAX_FILE_SIZE = 10 * 1024 * 1024;
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: "File too large", message: "File size must not exceed 10MB" },
				{ status: 400 },
			);
		}

		// Validate file type
		if (!file.type.startsWith("image/")) {
			return NextResponse.json(
				{ error: "File must be an image" },
				{ status: 400 },
			);
		}

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		// Verify face using AI service
		const result = await verifyFace(buffer);

		if (!result.face_detected) {
			return NextResponse.json(
				{
					face_detected: false,
					error: "No face detected in image",
					message:
						"No face detected in image. Please upload a photo with a clear face.",
				},
				{ status: 400 },
			);
		}

		return NextResponse.json({
			face_detected: true,
			confidence: result.confidence,
			bbox: result.bbox,
			message: "Face detected successfully",
		});
	} catch (error: any) {
		console.error("Face verification error:", error);

		// Handle specific error cases
		if (error.message?.includes("No face detected")) {
			return NextResponse.json(
				{
					face_detected: false,
					error: "No face detected in image",
					message:
						"No face detected in image. Please upload a photo with a clear face.",
				},
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{
				error: "Face verification failed",
				message: "Face verification failed. Please try again.",
			},
			{ status: 500 },
		);
	}
}
