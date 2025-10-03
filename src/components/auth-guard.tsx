import { useUser } from "@/stores/auth-store";
import { useRouter } from "@tanstack/react-router";
import React from "react";

interface AuthGuardProps {
  children: React.ReactElement;
  onValueChange?: boolean; // Enable auth guard for onValueChange events
  onClick?: boolean; // Enable auth guard for onClick events (default: true)
}

export function AuthGuard({
  children,
  onValueChange = false,
  onClick = true,
}: AuthGuardProps) {
  const user = useUser();
  const router = useRouter();

  const handleAuthRequired = () => {
    router.navigate({ to: "/auth/sign-in" });
    // confirm({
    // 	type: "warning",
    // 	title: "Authentication Required",
    // 	description: "You need to sign in to access this feature.",
    // 	confirmText: "Sign In",
    // 	cancelText: "Cancel",
    // 	onConfirm: () => {
    // 		initiateGoogleOAuth();
    // 	},
    // });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!user && onClick) {
      e.preventDefault();
      e.stopPropagation();
      handleAuthRequired();
    }
  };

  const handleValueChange = (value: string) => {
    if (!user && onValueChange) {
      handleAuthRequired();
      return; // Don't call the original handler
    }
    // Call the original onValueChange if user is authenticated
    if (
      user &&
      children.props &&
      typeof (children.props as Record<string, unknown>)?.onValueChange ===
        "function"
    ) {
      (
        (children.props as Record<string, unknown>).onValueChange as (
          value: string
        ) => void
      )(value);
    }
  };

  // Clone the child element and inject the appropriate handlers
  const props: Record<string, unknown> = {};

  if (onClick) {
    props.onClick = (e: React.MouseEvent<HTMLElement>) => {
      handleClick(e);
      // Call the original onClick if user is authenticated
      if (
        user &&
        children.props &&
        typeof (children.props as Record<string, unknown>)?.onClick ===
          "function"
      ) {
        (
          (children.props as Record<string, unknown>).onClick as (
            e: React.MouseEvent<HTMLElement>
          ) => void
        )(e);
      }
    };
  }

  if (onValueChange) {
    props.onValueChange = handleValueChange;
  }

  return React.cloneElement(children, props);
}
