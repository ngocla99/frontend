export enum Gender {
	MALE = "male",
	FEMALE = "female",
	OTHER = "other",
}

export type UserApi = {
	user_id: string;
	username: string;
	email: string;
	avatar: string;
	age?: number;
	gender?: Gender | string;
	default_face_id?: string;
	image_url?: string;
};

export type FaceApi = {
	face_id: string;
	image_url: string;
	storage_path?: string;
};

export type LiveMatchApi = {
	created_at: string;
	similarity: number;
	user_a: string;
	user_a_image_url: string;
	user_a_name: string;
	user_b: string;
	user_b_image_url: string;
	user_b_name: string;
};

export type UserMatchApi = {
	created_at: string;
	image_url: string;
	name: string;
	similarity: number;
	user_id: string;
};
