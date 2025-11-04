import { BlurImage } from "@/components/blur-image";
import { Separator } from "@/components/ui/separator";
import { OnlineIndicator } from "@/features/presence/components/online-indicator";
import { usePresenceStatus } from "@/features/presence/hooks/use-presence-status";
import { cn } from "@/lib/utils";
import type { MutualConnection } from "../types";

interface ConnectionItemProps {
	connection: MutualConnection;
	isSelected: boolean;
	onClick: () => void;
}

/**
 * Individual connection item in the chat list
 * Shows avatar, name, last message, and online status
 */
export function ConnectionItem({
	connection,
	isSelected,
	onClick,
}: ConnectionItemProps) {
	const { isOnline, statusText } = usePresenceStatus(
		connection.other_user.id,
		connection.other_user.last_seen,
	);

	return (
		<div>
			<button
				type="button"
				className={cn(
					"group hover:bg-accent hover:text-accent-foreground",
					"flex w-full rounded-md px-2 py-2 text-start text-sm",
					isSelected && "sm:bg-muted",
				)}
				onClick={onClick}
			>
				<div className="flex gap-3 w-full">
					{/* Avatar with online indicator */}
					<div className="relative flex-shrink-0">
						<BlurImage
							src={connection.other_user.profile_image || ""}
							alt={connection.other_user.name}
							width={40}
							height={40}
							className="rounded-full object-cover size-10"
						/>
						<div className="absolute top-8 right-1">
							<OnlineIndicator isOnline={isOnline} size="sm" />
						</div>
					</div>

					{/* User info and message preview */}
					<div className="flex-1 min-w-0">
						{/* Name and status */}
						<div className="flex items-baseline gap-2">
							<span className="font-medium truncate">
								{connection.other_user.name}
							</span>
						</div>

						{/* Online status text */}
						<div
							className={cn(
								"text-xs",
								isOnline ? "text-green-600" : "text-muted-foreground",
							)}
						>
							{statusText}
						</div>

						{/* Last message preview */}
						{connection.last_message && (
							<div className="text-muted-foreground group-hover:text-accent-foreground/90 text-sm line-clamp-1 text-ellipsis">
								{connection.last_message.is_mine && "You: "}
								{connection.last_message.content}
							</div>
						)}
					</div>
				</div>
			</button>
			<Separator className="my-1" />
		</div>
	);
}
