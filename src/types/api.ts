export enum Gender {
	MALE = "male",
	FEMALE = "female",
	OTHER = "other",
}

export type UserApi = {
	username: string;
	email: string;
	avatar: string;
	age?: number;
	gender?: Gender | string;
	default_face_id?: string;
};

export type FaceApi = {
	face_id: string;
	image_url: string;
	storage_path?: string;
};
