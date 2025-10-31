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
 * Returns whether non-.edu emails are allowed (DEV_ALLOW_NON_EDU_EMAILS)
 */
export function useConfig() {
	return useQuery({
		queryKey: ["config"],
		queryFn: fetchConfig,
		staleTime: Number.POSITIVE_INFINITY, // Config doesn't change during session
	});
}
