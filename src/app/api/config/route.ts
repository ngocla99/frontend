import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/middleware/error-handler";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/config - Get public configuration
 * Returns non-sensitive configuration that the client needs
 */
export async function GET() {
	try {
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
			return NextResponse.json({
				allowNonEduEmails: false,
			});
		}

		return NextResponse.json({
			allowNonEduEmails: setting?.value ?? false,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
