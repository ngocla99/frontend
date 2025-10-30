import { useEffect, useRef } from "react";

interface UseChatScrollOptions {
	/**
	 * Dependencies that trigger scroll behavior
	 */
	dependencies: unknown[];
	/**
	 * Whether to enable auto-scroll (default: true)
	 */
	enabled?: boolean;
	/**
	 * Smooth scroll behavior (default: true)
	 */
	smooth?: boolean;
}

/**
 * Hook for managing auto-scroll behavior in chat interfaces
 * Automatically scrolls to bottom when new messages arrive
 * Based on Supabase UI patterns
 */
export function useChatScroll<T extends HTMLElement = HTMLDivElement>(
	options: UseChatScrollOptions,
) {
	const { dependencies, enabled = true, smooth = true } = options;
	const scrollRef = useRef<T | null>(null);

	useEffect(() => {
		if (!enabled || !scrollRef.current) return;

		const scrollToBottom = () => {
			const element = scrollRef.current;
			if (!element) return;

			element.scrollTo({
				top: element.scrollHeight,
				behavior: smooth ? "smooth" : "auto",
			});
		};

		// Delay scroll to ensure DOM is updated
		const timeoutId = setTimeout(scrollToBottom, 100);

		return () => clearTimeout(timeoutId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, dependencies);

	return scrollRef;
}
