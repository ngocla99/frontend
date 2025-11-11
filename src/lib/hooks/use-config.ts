import { useQuery } from "@tanstack/react-query";

interface AppConfig {
	allowNonEduEmails: boolean;
}

/**
 * Fetch app configuration from server
 */
async function fetchConfig(): Promise<AppConfig> {
	const response = await fetch("/api/config");
	if (!response.ok) {
		throw new Error("Failed to fetch config");
	}
	return response.json();
}

/**
 * Hook to get app configuration
 * Returns whether non-.edu emails are allowed (allow_non_edu_emails from database)
 */
export function useConfig() {
	return useQuery({
		queryKey: ["config"],
		queryFn: fetchConfig,
		staleTime: 5 * 60 * 1000, // 5 minutes - config can change via admin panel
	});
}
