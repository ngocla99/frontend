// Local storage utilities for favorites, history, and user preferences

export interface FavoriteMatch {
	id: string;
	name: string;
	image: string;
	type: "university" | "celebrity" | "custom";
	timestamp: number;
}

export interface GeneratedBaby {
	id: string;
	userPhoto: string;
	matchPhoto: string;
	matchName: string;
	babyImage: string;
	timestamp: number;
	matchType: "university" | "celebrity" | "custom";
}

export interface UserPreferences {
	theme: "light" | "dark" | "auto";
	hapticFeedback: boolean;
	shareAnalytics: boolean;
	notificationsEnabled: boolean;
}

class StorageManager {
	private static instance: StorageManager;

	static getInstance() {
		if (!StorageManager.instance) {
			StorageManager.instance = new StorageManager();
		}
		return StorageManager.instance;
	}

	// Favorites Management
	addFavorite(match: Omit<FavoriteMatch, "timestamp">) {
		const favorites = this.getFavorites();
		const newFavorite: FavoriteMatch = {
			...match,
			timestamp: Date.now(),
		};

		// Remove if already exists
		const filtered = favorites.filter((f) => f.id !== match.id);
		filtered.unshift(newFavorite);

		// Keep only last 50 favorites
		const limited = filtered.slice(0, 50);
		localStorage.setItem("fuzed_favorites", JSON.stringify(limited));

		return newFavorite;
	}

	removeFavorite(id: string) {
		const favorites = this.getFavorites();
		const filtered = favorites.filter((f) => f.id !== id);
		localStorage.setItem("fuzed_favorites", JSON.stringify(filtered));
	}

	getFavorites(): FavoriteMatch[] {
		try {
			const stored = localStorage.getItem("fuzed_favorites");
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	}

	isFavorite(id: string): boolean {
		return this.getFavorites().some((f) => f.id === id);
	}

	// Baby History Management
	addGeneratedBaby(baby: Omit<GeneratedBaby, "id" | "timestamp">) {
		const history = this.getBabyHistory();
		const newBaby: GeneratedBaby = {
			...baby,
			id: `baby_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: Date.now(),
		};

		history.unshift(newBaby);

		// Keep only last 100 babies
		const limited = history.slice(0, 100);
		localStorage.setItem("fuzed_baby_history", JSON.stringify(limited));

		return newBaby;
	}

	getBabyHistory(): GeneratedBaby[] {
		try {
			const stored = localStorage.getItem("fuzed_baby_history");
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	}

	deleteBaby(id: string) {
		const history = this.getBabyHistory();
		const filtered = history.filter((b) => b.id !== id);
		localStorage.setItem("fuzed_baby_history", JSON.stringify(filtered));
	}

	// User Preferences
	getPreferences(): UserPreferences {
		try {
			const stored = localStorage.getItem("fuzed_preferences");
			const defaultPrefs: UserPreferences = {
				theme: "auto",
				hapticFeedback: true,
				shareAnalytics: true,
				notificationsEnabled: true,
			};
			return stored ? { ...defaultPrefs, ...JSON.parse(stored) } : defaultPrefs;
		} catch {
			return {
				theme: "auto",
				hapticFeedback: true,
				shareAnalytics: true,
				notificationsEnabled: true,
			};
		}
	}

	updatePreferences(updates: Partial<UserPreferences>) {
		const current = this.getPreferences();
		const updated = { ...current, ...updates };
		localStorage.setItem("fuzed_preferences", JSON.stringify(updated));
		return updated;
	}

	// Analytics & Usage Stats
	trackEvent(event: string, data?: any) {
		const preferences = this.getPreferences();
		if (!preferences.shareAnalytics) return;

		const events = this.getAnalytics();
		events.push({
			event,
			data,
			timestamp: Date.now(),
			sessionId: this.getSessionId(),
		});

		// Keep only last 1000 events
		const limited = events.slice(-1000);
		localStorage.setItem("fuzed_analytics", JSON.stringify(limited));
	}

	private getAnalytics() {
		try {
			const stored = localStorage.getItem("fuzed_analytics");
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	}

	private getSessionId() {
		let sessionId = sessionStorage.getItem("fuzed_session_id");
		if (!sessionId) {
			sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			sessionStorage.setItem("fuzed_session_id", sessionId);
		}
		return sessionId;
	}

	// Cache Management
	clearAll() {
		localStorage.removeItem("fuzed_favorites");
		localStorage.removeItem("fuzed_baby_history");
		localStorage.removeItem("fuzed_preferences");
		localStorage.removeItem("fuzed_analytics");
	}

	getStorageStats() {
		const favorites = this.getFavorites();
		const history = this.getBabyHistory();
		const analytics = this.getAnalytics();

		return {
			favoritesCount: favorites.length,
			babyHistoryCount: history.length,
			analyticsCount: analytics.length,
			totalSizeKB: Math.round(
				(JSON.stringify(favorites).length +
					JSON.stringify(history).length +
					JSON.stringify(analytics).length) /
					1024,
			),
		};
	}
}

export const storage = StorageManager.getInstance();
