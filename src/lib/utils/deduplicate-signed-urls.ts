import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Batch sign unique image paths and map them back to original requests
 *
 * This utility deduplicates signed URL generation to improve performance
 * when multiple items reference the same image path.
 *
 * @example
 * const items = [
 *   { id: '1', imagePath: 'path/to/image1.jpg' },
 *   { id: '2', imagePath: 'path/to/image1.jpg' }, // duplicate
 *   { id: '3', imagePath: 'path/to/image2.jpg' }
 * ];
 *
 * const signedUrls = await batchSignUrls(
 *   supabase,
 *   'user-images',
 *   items.map(i => i.imagePath),
 *   3600
 * );
 * // Only 2 signed URLs generated instead of 3!
 */

/**
 * Batch generate signed URLs for unique image paths
 *
 * @param supabase - Supabase client
 * @param bucket - Storage bucket name
 * @param imagePaths - Array of image paths (may contain duplicates)
 * @param ttl - Time-to-live in seconds
 * @returns Map of image path to signed URL
 */
export async function batchSignUrls(
	supabase: SupabaseClient,
	bucket: string,
	imagePaths: (string | null | undefined)[],
	ttl: number,
): Promise<Map<string, string | null>> {
	// Filter out null/undefined and get unique paths
	const validPaths = imagePaths.filter(
		(path): path is string => path != null && path !== "",
	);
	const uniquePaths = [...new Set(validPaths)];

	// Sign all unique paths in parallel
	const signedUrlPromises = uniquePaths.map(async (path) => {
		const { data } = await supabase.storage
			.from(bucket)
			.createSignedUrl(path, ttl);
		return { path, signedUrl: data?.signedUrl || null };
	});

	const results = await Promise.all(signedUrlPromises);

	// Create map for O(1) lookup
	const urlMap = new Map<string, string | null>();
	for (const { path, signedUrl } of results) {
		urlMap.set(path, signedUrl);
	}

	return urlMap;
}

/**
 * Get signed URL from cache or generate if not exists
 *
 * @param urlMap - Map of image path to signed URL
 * @param imagePath - Image path to lookup
 * @returns Signed URL or null
 */
export function getSignedUrl(
	urlMap: Map<string, string | null>,
	imagePath: string | null | undefined,
): string | null {
	if (!imagePath) return null;
	return urlMap.get(imagePath) || null;
}
