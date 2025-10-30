export type BabyApi = {
	id: string;
	match_id: string;
	image_url: string;
	created_at: string; // ISO timestamp
	generated_by_profile_id: string;
	parents: {
		a: ParentInfo;
		b: ParentInfo;
	};
};

export type ParentInfo = {
	id: string;
	name: string;
	gender: "male" | "female" | string;
};
