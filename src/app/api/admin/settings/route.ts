import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdminSession } from "@/lib/middleware/with-admin-session";

/**
 * Schema for matching weights
 * All weights must be between 0 and 1, and sum to 1.0 (within tolerance)
 */
const matchingWeightsSchema = z
	.object({
		embedding: z.number().min(0).max(1),
		geometry: z.number().min(0).max(1),
		age: z.number().min(0).max(1),
		symmetry: z.number().min(0).max(1),
		skin_tone: z.number().min(0).max(1),
		expression: z.number().min(0).max(1),
	})
	.refine(
		(weights) => {
			const sum =
				weights.embedding +
				weights.geometry +
				weights.age +
				weights.symmetry +
				weights.skin_tone +
				weights.expression;
			// Allow small floating point tolerance
			return Math.abs(sum - 1.0) < 0.001;
		},
		{
			message: "Weights must sum to 1.0",
		},
	);

/**
 * Schema for updating settings
 */
const updateSettingsSchema = z.object({
	matching_weights: matchingWeightsSchema.optional(),
	allow_non_edu_emails: z.boolean().optional(),
	match_threshold: z.number().min(0).max(1).optional(),
});

/**
 * GET /api/admin/settings
 * Fetch all system settings
 * Requires admin role
 */
export const GET = withAdminSession(async ({ supabase }) => {
	try {
		// Fetch all settings from database
		const { data: settings, error } = await supabase
			.from("system_settings")
			.select("*")
			.order("key");

		if (error) {
			console.error("Error fetching settings:", error);
			return NextResponse.json(
				{ error: "Failed to fetch settings" },
				{ status: 500 },
			);
		}

		// Transform array into key-value object for easier frontend consumption
		const settingsMap: Record<string, unknown> = {};
		for (const setting of settings || []) {
			settingsMap[setting.key] = setting.value;
		}

		return NextResponse.json({
			success: true,
			data: settingsMap,
		});
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
});

/**
 * PATCH /api/admin/settings
 * Update system settings
 * Requires admin role
 *
 * @body {
 *   matching_weights?: { embedding: number, geometry: number, ... },
 *   allow_non_edu_emails?: boolean,
 *   match_threshold?: number
 * }
 */
export const PATCH = withAdminSession(
	async ({ request, session, supabase }) => {
		try {
			const body = await request.json();

			// Validate request body
			const validation = updateSettingsSchema.safeParse(body);
			if (!validation.success) {
				return NextResponse.json(
					{
						error: "Validation failed",
						details: validation.error.issues,
					},
					{ status: 400 },
				);
			}

			const updates = validation.data;
			const updatedKeys: string[] = [];

			// Update each setting that was provided
			for (const [key, value] of Object.entries(updates)) {
				if (value === undefined) continue;

				const { error } = await supabase
					.from("system_settings")
					.update({
						value: value,
						updated_at: new Date().toISOString(),
						updated_by: session.user.id,
					})
					.eq("key", key);

				if (error) {
					console.error(`Error updating setting ${key}:`, error);
					return NextResponse.json(
						{ error: `Failed to update setting: ${key}` },
						{ status: 500 },
					);
				}

				updatedKeys.push(key);
			}

			// Fetch updated settings to return
			const { data: settings, error: fetchError } = await supabase
				.from("system_settings")
				.select("*")
				.in("key", updatedKeys);

			if (fetchError) {
				console.error("Error fetching updated settings:", fetchError);
				return NextResponse.json(
					{ error: "Settings updated but failed to fetch new values" },
					{ status: 500 },
				);
			}

			// Transform to key-value map
			const settingsMap: Record<string, unknown> = {};
			for (const setting of settings || []) {
				settingsMap[setting.key] = setting.value;
			}

			return NextResponse.json({
				success: true,
				message: `Updated ${updatedKeys.length} setting(s)`,
				data: settingsMap,
				updated_keys: updatedKeys,
			});
		} catch (error) {
			console.error("Unexpected error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 },
			);
		}
	},
);
