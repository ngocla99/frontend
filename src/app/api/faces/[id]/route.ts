import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/faces/[id] - Delete face image
 *
 * Deletes both the database record and the stored image file.
 * Only the owner can delete their own faces.
 */
export async function DELETE(
	_request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const supabase = await createClient();
		const faceId = params.id;

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

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
		if (face.profile_id !== user.id) {
			return NextResponse.json(
				{ error: "You can only delete your own faces" },
				{ status: 403 },
			);
		}

		// Delete from storage
		const { error: storageError } = await supabase.storage
			.from("faces")
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
	} catch (error) {
		return handleApiError(error);
	}
}

/**
 * GET /api/faces/[id] - Get single face details
 *
 * Returns face details with signed URL.
 */
export async function GET(
	_request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const supabase = await createClient();
		const faceId = params.id;

		// Authenticate user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

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
			.from("faces")
			.createSignedUrl(face.image_path, 3600);

		return NextResponse.json({
			id: face.id,
			profile_id: face.profile_id,
			image_url: signedUrlData?.signedUrl,
			created_at: face.created_at,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
