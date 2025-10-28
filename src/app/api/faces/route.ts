import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { extractEmbedding } from "@/lib/services/ai-service";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/faces - Upload face image
 *
 * Workflow:
 * 1. Authenticate user
 * 2. Validate image file
 * 3. Extract face embedding via Python AI service
 * 4. Upload image to Supabase Storage
 * 5. Save face record with embedding to database
 * 6. Return face details with signed URL
 */
export async function POST(request: NextRequest) {
	try {
		const supabase = await createClient();

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get user profile
		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("id")
			.eq("id", user.id)
			.single();

		if (profileError || !profile) {
			return NextResponse.json({ error: "Profile not found" }, { status: 404 });
		}

		// Parse multipart form data
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		// Validate file type
		if (!file.type.startsWith("image/")) {
			return NextResponse.json(
				{ error: "Invalid file type. Please upload an image." },
				{ status: 400 },
			);
		}

		// Validate file size (max 10MB)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{ error: "File too large. Maximum size is 10MB." },
				{ status: 400 },
			);
		}

		// Read file buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Extract face embedding via Python AI microservice
		let embedding: number[];
		try {
			embedding = await extractEmbedding(buffer);
		} catch (error: any) {
			if (error.message.includes("No face detected")) {
				return NextResponse.json(
					{
						error:
							"No face detected in image. Please upload a clear photo with a visible face.",
					},
					{ status: 400 },
				);
			}
			throw error;
		}

		// Generate unique filename
		const imageHash = crypto.createHash("sha256").update(buffer).digest("hex");
		const extension = file.name.split(".").pop() || "jpg";
		const fileName = `${profile.id}/${Date.now()}-${imageHash.substring(0, 8)}.${extension}`;

		// Upload image to Supabase Storage
		const { data: uploadData, error: uploadError } = await supabase.storage
			.from("faces")
			.upload(fileName, buffer, {
				contentType: file.type,
				upsert: false,
			});

		if (uploadError) {
			console.error("Upload error:", uploadError);
			throw new Error(`Failed to upload image: ${uploadError.message}`);
		}

		// Create face record in database with embedding
		const { data: face, error: dbError } = await supabase
			.from("faces")
			.insert({
				profile_id: profile.id,
				image_path: fileName,
				embedding: embedding,
				image_hash: imageHash,
			})
			.select()
			.single();

		if (dbError) {
			console.error("Database error:", dbError);
			// Cleanup uploaded file if DB insert fails
			await supabase.storage.from("faces").remove([fileName]);
			throw new Error(`Failed to save face record: ${dbError.message}`);
		}

		// Get signed URL for client
		const { data: signedUrlData } = await supabase.storage
			.from("faces")
			.createSignedUrl(fileName, 3600); // 1 hour

		return NextResponse.json(
			{
				id: face.id,
				image_url: signedUrlData?.signedUrl,
				created_at: face.created_at,
				message: "Face uploaded successfully",
			},
			{ status: 201 },
		);
	} catch (error) {
		return handleApiError(error);
	}
}

/**
 * GET /api/faces - List user's faces
 *
 * Returns all faces belonging to the authenticated user
 * with signed URLs for image access.
 */
export async function GET(_request: NextRequest) {
	try {
		const supabase = await createClient();

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get user profile
		const { data: profile } = await supabase
			.from("profiles")
			.select("id")
			.eq("id", user.id)
			.single();

		if (!profile) {
			return NextResponse.json({ error: "Profile not found" }, { status: 404 });
		}

		// Get all faces for user
		const { data: faces, error: facesError } = await supabase
			.from("faces")
			.select("id, image_path, created_at")
			.eq("profile_id", profile.id)
			.order("created_at", { ascending: false });

		if (facesError) {
			throw facesError;
		}

		// Generate signed URLs for each face
		const facesWithUrls = await Promise.all(
			(faces || []).map(async (face) => {
				const { data } = await supabase.storage
					.from("faces")
					.createSignedUrl(face.image_path, 3600);

				return {
					id: face.id,
					image_url: data?.signedUrl,
					created_at: face.created_at,
				};
			}),
		);

		return NextResponse.json({
			faces: facesWithUrls,
			total: facesWithUrls.length,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
