export const CelebrityMatchCardSkeleton = () => {
	return (
		<div className="w-full p-4 sm:p-5 rounded-xl border-2 border-gray-200 bg-white animate-pulse">
			<div className="flex items-center gap-3 sm:gap-4">
				<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 flex-shrink-0" />
				<div className="flex-1 min-w-0">
					<div className="h-5 bg-gray-200 rounded w-32 mb-2" />
					<div className="h-3 bg-gray-200 rounded w-24" />
				</div>
				<div className="h-8 w-16 bg-gray-200 rounded-lg flex-shrink-0" />
			</div>
		</div>
	);
};
