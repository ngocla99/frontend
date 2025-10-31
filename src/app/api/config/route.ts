import { NextResponse } from "next/server";
import { env } from "@/config/env";

/**
 * GET /api/config - Get public configuration
 * Returns non-sensitive configuration that the client needs
 */
export async function GET() {
	return NextResponse.json({
		allowNonEduEmails: env.DEV_ALLOW_NON_EDU_EMAILS,
	});
}
