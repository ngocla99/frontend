import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	title?: string | React.ReactNode;
	description?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	showCloseButton?: boolean;
	classes?: {
		root?: string;
		container?: string;
		content?: string;
		drawer?: string;
		trigger?: string;
	};
}

interface ResponsiveDialogContentProps {
	children: React.ReactNode;
	className?: string;
}

export function ResponsiveDialog({
	open,
	onOpenChange,
	trigger,
	title,
	description,
	children,
	footer,
	classes,
	showCloseButton = true,
}: ResponsiveDialogProps) {
	const [internalOpen, setInternalOpen] = React.useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const isOpen = open !== undefined ? open : internalOpen;
	const setIsOpen = onOpenChange || setInternalOpen;

	if (isDesktop) {
		return (
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				{trigger && (
					<DialogTrigger asChild className={classes?.trigger}>
						{trigger}
					</DialogTrigger>
				)}
				<DialogContent
					className={cn("sm:max-w-6xl", classes?.container)}
					showCloseButton={showCloseButton}
				>
					{title && (
						<DialogHeader>
							<DialogTitle>{title}</DialogTitle>
							{description && (
								<DialogDescription>{description}</DialogDescription>
							)}
						</DialogHeader>
					)}
					<ResponsiveDialogContent className={cn("px-0", classes?.content)}>
						{children}
					</ResponsiveDialogContent>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Drawer open={isOpen} onOpenChange={setIsOpen}>
			{trigger && (
				<DrawerTrigger asChild className={classes?.trigger}>
					{trigger}
				</DrawerTrigger>
			)}
			<DrawerContent className={classes?.container}>
				<DrawerHeader className="text-left">
					<DrawerTitle>{title}</DrawerTitle>
					{description && <DrawerDescription>{description}</DrawerDescription>}
				</DrawerHeader>
				<ResponsiveDialogContent className={classes?.content}>
					{children}
				</ResponsiveDialogContent>
				{footer && <DrawerFooter className="pt-2">{footer}</DrawerFooter>}
			</DrawerContent>
		</Drawer>
	);
}

/**
 * Content wrapper for the responsive dialog that handles consistent styling
 * between dialog and drawer modes.
 */
function ResponsiveDialogContent({
	children,
	className,
}: ResponsiveDialogContentProps) {
	return <div className={cn("space-y-4", className)}>{children}</div>;
}
