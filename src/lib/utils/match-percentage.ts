/**
 * Convert similarity score to match percentage
 *
 * UPDATED (2025-11-01): Now accepts similarity score (-1 to 1) instead of distance
 * Both user matching and celebrity matching now return normalized similarity values
 *
 * Formula: similarity * 100
 *
 * Similarity to Percentage mapping:
 * - 1.0 → 100% (perfect match)
 * - 0.85 → 85% (very good match)
 * - 0.70 → 70% (good match)
 * - 0.50 → 50% (moderate match)
 * - 0.30 → 30% (weak match)
 * - 0.0 → 0% (no similarity)
 * - -0.50 → -50% (very dissimilar)
 * - -1.0 → -100% (opposite/completely different)
 *
 * Note: Negative values indicate faces that are very dissimilar
 *
 * @param similarity - Similarity score (-1 to 1) where 1 is perfect match, negative is dissimilar
 * @returns Match percentage (-100 to 100)
 */
export function calculateMatchPercentage(similarity: number): number {
	// No clamping - allow negative values to show dissimilarity
	return Math.round(similarity * 100);
}

/**
 * Legacy formula for distance-based matching (DEPRECATED)
 * DO NOT USE - kept for reference only
 * Old formula used exponential decay on raw distance values
 */
export function calculateMatchPercentageLegacy(distance: number): number {
	return Math.round(100 * Math.exp(-distance * 0.5));
}
