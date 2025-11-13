import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { createClient } from "@/lib/supabase/server";
import {
	checkIPRateLimit,
	getRateLimitHeaders,
} from "@/lib/utils/ip-rate-limiting";

/**
 * GET /api/config - Get public configuration
 * Returns non-sensitive configuration that the client needs
 *
 * Rate Limiting: 20 requests per minute per IP (generous for config checks)
 * Caching: 5 minutes CDN cache (config rarely changes)
 */
export async function GET(request: NextRequest) {
	try {
		// Rate limiting: 20 requests per minute per IP (config endpoint is lightweight)
		const rateLimit = checkIPRateLimit(request, 20, 60);

		if (!rateLimit.allowed) {
			const rateLimitHeaders = getRateLimitHeaders(rateLimit);
			return NextResponse.json(
				{
					error: "Too many requests",
					message: "Rate limit exceeded. Please try again later.",
					resetAt: new Date(rateLimit.resetAt).toISOString(),
				},
				{
					status: 429,
					headers: rateLimitHeaders,
				},
			);
		}
		const supabase = await createClient();

		// Fetch allow_non_edu_emails setting from database
		const { data: setting, error } = await supabase
			.from("system_settings")
			.select("value")
			.eq("key", "allow_non_edu_emails")
			.single();

		if (error) {
			console.error("Error fetching allow_non_edu_emails setting:", error);
			// Fallback to false if setting not found
			const rateLimitHeaders = getRateLimitHeaders(rateLimit);
			return NextResponse.json(
				{
					allowNonEduEmails: false,
				},
				{
					headers: {
						...rateLimitHeaders,
						// Cache for 5 minutes (config rarely changes)
						"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
						"CDN-Cache-Control": "public, s-maxage=300",
					},
				},
			);
		}

		// Return with rate limit headers and aggressive caching
		const rateLimitHeaders = getRateLimitHeaders(rateLimit);

		return NextResponse.json(
			{
				allowNonEduEmails: setting?.value ?? false,
			},
			{
				headers: {
					...rateLimitHeaders,
					// Cache for 5 minutes on CDN, serve stale for 10 minutes while revalidating
					"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
					// Vercel-specific CDN caching
					"CDN-Cache-Control": "public, s-maxage=300",
					"Vercel-CDN-Cache-Control": "public, s-maxage=300",
				},
			},
		);
	} catch (error) {
		return handleApiError(error);
	}
}
