"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/features/auth/api/get-me";
import { useSignOut } from "@/features/auth/api/sign-out";
import { cn } from "@/lib/utils";

export function ProfileDropdown({ className }: { className?: string }) {
	const user = useUser();

	const signOutMutation = useSignOut({
		mutationConfig: {
			onSuccess: () => {
				window.location.href = "/";
			},
		},
	});
	const handleLogout = () => {
		if (signOutMutation.isPending) return;
		signOutMutation.mutate(undefined);
	};

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className={cn("relative size-9 rounded-full", className)}
				>
					<Avatar className="size-9">
						<AvatarImage
							className="object-cover"
							src={user?.image || "/images/default-avatar.png"}
							alt={user?.name}
						/>
						<AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm leading-none font-medium">{user?.name}</p>
						<p className="text-muted-foreground text-xs leading-none">
							{user?.email}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<Link href="/profile">Profile</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link href="/chat">Messages</Link>
					</DropdownMenuItem>

					<DropdownMenuItem asChild disabled>
						<div>Settings</div>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
