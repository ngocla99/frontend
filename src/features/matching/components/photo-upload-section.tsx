import { useRef } from "react";
import { UploadButton } from "./upload-button";

interface PhotoUploadSectionProps {
	step: number;
	title: string;
	description: string;
	variant: "purple" | "pink";
	onPhotoUpload: (file: File) => void;
}

export function PhotoUploadSection({
	step,
	title,
	description,
	variant,
	onPhotoUpload,
}: PhotoUploadSectionProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleClick = () => {
		inputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			onPhotoUpload(file);
		}
	};

	const colorClasses = {
		purple: "bg-purple-500",
		pink: "bg-pink-500",
	};

	return (
		<div className="flex flex-col items-center px-8 py-9">
			<div className="flex items-center gap-1">
				<div
					className={`w-6 h-6 rounded-[73px] bg-[#7773ff] text-xs font-bold leading-3 text-white flex justify-center items-center mr-1.5`}
				>
					{step}
				</div>
				<h3 className="text-md font-medium text-[#2b2b2b]">{title}</h3>
			</div>
			<p className="text-xs font-normal text-center tracking-[0] text-[#9da2ad] mt-3">
				{description}
			</p>
			<div className="relative mt-4">
				<UploadButton variant={variant} onClick={handleClick} />
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={handleFileChange}
				/>
			</div>
		</div>
	);
}
