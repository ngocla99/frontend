/**
 * University Lookup Service
 *
 * Uses the University Domains List API to look up universities by email domain.
 * API: https://github.com/Hipo/university-domains-list
 * Endpoint: http://universities.hipolabs.com
 */

const API_BASE_URL = "http://universities.hipolabs.com";
interface UniversityData {
	name: string;
	alpha_two_code: string;
	country: string;
	domains: string[];
	web_pages: string[];
	"state-province"?: string | null;
}

/**
 * Extract the root domain from an email address
 * Handles subdomains like gsb.columbia.edu -> columbia.edu
 *
 * @param domain - Full domain from email
 * @returns Root domain (last two parts)
 *
 * @example
 * getRootDomain('gsb.columbia.edu') // Returns: 'columbia.edu'
 * getRootDomain('mit.edu') // Returns: 'mit.edu'
 */
function getRootDomain(domain: string): string {
	const parts = domain.split(".");
	// Return last two parts (e.g., columbia.edu)
	if (parts.length >= 2) {
		return parts.slice(-2).join(".");
	}
	return domain;
}

/**
 * Look up university name by email address
 *
 * @param email - User's email address
 * @returns University name if found, null otherwise
 *
 * @example
 * const school = await lookupUniversityByEmail('john@mit.edu')
 * // Returns: "Massachusetts Institute of Technology"
 *
 * const school = await lookupUniversityByEmail('dlandau06@gsb.columbia.edu')
 * // Returns: "Columbia University"
 */
export async function lookupUniversityByEmail(
	email: string,
): Promise<string | null> {
	try {
		// Extract domain from email
		const domain = email.split("@")[1]?.toLowerCase();
		if (!domain) {
			console.warn("Invalid email format:", email);
			return null;
		}

		// Try full domain first (e.g., gsb.columbia.edu)
		let response = await fetch(`${API_BASE_URL}/search?domain=${domain}`, {
			headers: {
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			console.error(
				"University API request failed:",
				response.status,
				response.statusText,
			);
			return null;
		}

		let universities: UniversityData[] = await response.json();

		// If no match with full domain and has subdomain, try root domain
		if (universities.length === 0 && domain.split(".").length > 2) {
			const rootDomain = getRootDomain(domain);
			response = await fetch(`${API_BASE_URL}/search?domain=${rootDomain}`, {
				headers: {
					Accept: "application/json",
				},
			});

			if (response.ok) {
				universities = await response.json();
			}
		}

		// Return the first matching university name
		if (universities.length > 0) {
			return universities[0].name;
		}

		return null;
	} catch (error) {
		console.error("University lookup failed:", error);
		return null;
	}
}
