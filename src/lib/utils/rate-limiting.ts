/**
 * Rate Limiting Utilities
 *
 * Provides functions to check and enforce daily usage limits for baby generation
 * and photo uploads. Limits are configurable via system_settings table.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Quota types that can be rate-limited
 */
export type QuotaType = "baby_generations" | "photo_uploads";

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
	/** Whether the user is allowed to proceed */
	allowed: boolean;
	/** Current usage count for today */
	current: number;
	/** Maximum allowed for today (0 = disabled) */
	limit: number;
	/** When the quota resets (midnight UTC tomorrow) */
	resetAt: string;
}

/**
 * Error thrown when a rate limit is exceeded
 */
export class RateLimitError extends Error {
	constructor(
		public readonly quotaType: QuotaType,
		public readonly current: number,
		public readonly limit: number,
		public readonly resetAt: string,
	) {
		const typeLabel =
			quotaType === "baby_generations" ? "baby generations" : "photo uploads";
		super(
			`Daily limit reached for ${typeLabel}: ${current}/${limit}. Resets at ${resetAt}.`,
		);
		this.name = "RateLimitError";
	}

	/**
	 * Convert to JSON response format for API errors
	 */
	toJSON() {
		return {
			error: "Daily limit reached",
			message: this.message,
			type: this.quotaType,
			current: this.current,
			limit: this.limit,
			resetAt: this.resetAt,
		};
	}
}

/**
 * Check if a user has exceeded their daily limit for a specific quota type
 *
 * @param supabase - Supabase client (should be admin/service role for quota table access)
 * @param userId - User ID to check
 * @param quotaType - Type of quota to check ('baby_generations' or 'photo_uploads')
 * @returns Rate limit check result
 * @throws Error if database query fails
 *
 * @example
 * ```ts
 * const result = await checkDailyLimit(supabase, userId, 'baby_generations');
 * if (!result.allowed) {
 *   throw new RateLimitError('baby_generations', result.current, result.limit, result.resetAt);
 * }
 * ```
 */
export async function checkDailyLimit(
	supabase: SupabaseClient,
	userId: string,
	quotaType: QuotaType,
): Promise<RateLimitResult> {
	// Map quota type to system_settings key
	const settingKey =
		quotaType === "baby_generations"
			? "daily_baby_generation_limit"
			: "daily_photo_upload_limit";

	// Call the SQL function that checks the limit
	const { data, error } = await supabase.rpc("check_daily_limit", {
		p_user_id: userId,
		p_limit_type: quotaType,
		p_limit_key: settingKey,
	});

	if (error) {
		console.error("Error checking daily limit:", error);
		throw new Error(`Failed to check daily limit: ${error.message}`);
	}

	// The RPC returns an array with one row
	const result = Array.isArray(data) ? data[0] : data;

	if (!result) {
		throw new Error("Unexpected empty result from check_daily_limit");
	}

	return {
		allowed: result.allowed,
		current: result.current_count,
		limit: result.limit_value,
		resetAt: result.reset_at,
	};
}

/**
 * Increment the daily usage counter for a specific quota type
 *
 * This should be called AFTER a successful operation (e.g., after baby is generated,
 * after photo is uploaded). Uses atomic UPSERT to handle race conditions.
 *
 * @param supabase - Supabase client (should be admin/service role for quota table access)
 * @param userId - User ID to increment
 * @param quotaType - Type of quota to increment ('baby_generations' or 'photo_uploads')
 * @throws Error if database query fails
 *
 * @example
 * ```ts
 * // After successfully generating a baby
 * await incrementDailyUsage(supabase, userId, 'baby_generations');
 * ```
 */
export async function incrementDailyUsage(
	supabase: SupabaseClient,
	userId: string,
	quotaType: QuotaType,
): Promise<void> {
	const { error } = await supabase.rpc("increment_daily_usage", {
		p_user_id: userId,
		p_limit_type: quotaType,
	});

	if (error) {
		console.error("Error incrementing daily usage:", error);
		throw new Error(`Failed to increment daily usage: ${error.message}`);
	}
}

/**
 * Get current quota status for a user (for display purposes)
 *
 * @param supabase - Supabase client
 * @param userId - User ID to check
 * @returns Object with current usage for both quota types
 *
 * @example
 * ```ts
 * const status = await getQuotaStatus(supabase, userId);
 * console.log(`Babies: ${status.babyGenerations.current}/${status.babyGenerations.limit}`);
 * console.log(`Photos: ${status.photoUploads.current}/${status.photoUploads.limit}`);
 * ```
 */
export async function getQuotaStatus(
	supabase: SupabaseClient,
	userId: string,
): Promise<{
	babyGenerations: RateLimitResult;
	photoUploads: RateLimitResult;
}> {
	const [babyGenerations, photoUploads] = await Promise.all([
		checkDailyLimit(supabase, userId, "baby_generations"),
		checkDailyLimit(supabase, userId, "photo_uploads"),
	]);

	return {
		babyGenerations,
		photoUploads,
	};
}
