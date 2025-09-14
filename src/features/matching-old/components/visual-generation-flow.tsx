import { Baby, Heart, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VisualGenerationFlowProps {
	fatherPhoto: File | null;
	motherPhoto: File | null;
}

export function VisualGenerationFlow({
	fatherPhoto,
	motherPhoto,
}: VisualGenerationFlowProps) {
	return (
		<div className="space-y-8 flex flex-col items-center">
			<h1 className="text-6xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent text-center lg:text-left">
				AI Baby Generator
			</h1>

			{/* Visual Generation Flow */}
			<div className="relative">
				{/* Parent Photos */}
				<div className="flex justify-center items-center gap-8 mb-8">
					<div className="relative">
						<div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-200 to-pink-300 flex items-center justify-center border-4 border-pink-300 shadow-lg">
							{motherPhoto ? (
								<img
									src={URL.createObjectURL(motherPhoto)}
									alt="Mother"
									className="w-full h-full rounded-full object-cover"
								/>
							) : (
								<Baby className="w-16 h-16 text-pink-500" />
							)}
						</div>
						<Badge className="absolute -bottom-2 -right-2 bg-pink-500 text-white">
							Mother
						</Badge>
					</div>

					<div className="relative">
						<Heart className="w-12 h-12 text-pink-500 animate-pulse" />
						<div className="absolute -top-1 -right-1">
							<Sparkles className="w-4 h-4 text-yellow-400 animate-bounce" />
						</div>
					</div>

					<div className="relative">
						<div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center border-4 border-blue-300 shadow-lg">
							{fatherPhoto ? (
								<img
									src={URL.createObjectURL(fatherPhoto)}
									alt="Father"
									className="w-full h-full rounded-full object-cover"
								/>
							) : (
								<Baby className="w-16 h-16 text-blue-500" />
							)}
						</div>
						<Badge className="absolute -bottom-2 -right-2 bg-blue-500 text-white">
							Father
						</Badge>
					</div>
				</div>

				{/* Connection Lines */}
				<div className="flex justify-center gap-16 mb-8">
					<div className="w-0.5 h-8 bg-gradient-to-b from-pink-300 to-transparent"></div>
					<div className="w-0.5 h-8 bg-gradient-to-b from-blue-300 to-transparent"></div>
				</div>

				{/* Generated Baby Photos */}
				<div className="flex justify-center gap-8">
					<div className="relative">
						<div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-200 to-purple-300 flex items-center justify-center border-4 border-purple-300 shadow-lg">
							<Baby className="w-12 h-12 text-purple-500" />
						</div>
						<Badge className="absolute -bottom-2 -right-2 bg-purple-500 text-white text-xs">
							Boy
						</Badge>
					</div>

					<div className="relative">
						<div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-200 to-pink-300 flex items-center justify-center border-4 border-pink-300 shadow-lg">
							<Baby className="w-12 h-12 text-pink-500" />
						</div>
						<Badge className="absolute -bottom-2 -right-2 bg-pink-500 text-white text-xs">
							Girl
						</Badge>
					</div>
				</div>
			</div>
		</div>
	);
}
