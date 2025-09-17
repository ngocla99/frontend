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
