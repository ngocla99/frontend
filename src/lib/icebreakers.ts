/**
 * Icebreaker message templates for mutual connections
 *
 * These messages are sent automatically when a mutual connection is created
 * (i.e., when both users have generated a baby with each other)
 */

const ICEBREAKER_TEMPLATES = [
	"Looks like your baby has your smile 😄",
	"Your baby's going to be a heartbreaker! 💕",
	"I think they have your eyes... or maybe theirs? 👀",
	"This baby's definitely getting into trouble 😆",
	"Congrats on your AI baby! When's the first playdate? 👶",
	"That's one adorable mashup! 🥰",
	"Your baby already looks like they're plotting something 😏",
	"I see some strong genes in there! 💪",
	"This might be the cutest thing I've seen today 🌟",
	"Your baby's got that main character energy ✨",
	"10/10 would babysit 👍",
	"Your baby is giving model vibes already 📸",
	"That smile is going to melt hearts! 😊",
	"I can already tell they're going to be trouble... in the best way 😈",
	"Your baby just won cutest baby of the year! 🏆",
	"This is what happens when two amazing people combine 🎨",
	"Your baby looks ready to take on the world! 🌍",
	"I'm getting future genius vibes 🧠",
	"That's one photogenic baby! Say cheese! 📷",
	"Your baby already has more style than me 😎",
];

/**
 * Get a random icebreaker message
 *
 * @returns A random icebreaker message from the templates
 */
export function getRandomIcebreaker(): string {
	const randomIndex = Math.floor(Math.random() * ICEBREAKER_TEMPLATES.length);
	return ICEBREAKER_TEMPLATES[randomIndex];
}

/**
 * Get all available icebreaker templates
 *
 * @returns Array of all icebreaker templates
 */
export function getAllIcebreakers(): string[] {
	return [...ICEBREAKER_TEMPLATES];
}

/**
 * Get the total number of icebreaker templates
 *
 * @returns Number of templates
 */
export function getIcebreakerCount(): number {
	return ICEBREAKER_TEMPLATES.length;
}
