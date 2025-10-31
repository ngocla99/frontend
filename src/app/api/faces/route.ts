import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { withSession } from "@/lib/middleware/with-session";
import { extractEmbedding } from "@/lib/services/ai-service";
import { STORAGE_BUCKETS } from "@/lib/constants/constant";
import { env } from "@/config/env";

/**
 * POST /api/faces - Upload face image with automatic match generation
 *
 * Workflow:
 * 1. Authenticate user (via withSession)
 * 2. Validate image file
 * 3. Extract face embedding via Python AI service
 * 4. Upload image to Supabase Storage
 * 5. Save face record with embedding to database
 * 6. Update user's profile default_face_id to the newly uploaded face
 * 7. Queue automatic matching job (NEW - background processing via pg_cron + Edge Function)
 * 8. Return face details with signed URL (202 Accepted - async processing)
 *
 * Auto-Matching Feature:
 * - After upload, a job is queued in match_jobs table
 * - pg_cron triggers Edge Function every minute to process pending jobs
 * - Edge Function searches for similar faces (same school, opposite gender, 50%+ similarity)
 * - Top 20 matches are saved to matches table
 * - Supabase Realtime broadcasts new matches to frontend
 * - Users see matches appear in live feed automatically (<10 seconds)
 */
export const POST = withSession(async ({ request, session, supabase }) => {
	const { profile } = session;

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
		.from(STORAGE_BUCKETS.USER_IMAGES)
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
		await supabase.storage.from(STORAGE_BUCKETS.USER_IMAGES).remove([fileName]);
		throw new Error(`Failed to save face record: ${dbError.message}`);
	}

	// Update profile's default_face_id to the newly uploaded face
	const { error: updateError } = await supabase
		.from("profiles")
		.update({ default_face_id: face.id })
		.eq("id", profile.id);

	if (updateError) {
		console.error("Failed to update default_face_id:", updateError);
		// Note: We don't throw here to avoid failing the upload
		// The face was created successfully, just the default wasn't set
	}

	// Queue automatic matching job (NEW - Auto-Match Generation Feature)
	// This triggers background job processing via pg_cron + Edge Function
	try {
		const { error: jobError } = await supabase.from("match_jobs").insert({
			face_id: face.id,
			user_id: profile.id,
			embedding: embedding,
			status: "pending",
		});

		if (jobError) {
			console.error("Failed to queue matching job:", jobError);
			// Don't fail the upload if job queueing fails
			// The face was uploaded successfully
		} else {
			console.log(`✓ Match job queued for face ${face.id}`);
		}
	} catch (jobError) {
		console.error("Exception while queueing match job:", jobError);
		// Continue - don't fail the upload
	}

	// Get signed URL for client
	const { data: signedUrlData } = await supabase.storage
		.from(STORAGE_BUCKETS.USER_IMAGES)
		.createSignedUrl(fileName, env.SUPABASE_SIGNED_URL_TTL);

	return NextResponse.json(
		{
			id: face.id,
			image_url: signedUrlData?.signedUrl,
			created_at: face.created_at,
			message: "Photo uploaded! Matches generating in background...",
		},
		{ status: 202 }, // Changed from 201 to 202 Accepted (async processing)
	);
});

/**
 * GET /api/faces - List user's faces
 *
 * Returns all faces belonging to the authenticated user
 * with signed URLs for image access.
 */
export const GET = withSession(async ({ session, supabase }) => {
	const { profile } = session;

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
				.from(STORAGE_BUCKETS.USER_IMAGES)
				.createSignedUrl(face.image_path, env.SUPABASE_SIGNED_URL_TTL);

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
});
