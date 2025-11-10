import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { STORAGE_BUCKETS } from "@/lib/constants/constant";
import { handleApiError } from "@/lib/middleware/error-handler";
import { createClient } from "@/lib/supabase/server";
import {
	batchSignUrls,
	getSignedUrl,
} from "@/lib/utils/deduplicate-signed-urls";
import { calculateMatchPercentage } from "@/lib/utils/match-percentage";

/**
 * GET /api/matches/top - Get all user-user matches (live feed)
 *
 * Returns ALL recent user-user matches sorted by creation date.
 * Used for the public live match feed on the homepage.
 * Only shows matches between users (not celebrity matches).
 *
 * Query params:
 *   - limit: Number of matches to return (default: 20, max: 100)
 *   - skip: Number of matches to skip for pagination (default: 0)
 */
export async function GET(request: NextRequest) {
	try {
		const supabase = await createClient();
		const { searchParams } = new URL(request.url);
		const limit = Math.min(
			parseInt(searchParams.get("limit") || "20", 10),
			100,
		);
		const skip = parseInt(searchParams.get("skip") || "0", 10);

		// Get current user session (optional - for personalized data)
		const {
			data: { user },
		} = await supabase.auth.getUser();
		const currentUserId = user?.id || null;

		// Get recent user-user matches with profile and face data
		// Filter for matches where both profiles are users (not celebrities)
		const { data: matches, error } = await supabase
			.from("matches")
			.select(`
				id,
				similarity_score,
				created_at,
				face_a:faces!matches_face_a_id_fkey (
				id,
				image_path,
				profile:profiles!faces_profile_id_fkey (
					id,
					name,
					profile_type,
					gender,
					school
				)
				),
				face_b:faces!matches_face_b_id_fkey (
					id,
					image_path,
					profile:profiles!faces_profile_id_fkey (
						id,
						name,
						profile_type,
						gender,
						school
					)
				)
			`)
			.not("face_a.profile_id", "is", null)
			.not("face_b.profile_id", "is", null)
			.eq("face_a.profile.profile_type", "user")
			.eq("face_b.profile.profile_type", "user")
			.order("created_at", { ascending: false })
			.range(skip, skip + limit - 1);

		if (error) {
			throw error;
		}

		// Filter out any matches where profile data is still null (extra safety)
		const validMatches = (matches || []).filter((match: any) => {
			const faceA = Array.isArray(match.face_a)
				? match.face_a[0]
				: match.face_a;
			const faceB = Array.isArray(match.face_b)
				? match.face_b[0]
				: match.face_b;
			const profileA = Array.isArray(faceA?.profile)
				? faceA.profile[0]
				: faceA?.profile;
			const profileB = Array.isArray(faceB?.profile)
				? faceB.profile[0]
				: faceB?.profile;
			return profileA && profileB;
		});

		// Get user's reactions for these matches (if authenticated)
		let userReactions: Record<string, string[]> = {};
		if (currentUserId) {
			const matchIds = validMatches.map((m: any) => m.id);

			const { data: reactions } = await supabase
				.from("reactions")
				.select("match_id, reaction_type")
				.in("match_id", matchIds)
				.eq("user_profile_id", currentUserId);

			// Group reactions by match_id
			userReactions =
				reactions?.reduce(
					(acc, r) => {
						if (!acc[r.match_id]) acc[r.match_id] = [];
						acc[r.match_id].push(r.reaction_type);
						return acc;
					},
					{} as Record<string, string[]>,
				) || {};
		}

		// OPTIMIZATION: Collect all unique image paths first
		const allImagePaths: string[] = [];

		for (const match of validMatches) {
			const faceA = Array.isArray(match.face_a)
				? match.face_a[0]
				: match.face_a;
			const faceB = Array.isArray(match.face_b)
				? match.face_b[0]
				: match.face_b;

			if (faceA?.image_path) allImagePaths.push(faceA.image_path);
			if (faceB?.image_path) allImagePaths.push(faceB.image_path);
		}

		// Batch sign all unique URLs at once
		const signedUrlMap = await batchSignUrls(
			supabase,
			STORAGE_BUCKETS.USER_IMAGES,
			allImagePaths,
			env.SUPABASE_SIGNED_URL_TTL,
		);

		// Generate match data using cached signed URLs
		const matchesWithUrls = validMatches.map((match: any) => {
			const faceA = Array.isArray(match.face_a)
				? match.face_a[0]
				: match.face_a;
			const faceB = Array.isArray(match.face_b)
				? match.face_b[0]
				: match.face_b;
			const profileA = Array.isArray(faceA.profile)
				? faceA.profile[0]
				: faceA.profile;
			const profileB = Array.isArray(faceB.profile)
				? faceB.profile[0]
				: faceB.profile;

			// Get signed URLs from cache
			const imageUrlA =
				getSignedUrl(signedUrlMap, faceA.image_path) ||
				supabase.storage
					.from(STORAGE_BUCKETS.USER_IMAGES)
					.getPublicUrl(faceA.image_path).data.publicUrl;
			const imageUrlB =
				getSignedUrl(signedUrlMap, faceB.image_path) ||
				supabase.storage
					.from(STORAGE_BUCKETS.USER_IMAGES)
					.getPublicUrl(faceB.image_path).data.publicUrl;

			return {
				id: match.id,
				similarity_score: match.similarity_score, // Distance value (for backward compatibility)
				similarity_percentage: calculateMatchPercentage(match.similarity_score), // Engaging exponential formula
				created_at: match.created_at,
				my_reaction: userReactions[match.id] || [], // Array of reaction types: ["like", "viewed"]
				users: {
					a: {
						id: profileA.id,
						name: profileA.name,
						profile_type: profileA.profile_type,
						gender: profileA.gender,
						school: profileA.school,
						face_id: faceA.id,
						image: imageUrlA,
					},
					b: {
						id: profileB.id,
						name: profileB.name,
						profile_type: profileB.profile_type,
						gender: profileB.gender,
						school: profileB.school,
						face_id: faceB.id,
						image: imageUrlB,
					},
				},
			};
		});

		return NextResponse.json({
			matches: matchesWithUrls,
			total: matchesWithUrls.length,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
