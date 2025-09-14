import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GenderSelectionProps {
	selectedGender: "male" | "female";
	onGenderChange: (gender: "male" | "female") => void;
}

export function GenderSelection({
	selectedGender,
	onGenderChange,
}: GenderSelectionProps) {
	return (
		<div className="space-y-4">
			<h3 className="font-medium text-[#2b2b2b]">What's your gender?</h3>
			<div className="flex gap-4">
				<Button
					variant={selectedGender === "male" ? "default" : "outline"}
					className={cn(
						"py-0 gap-2 justify-start flex-1 h-14 px-4 w-auto rounded-[60px] text-[#2b2b2b] bg-[#edf3ff] hover:bg-[#e0ebff]",
						{
							"border-[#6378ff] border": selectedGender === "male",
						},
					)}
					onClick={() => onGenderChange("male")}
				>
					<img src="/images/boy.png" alt="Boy" className="size-8" />
					<span className="text-base leading-4.5">Boy</span>
					{selectedGender === "male" && (
						<div className="flex items-center justify-center size-6 rounded-full bg-[#6378ff] ml-auto text-white">
							<Check className="w-4 h-4" />
						</div>
					)}
				</Button>

				<Button
					variant={selectedGender === "female" ? "default" : "outline"}
					className={cn(
						"py-0 gap-2 justify-start flex-1 h-14 px-4 w-auto rounded-[60px] text-[#2b2b2b] bg-[#ffedf2] hover:bg-[#ffe0e9]",
						{
							"border-[#fa5dab] border": selectedGender === "female",
						},
					)}
					onClick={() => onGenderChange("female")}
				>
					<img src="/images/girl.png" alt="Girl" className="size-8" />
					<span className="text-base leading-4.5">Girl</span>
					{selectedGender === "female" && (
						<div className="flex items-center justify-center size-6 rounded-full bg-[#fa5dab] ml-auto text-white">
							<Check className="w-4 h-4" />
						</div>
					)}
				</Button>
			</div>
		</div>
	);
}
