/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { Heart, Upload, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

interface CustomMatch {
	id: string;
	name: string;
	image: string;
}

interface CustomMatchUploadProps {
	onSelectCustomMatch: (match: CustomMatch) => void;
	selectedCustomMatch?: CustomMatch;
}

export const CustomMatchUpload = ({
	onSelectCustomMatch,
	selectedCustomMatch,
}: CustomMatchUploadProps) => {
	const [uploadedMatches, setUploadedMatches] = useState<CustomMatch[]>([]);
	const [dragActive, setDragActive] = useState(false);

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			const file = e.dataTransfer.files[0];
			const photoUrl = URL.createObjectURL(file);
			addNewMatch(photoUrl);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			const photoUrl = URL.createObjectURL(file);
			addNewMatch(photoUrl);
		}
	};

	const handlePhotoLibraryUpload = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.multiple = false;
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const photoUrl = URL.createObjectURL(file);
				addNewMatch(photoUrl);
			}
		};
		input.click();
	};

	const addNewMatch = (photoUrl: string) => {
		const newMatch: CustomMatch = {
			id: Date.now().toString(),
			name: `Person ${uploadedMatches.length + 1}`,
			image: photoUrl,
		};
		setUploadedMatches((prev) => [...prev, newMatch]);
	};

	const calculateMatchPercentage = (): number => {
		return Math.floor(Math.random() * 30) + 70; // 70-99%
	};

	return (
		<Card className="p-4 sm:p-6 bg-gradient-card shadow-soft border-0 hover:shadow-match transition-all duration-300">
			<div className="text-center mb-4 sm:mb-6">
				<div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
					<Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
				</div>
				<h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">
					Upload Custom Photos
				</h2>
				<p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
					Upload photos of friends, family, or anyone from your camera roll!
				</p>
			</div>

			{/* Upload Section */}
			<div className="space-y-4 mb-6">
				{/* Photo Library Button */}
				<Button
					variant="default"
					onClick={handlePhotoLibraryUpload}
					className="w-full gap-2 h-12 text-base font-medium"
				>
					<Upload className="w-5 h-5" />📱 Upload from Camera Roll
				</Button>

				{/* Divider */}
				<div className="flex items-center gap-4">
					<div className="flex-1 h-px bg-border"></div>
					<span className="text-xs text-muted-foreground">OR</span>
					<div className="flex-1 h-px bg-border"></div>
				</div>

				{/* Drag & Drop Area */}
				<div
					className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${
						dragActive
							? "border-primary bg-primary/5"
							: "border-border hover:border-primary/50"
					}`}
					onDragEnter={handleDrag}
					onDragLeave={handleDrag}
					onDragOver={handleDrag}
					onDrop={handleDrop}
				>
					<Upload className="w-8 h-8 mx-auto mb-3 text-primary" />
					<div className="space-y-2">
						<p className="text-base font-medium text-foreground">
							Drag & drop photos here
						</p>
						<p className="text-xs text-muted-foreground">JPG, PNG, WEBP</p>
					</div>
					<input
						type="file"
						className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
						accept="image/jpeg,image/png,image/webp"
						onChange={handleFileChange}
					/>
				</div>
			</div>

			{/* Uploaded Photos */}
			{uploadedMatches.length > 0 && (
				<div className="space-y-3 sm:space-y-4">
					<h3 className="text-lg font-display font-semibold text-foreground">
						Your Uploaded Photos
					</h3>
					{uploadedMatches.map((match) => {
						const matchPercentage = calculateMatchPercentage();
						const isSelected = selectedCustomMatch?.id === match.id;

						return (
							<div
								key={match.id}
								className={`p-3 sm:p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-match ${
									isSelected
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/50"
								}`}
								onClick={() => onSelectCustomMatch(match)}
							>
								<div className="flex items-center gap-3 sm:gap-4">
									<div className="relative">
										<img
											src={match.image}
											alt={match.name}
											className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white shadow-sm"
										/>
										<div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-love rounded-full flex items-center justify-center">
											<Heart className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
										</div>
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between mb-1 sm:mb-2">
											<h3 className="font-bold text-foreground text-sm sm:text-base truncate">
												{match.name}
											</h3>
											<div className="flex items-center gap-1 flex-shrink-0 ml-2">
												<Heart className="w-3 h-3 sm:w-4 sm:h-4 text-love" />
												<span className="font-bold text-love text-sm sm:text-base">
													{matchPercentage}%
												</span>
											</div>
										</div>

										<p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
											From your camera roll
										</p>
									</div>

									<div className="text-center flex-shrink-0">
										{isSelected ? (
											<div className="text-primary font-medium text-xs sm:text-sm">
												<Heart className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
												Selected
											</div>
										) : (
											<Button
												variant="ghost"
												size="sm"
												className="text-match hover:text-match-light text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
											>
												<Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
												<span className="hidden sm:inline">See </span>Baby
											</Button>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{uploadedMatches.length === 0 && (
				<div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
					<p className="text-xs sm:text-sm text-blue-700 text-center leading-relaxed">
						💡 Upload photos of friends, family, or anyone to see what your
						babies would look like together!
					</p>
				</div>
			)}
		</Card>
	);
};
