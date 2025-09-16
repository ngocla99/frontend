import user1Image from "@/features/matching/assets/user1.jpg";
import user2Image from "@/features/matching/assets/user2.jpg";
import user3Image from "@/features/matching/assets/user3.jpg";
import user4Image from "@/features/matching/assets/user4.jpg";

// Random names for generating dummy matches
const DUMMY_NAMES = [
	"Alex",
	"Jordan",
	"Taylor",
	"Casey",
	"Morgan",
	"Riley",
	"Avery",
	"Quinn",
	"Blake",
	"Drew",
	"Sage",
	"Maya",
	"Kai",
	"Finn",
	"Luna",
	"River",
	"Sky",
	"Phoenix",
	"Indigo",
	"Cedar",
	"Willow",
	"Aspen",
	"Jade",
	"Ruby",
	"Sage",
	"Ember",
	"Storm",
	"Ocean",
	"Forest",
	"Meadow",
	"Crystal",
	"Diamond",
	"Pearl",
];

const DUMMY_IMAGES = [user1Image, user2Image, user3Image, user4Image];

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

// Function to generate a random dummy match
export const generateRandomDummyMatch = () => {
	const getRandomName = () =>
		DUMMY_NAMES[Math.floor(Math.random() * DUMMY_NAMES.length)];
	const getRandomImage = () =>
		DUMMY_IMAGES[Math.floor(Math.random() * DUMMY_IMAGES.length)];
	const getRandomMatchPercentage = () => {
		// More realistic distribution of match percentages
		const rand = Math.random();
		if (rand < 0.1) return Math.floor(Math.random() * 5) + 95; // 10% chance for 95-99% (rare high matches)
		if (rand < 0.3) return Math.floor(Math.random() * 10) + 85; // 20% chance for 85-94% (good matches)
		if (rand < 0.7) return Math.floor(Math.random() * 15) + 70; // 40% chance for 70-84% (common matches)
		return Math.floor(Math.random() * 20) + 50; // 30% chance for 50-69% (lower matches)
	};

	// Generate more realistic timestamps
	const getRandomTimestamp = () => {
		const timestamps = [
			"just now",
			"just now",
			"just now", // Higher chance for "just now"
			"1m ago",
			"2m ago",
			"3m ago",
			"5m ago",
			"8m ago",
			"12m ago",
			"15m ago",
			"20m ago",
			"25m ago",
			"30m ago",
			"1h ago",
			"2h ago",
			"3h ago",
		];
		return timestamps[Math.floor(Math.random() * timestamps.length)];
	};

	const user1Name = getRandomName();
	let user2Name = getRandomName();
	// Ensure different names
	while (user2Name === user1Name) {
		user2Name = getRandomName();
	}

	return {
		user1: { name: user1Name, image: getRandomImage() },
		user2: { name: user2Name, image: getRandomImage() },
		matchPercentage: getRandomMatchPercentage(),
		timestamp: getRandomTimestamp(),
		isNew: true,
		isViewed: false,
	};
};
