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
	trigger: React.ReactNode;
	title: string;
	description?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	classes?: {
		root?: string;
		dialog?: string;
		drawer?: string;
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
}: ResponsiveDialogProps) {
	const [internalOpen, setInternalOpen] = React.useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const isOpen = open !== undefined ? open : internalOpen;
	const setIsOpen = onOpenChange || setInternalOpen;

	if (isDesktop) {
		return (
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogTrigger asChild className={classes?.root}>
					{trigger}
				</DialogTrigger>
				<DialogContent className={cn("sm:max-w-6xl", classes?.dialog)}>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						{description && (
							<DialogDescription>{description}</DialogDescription>
						)}
					</DialogHeader>
					<ResponsiveDialogContent className="px-0">
						{children}
					</ResponsiveDialogContent>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Drawer open={isOpen} onOpenChange={setIsOpen}>
			<DrawerTrigger asChild className={classes?.root}>
				{trigger}
			</DrawerTrigger>
			<DrawerContent className={classes?.drawer}>
				<DrawerHeader className="text-left">
					<DrawerTitle>{title}</DrawerTitle>
					{description && <DrawerDescription>{description}</DrawerDescription>}
				</DrawerHeader>
				<ResponsiveDialogContent className="px-4">
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
