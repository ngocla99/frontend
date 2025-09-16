import user1Image from "@/features/matching/assets/user1.jpg";
import user2Image from "@/features/matching/assets/user2.jpg";
import user3Image from "@/features/matching/assets/user3.jpg";
import user4Image from "@/features/matching/assets/user4.jpg";

export const DUMMY_MATCHES = [
	{
		user1: { name: "Sophie", image: user1Image },
		user2: { name: "Jordan", image: user2Image },
		matchPercentage: 88,
		timestamp: "just now",
		isNew: false,
		isViewed: true,
	},
	{
		user1: { name: "Casey", image: user3Image },
		user2: { name: "Zoe", image: user4Image },
		matchPercentage: 81,
		timestamp: "just now",
		isNew: false,
		isViewed: true,
	},
	{
		user1: { name: "Sam", image: user2Image },
		user2: { name: "Zoe", image: user3Image },
		matchPercentage: 69,
		timestamp: "1m ago",
		isNew: true,
		isViewed: false,
	},
	{
		user1: { name: "Alex", image: user1Image },
		user2: { name: "Jamie", image: user4Image },
		matchPercentage: 92,
		timestamp: "2m ago",
		isNew: true,
		isViewed: false,
	},
	{
		user1: { name: "Taylor", image: user3Image },
		user2: { name: "Morgan", image: user2Image },
		matchPercentage: 76,
		timestamp: "5m ago",
		isNew: false,
		isViewed: true,
	},
	{
		user1: { name: "Riley", image: user4Image },
		user2: { name: "Avery", image: user1Image },
		matchPercentage: 84,
		timestamp: "8m ago",
		isNew: false,
		isViewed: true,
	},
	{
		user1: { name: "Quinn", image: user2Image },
		user2: { name: "Blake", image: user3Image },
		matchPercentage: 73,
		timestamp: "12m ago",
		isNew: false,
		isViewed: true,
	},
	{
		user1: { name: "Drew", image: user1Image },
		user2: { name: "Sage", image: user4Image },
		matchPercentage: 89,
		timestamp: "15m ago",
		isNew: false,
		isViewed: true,
	},
	{
		user1: { name: "Maya", image: user3Image },
		user2: { name: "Kai", image: user1Image },
		matchPercentage: 95,
		timestamp: "20m ago",
		isNew: true,
		isViewed: false,
	},
	{
		user1: { name: "Finn", image: user4Image },
		user2: { name: "Luna", image: user2Image },
		matchPercentage: 78,
		timestamp: "25m ago",
		isNew: false,
		isViewed: true,
	},
];
