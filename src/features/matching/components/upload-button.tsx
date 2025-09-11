import { Upload } from "lucide-react";
import { forwardRef } from "react";
import { Button } from "@/components/ui/button";

interface UploadButtonProps {
	onClick: () => void;
	variant?: "purple" | "pink";
	className?: string;
}

export const UploadButton = forwardRef<HTMLButtonElement, UploadButtonProps>(
	({ onClick, variant = "purple", className = "" }, ref) => {
		const colorClasses = {
			purple: "hover:border-purple-400 hover:bg-purple-50",
			pink: "hover:border-pink-400 hover:bg-pink-50",
		};

		return (
			<Button
				ref={ref}
				variant="outline"
				className={`w-full h-14 px-8 rounded-[28px] border-[#414751] transition-colors ${colorClasses[variant]} ${className}`}
				onClick={onClick}
			>
				<div className="flex items-center gap-3">
					<Upload className="size-6" />
					<span className="text-base font-medium text-[#2b2b2b]">
						Upload now
					</span>
					<div className="ml-auto">
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Dropdown arrow</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>
				</div>
			</Button>
		);
	},
);

UploadButton.displayName = "UploadButton";
