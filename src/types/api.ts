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
	gender?: Gender;
};
