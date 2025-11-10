"use client";

import { CropIcon, Trash2Icon } from "lucide-react";
import {
	ImageCrop,
	ImageCropApply,
	ImageCropContent,
} from "@/components/image-crop";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";

interface ImageCropDialogProps {
	open: boolean;
	file: File | null;
	onOpenChange: (value: boolean) => void;
	onCrop: (value: string) => void;
	onCancelCrop: () => void;
}

export const ImageCropDialog = ({
	open,
	file,
	onOpenChange,
	onCrop,
	onCancelCrop,
}: ImageCropDialogProps) => {
	return (
		<ResponsiveDialog
			open={open}
			onOpenChange={(value) => {
				if (!value) onCancelCrop();
				onOpenChange(value);
			}}
			classes={{ container: "sm:max-w-xl max-h-[90vh]!" }}
			title={
				<div className="hidden sm:block text-center">
					<h3 className="text-xl font-semibold text-foreground mb-2">
						Crop Your Photo
					</h3>
					<p className="text-muted-foreground text-sm">
						{" "}
						Adjust the crop area to frame your face
					</p>
				</div>
			}
			drawerProps={{ dismissible: false }}
		>
			<div className="mb-4 sm:mb-0 h-[80vh] sm:h-auto px-4">
				{file && (
					<ImageCrop file={file} onCrop={onCrop} aspect={1} circularCrop>
						<div className="space-y-4 flex flex-col justify-between h-full">
							<div className="flex justify-center flex-1 items-center">
								<ImageCropContent className="rounded-lg overflow-hidden max-h-[70vh] sm:max-h-[300px]" />
							</div>

							<div className="flex justify-center gap-2">
								<Button variant="outline" size="sm" onClick={onCancelCrop}>
									<Trash2Icon className="size-4" />
									Cancel
								</Button>
								<ImageCropApply asChild>
									<Button size="sm">
										<CropIcon className="size-4" />
										Crop
									</Button>
								</ImageCropApply>
							</div>
						</div>
					</ImageCrop>
				)}
			</div>
		</ResponsiveDialog>
	);
};
