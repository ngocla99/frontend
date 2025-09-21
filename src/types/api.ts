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
	celebrity: {
		id: string;
		image_url: string;
		name: string;
	};
	created_at: string;
	id: string;
	reactions: Record<string, unknown>;
	similarity_score: number;
};
