export enum Gender {
	MALE = "male",
	FEMALE = "female",
	OTHER = "other",
}

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

export type FaceApi = {
	face_id: string;
	image_url: string;
	storage_path?: string;
};

export type LiveMatchApi = {
	created_at: string;
	id: string;
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
	reactions: Record<string, unknown>;
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
	reactions: Record<string, unknown>;
};
