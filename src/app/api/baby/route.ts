import { NextResponse } from "next/server";
import { withSession } from "@/lib/middleware/with-session";
import { STORAGE_BUCKETS } from "@/lib/constants/constant";

// FAL.AI Configuration
const FAL_API_KEY = process.env.FAL_AI_API_KEY!;
const FAL_MODEL_ID = process.env.FAL_BABY_MODEL_ID || "fal-ai/nano-banana/edit";

/**
 * POST /api/baby - Generate baby image from match
 *
 * Request body:
 *   - match_id: UUID of the match
 *
 * Workflow:
 * 1. Authenticate user (via withSession)
 * 2. Get match details
 * 3. Get both face images
 * 4. Call FAL.AI to generate baby image
 * 5. Save baby record to database
 * 6. Return baby details
 */
export const POST = withSession(async ({ request, supabase }) => {
	const body = await request.json();
	const { match_id } = body;

	if (!match_id) {
		return NextResponse.json(
			{ error: "match_id is required" },
			{ status: 400 },
		);
	}

	// Get match details with face images
	const { data: match, error: matchError } = await supabase
		.from("matches")
		.select(`
        id,
        face_a_id,
        face_b_id,
        face_a:faces!matches_face_a_id_fkey (
          id,
          image_path,
          profile:profiles (
            id,
            name,
            gender
          )
        ),
        face_b:faces!matches_face_b_id_fkey (
          id,
          image_path,
          profile:profiles (
            id,
            name,
            gender
          )
        )
      `)
		.eq("id", match_id)
		.single();

	if (matchError || !match) {
		return NextResponse.json({ error: "Match not found" }, { status: 404 });
	}

	// Type assertion for Supabase response (relations can be arrays or objects)
	const matchData: any = match;
	const faceA = Array.isArray(matchData.face_a)
		? matchData.face_a[0]
		: matchData.face_a;
	const faceB = Array.isArray(matchData.face_b)
		? matchData.face_b[0]
		: matchData.face_b;

	// Get signed URLs for both faces (valid for 1 hour)
	const [urlA, urlB] = await Promise.all([
		supabase.storage
			.from(STORAGE_BUCKETS.USER_IMAGES)
			.createSignedUrl(faceA.image_path, 3600),
		supabase.storage
			.from(STORAGE_BUCKETS.USER_IMAGES)
			.createSignedUrl(faceB.image_path, 3600),
	]);

	if (!urlA.data?.signedUrl || !urlB.data?.signedUrl) {
		return NextResponse.json(
			{ error: "Failed to get face images" },
			{ status: 500 },
		);
	}

	// Generate baby image with FAL.AI
	const falResponse = await fetch(`https://fal.run/${FAL_MODEL_ID}`, {
		method: "POST",
		headers: {
			Authorization: `Key ${FAL_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			prompt: `A cute baby face that combines features from both parents. Natural lighting, high quality photo, adorable infant.`,
			image_url: urlA.data.signedUrl, // Use first parent's face as base
			num_images: 1,
			guidance_scale: 7.5,
			num_inference_steps: 50,
		}),
	});

	if (!falResponse.ok) {
		const error = await falResponse.text();
		console.error("FAL.AI error:", error);
		throw new Error("Failed to generate baby image");
	}

	const falData = await falResponse.json();
	const babyImageUrl = falData.images?.[0]?.url;

	if (!babyImageUrl) {
		throw new Error("No image URL returned from FAL.AI");
	}

	// Save baby record to database
	const profileA = Array.isArray(faceA.profile)
		? faceA.profile[0]
		: faceA.profile;
	const profileB = Array.isArray(faceB.profile)
		? faceB.profile[0]
		: faceB.profile;

	const { data: baby, error: babyError } = await supabase
		.from("babies")
		.insert({
			match_id: matchData.id,
			image_url: babyImageUrl,
			parent_a_id: profileA.id,
			parent_b_id: profileB.id,
		})
		.select()
		.single();

	if (babyError) {
		console.error("Database error:", babyError);
		throw new Error(`Failed to save baby record: ${babyError.message}`);
	}

	return NextResponse.json(
		{
			id: baby.id,
			match_id: baby.match_id,
			image_url: baby.image_url,
			created_at: baby.created_at,
			parents: {
				a: {
					id: profileA.id,
					name: profileA.name,
					gender: profileA.gender,
				},
				b: {
					id: profileB.id,
					name: profileB.name,
					gender: profileB.gender,
				},
			},
		},
		{ status: 201 },
	);
});

/**
 * GET /api/baby?match_id=xxx - Get baby for a match
 *
 * Returns the baby if one exists for the given match.
 */
export const GET = withSession(async ({ searchParams, supabase }) => {
	const match_id = searchParams.match_id;

	if (!match_id) {
		return NextResponse.json(
			{ error: "match_id query parameter is required" },
			{ status: 400 },
		);
	}

	// Get baby for this match (most recent if multiple)
	const { data: baby, error: babyError } = await supabase
		.from("babies")
		.select(`
        id,
        match_id,
        image_url,
        created_at,
        parent_a:profiles!babies_parent_a_id_fkey (
          id,
          name,
          gender
        ),
        parent_b:profiles!babies_parent_b_id_fkey (
          id,
          name,
          gender
        )
      `)
		.eq("match_id", match_id)
		.order("created_at", { ascending: false })
		.limit(1)
		.single();

	if (babyError) {
		if (babyError.code === "PGRST116") {
			// No baby found
			return NextResponse.json({ baby: null });
		}
		throw babyError;
	}

	return NextResponse.json({
		baby: {
			id: baby.id,
			match_id: baby.match_id,
			image_url: baby.image_url,
			created_at: baby.created_at,
			parents: {
				a: baby.parent_a,
				b: baby.parent_b,
			},
		},
	});
});
