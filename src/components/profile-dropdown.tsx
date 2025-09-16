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
import { useSignOut } from "@/features/auth/api/sign-out";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth-store";

export function ProfileDropdown({ className }: { className?: string }) {
	const { user } = useAuth();

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
						<AvatarImage src={user?.avatar} alt={user?.username} />
						<AvatarFallback>{user?.username?.charAt(0)}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm leading-none font-medium">{user?.username}</p>
						<p className="text-muted-foreground text-xs leading-none">
							{user?.email}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild disabled>
						<div>Profile</div>
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
