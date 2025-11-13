/**
 * IP-Based Rate Limiting Utility
 *
 * Provides in-memory rate limiting for public API endpoints to prevent abuse.
 * Uses a sliding window algorithm with automatic cleanup of expired entries.
 *
 * For production at scale, consider:
 * - Vercel KV (Redis-based, distributed)
 * - Upstash Redis
 * - Vercel Edge Config
 */

import { type NextRequest } from "next/server";

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

/**
 * In-memory store for rate limit tracking
 * Key format: "ip:windowTimestamp"
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
	/** Whether the request is allowed */
	allowed: boolean;
	/** Number of remaining requests in current window */
	remaining: number;
	/** Timestamp when the rate limit resets (ms since epoch) */
	resetAt: number;
	/** Total limit for the window */
	limit: number;
}

/**
 * Extract client IP address from Next.js request
 *
 * Checks multiple headers in order of priority:
 * 1. request.ip (Vercel's native IP)
 * 2. x-forwarded-for (standard proxy header)
 * 3. x-real-ip (alternative proxy header)
 * 4. Fallback to 'unknown' for local development
 */
function getClientIP(request: NextRequest): string {
	return (
		request.ip ||
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		request.headers.get("x-real-ip") ||
		"unknown"
	);
}

/**
 * Check if a request is within rate limits
 *
 * Uses sliding window algorithm:
 * - Groups requests into time windows (e.g., 60 second windows)
 * - Tracks count per IP per window
 * - Automatically cleans up expired windows
 *
 * @param request - Next.js request object
 * @param maxRequests - Maximum requests allowed per window (default: 10)
 * @param windowSeconds - Time window in seconds (default: 60)
 * @returns Rate limit check result
 *
 * @example
 * ```typescript
 * const rateLimit = checkIPRateLimit(request, 10, 60);
 * if (!rateLimit.allowed) {
 *   return NextResponse.json(
 *     { error: 'Too many requests' },
 *     { status: 429 }
 *   );
 * }
 * ```
 */
export function checkIPRateLimit(
	request: NextRequest,
	maxRequests = 10,
	windowSeconds = 60,
): RateLimitResult {
	const ip = getClientIP(request);
	const now = Date.now();

	// Calculate current window timestamp
	// Example: If windowSeconds = 60, windows are: 0-59s, 60-119s, etc.
	const windowStart = Math.floor(now / (windowSeconds * 1000));
	const key = `${ip}:${windowStart}`;

	// Cleanup expired entries (older than 2 windows)
	// This prevents memory leaks in long-running processes
	const expirationThreshold = now - windowSeconds * 2000;
	for (const [storeKey, entry] of rateLimitStore.entries()) {
		if (entry.resetAt < expirationThreshold) {
			rateLimitStore.delete(storeKey);
		}
	}

	// Get or create entry for current IP + window
	let entry = rateLimitStore.get(key);

	if (!entry) {
		// First request in this window
		const resetAt = (windowStart + 1) * windowSeconds * 1000;
		entry = {
			count: 1,
			resetAt,
		};
		rateLimitStore.set(key, entry);

		return {
			allowed: true,
			remaining: maxRequests - 1,
			resetAt,
			limit: maxRequests,
		};
	}

	// Check if limit exceeded
	if (entry.count >= maxRequests) {
		return {
			allowed: false,
			remaining: 0,
			resetAt: entry.resetAt,
			limit: maxRequests,
		};
	}

	// Increment counter and allow request
	entry.count++;

	return {
		allowed: true,
		remaining: maxRequests - entry.count,
		resetAt: entry.resetAt,
		limit: maxRequests,
	};
}

/**
 * Get rate limit headers for response
 *
 * Returns standard rate limit headers:
 * - X-RateLimit-Limit: Total requests allowed
 * - X-RateLimit-Remaining: Requests remaining in window
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 * - Retry-After: Seconds until reset (only when blocked)
 *
 * @param result - Rate limit check result
 * @returns Headers object
 */
export function getRateLimitHeaders(
	result: RateLimitResult,
): Record<string, string> {
	const headers: Record<string, string> = {
		"X-RateLimit-Limit": String(result.limit),
		"X-RateLimit-Remaining": String(result.remaining),
		"X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)), // Unix timestamp
	};

	// Add Retry-After header when rate limited
	if (!result.allowed) {
		const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
		headers["Retry-After"] = String(Math.max(1, retryAfterSeconds));
	}

	return headers;
}

/**
 * Get current rate limit stats (for debugging/monitoring)
 *
 * @returns Current store statistics
 */
export function getRateLimitStats() {
	const now = Date.now();
	let activeEntries = 0;
	let totalRequests = 0;

	for (const [key, entry] of rateLimitStore.entries()) {
		if (entry.resetAt > now) {
			activeEntries++;
			totalRequests += entry.count;
		}
	}

	return {
		activeEntries,
		totalRequests,
		storeSize: rateLimitStore.size,
	};
}

/**
 * Clear all rate limit data (useful for testing)
 */
export function clearRateLimitStore() {
	rateLimitStore.clear();
}
