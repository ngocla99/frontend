import React from "react";
import { initiateGoogleOAuth } from "@/features/auth/api/google-oauth";
import { useUser } from "@/stores/auth-store";
import confirm from "./confirm";

interface AuthGuardProps {
	children: React.ReactElement;
}

export function AuthGuard({ children }: AuthGuardProps) {
	const user = useUser();

	const handleClick = (e: React.MouseEvent) => {
		if (!user) {
			e.preventDefault();
			e.stopPropagation();

			confirm({
				type: "warning",
				title: "Authentication Required",
				description: "You need to sign in to access this feature.",
				confirmText: "Sign In",
				cancelText: "Cancel",
				onConfirm: () => {
					initiateGoogleOAuth();
				},
			});
		}
	};

	// Clone the child element and inject the click handler
	return React.cloneElement(children, {
		onClick: (e: React.MouseEvent<HTMLElement>) => {
			handleClick(e);
			// Call the original onClick if it exists
			if (!user) return;
			if (
				children.props &&
				typeof (children.props as any)?.onClick === "function"
			) {
				(children.props as any).onClick(e);
			}
		},
	} as any);
}
