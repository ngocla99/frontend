export const getTimeAgo = (createdAt: string): string => {
	const now = new Date();
	const created = new Date(createdAt);
	const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

	if (diffInSeconds < 60) return "just now";
	if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
	if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
	return `${Math.floor(diffInSeconds / 86400)}d ago`;
};
