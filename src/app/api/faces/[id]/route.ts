import { NextResponse } from "next/server";
import { withSession } from "@/lib/middleware/with-session";
import { STORAGE_BUCKETS } from "@/lib/constants/constant";

/**
 * DELETE /api/faces/[id] - Delete face image
 *
 * Deletes both the database record and the stored image file.
 * Only the owner can delete their own faces.
 */
export const DELETE = withSession(async ({ params, session, supabase }) => {
	const faceId = params.id;

	// Get face record to verify ownership and get image path
	const { data: face, error: faceError } = await supabase
		.from("faces")
		.select("id, profile_id, image_path")
		.eq("id", faceId)
		.single();

	if (faceError || !face) {
		return NextResponse.json({ error: "Face not found" }, { status: 404 });
	}

	// Verify ownership
	if (face.profile_id !== session.user.id) {
		return NextResponse.json(
			{ error: "You can only delete your own faces" },
			{ status: 403 },
		);
	}

	// Delete from storage
	const { error: storageError } = await supabase.storage
		.from(STORAGE_BUCKETS.USER_IMAGES)
		.remove([face.image_path]);

	if (storageError) {
		console.error("Storage deletion error:", storageError);
		// Continue anyway - database deletion is more important
	}

	// Delete from database
	const { error: deleteError } = await supabase
		.from("faces")
		.delete()
		.eq("id", faceId);

	if (deleteError) {
		throw new Error(`Failed to delete face: ${deleteError.message}`);
	}

	return NextResponse.json({
		message: "Face deleted successfully",
		id: faceId,
	});
});

/**
 * GET /api/faces/[id] - Get single face details
 *
 * Returns face details with signed URL.
 */
export const GET = withSession(async ({ params, supabase }) => {
	const faceId = params.id;

	// Get face record
	const { data: face, error: faceError } = await supabase
		.from("faces")
		.select("id, profile_id, image_path, created_at")
		.eq("id", faceId)
		.single();

	if (faceError || !face) {
		return NextResponse.json({ error: "Face not found" }, { status: 404 });
	}

	// Get signed URL
	const { data: signedUrlData } = await supabase.storage
		.from(STORAGE_BUCKETS.USER_IMAGES)
		.createSignedUrl(face.image_path, 3600);

	return NextResponse.json({
		id: face.id,
		profile_id: face.profile_id,
		image_url: signedUrlData?.signedUrl,
		created_at: face.created_at,
	});
});
