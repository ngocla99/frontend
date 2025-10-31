/**
 * Transform cosine distance to engaging match percentage
 *
 * Uses exponential decay formula to convert raw distance values into
 * attractive percentages that keep students engaged with the app.
 *
 * Formula: 100 * exp(-distance * 0.5)
 *
 * Distance to Percentage mapping:
 * - 0.0 → 100% (perfect match)
 * - 0.5 → 78% (very good)
 * - 1.0 → 61% (good/decent)
 * - 1.5 → 47% (moderate)
 * - 2.0 → 37% (lower but still visible)
 *
 * Why exponential decay?
 * - More generous than linear (1 - distance) which gives negative values
 * - Creates engaging percentages in the 50-80% range for typical matches
 * - Psychologically appealing to users (feels like good matches)
 * - Still distinguishes between better and worse matches
 *
 * @param distance - Cosine distance value (0 = identical, 2 = opposite)
 * @returns Match percentage (0-100)
 */
export function calculateMatchPercentage(distance: number): number {
	return Math.round(100 * Math.exp(-distance * 0.5));
}

/**
 * Legacy formula: Simple linear transformation
 * Kept for reference but NOT recommended (produces negative values)
 */
export function calculateMatchPercentageLegacy(distance: number): number {
	return Math.round((1 - distance) * 100);
}
