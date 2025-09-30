export enum Gender {
	MALE = "male",
	FEMALE = "female",
	OTHER = "other",
}

export type Reaction = "favorite";

export type UserApi = {
	id: string;
	name: string;
	email: string;
	age?: number;
	gender?: Gender | string;
	default_face_id?: string;
	image?: string;
	school?: string;
};

export type LiveMatchApi = {
	created_at: string;
	id: string;
	my_reaction: Reaction[];
	reactions: Record<string, unknown>;
	similarity_score: number;
	users: {
		a: {
			id: string;
			image: string;
			name: string;
		};
		b: {
			id: string;
			image: string;
			name: string;
		};
	};
};

export type UserMatchApi = {
	matches: Array<{
		id: string;
		created_at: string;
		my_image: string;
		other_image: string;
		reactions: Record<string, number>;
		similarity_score: number;
	}>;
	me: {
		gender: string;
		id: string;
		image: string;
		name: string;
		school: string;
	};
	number_of_matches: number;
	other: {
		gender: string;
		id: string;
		image: string;
		name: string;
		school: string;
	};
	type: string;
};
export type MatchFoundEvent = {
	id: string;
	type: "user-user" | "celebrity";
	me: {
		id: string;
		name: string;
		image: string;
		school: string;
		gender: Gender | string;
	};
	other: {
		id: string;
		name: string;
		image: string;
		school: string;
		gender: Gender | string;
	};
	similarity_score: number;
	created_at: string;
	reactions: Record<Reaction, unknown>;
};

export type PhotoUpload = {
	id: string;
	created_at: string;
	image_url: string;
};
