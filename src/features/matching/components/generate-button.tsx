import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerateButtonProps {
	isGenerating: boolean;
	isDisabled: boolean;
	onGenerate: () => void;
}

export function GenerateButton({
	isGenerating,
	isDisabled,
	onGenerate,
}: GenerateButtonProps) {
	return (
		<Button
			className="w-full h-16 px-8 py-2 rounded-[40px] flex justify-center items-center gap-2 bg-gradient-to-r from-[#ff5e8a] to-[#7773ff]"
			disabled={isDisabled}
			onClick={onGenerate}
		>
			<div className="flex items-center gap-3">
				{isGenerating ? (
					<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
				) : (
					<Sparkles className="w-5 h-5" />
				)}
				<span>{isGenerating ? "Generating..." : "Generate for Free"}</span>
			</div>
		</Button>
	);
}
