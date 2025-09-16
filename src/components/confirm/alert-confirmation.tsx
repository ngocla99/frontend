import { AlertCircle } from "lucide-react";
import React from "react";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import type { ConfirmConfig } from ".";

export const AlertConfirmation: React.FC<ConfirmConfig> = ({
	type = "confirm",
	open,
	title,
	description,
	confirmText,
	cancelText,
	onConfirm,
	onCancel,
	onClose,
}) => {
	const [isOpen, setIsOpen] = React.useState(open);

	React.useEffect(() => {
		setIsOpen(open);
	}, [open]);

	const handleClose = () => {
		setIsOpen(false);
		if (onClose) onClose();
	};

	const handleConfirm = () => {
		if (onConfirm) onConfirm();
		handleClose();
	};

	const handleCancel = () => {
		if (onCancel) onCancel();
		handleClose();
	};

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) handleClose();
	};

	const getButtonVariant = () => {
		if (type === "error") return "destructive";
		if (type === "warning") return "destructive";
		return "default";
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					{type === "error" && <AlertCircle className="h-4 w-4" />}
					<AlertDialogTitle>{title}</AlertDialogTitle>
					{description && (
						<AlertDialogDescription>{description}</AlertDialogDescription>
					)}
				</AlertDialogHeader>
				<AlertDialogFooter className="gap-5">
					{cancelText && (
						<Button size="lg" variant="outline" onClick={handleCancel}>
							{cancelText}
						</Button>
					)}
					{confirmText && (
						<Button
							size="lg"
							variant={getButtonVariant()}
							onClick={handleConfirm}
						>
							{confirmText}
						</Button>
					)}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
