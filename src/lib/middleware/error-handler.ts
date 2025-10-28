import { NextResponse } from "next/server";

/**
 * Standard error handler for API routes
 * Logs error and returns appropriate JSON response
 */
export function handleApiError(error: unknown) {
	console.error("API Error:", error);

	if (error instanceof Error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
