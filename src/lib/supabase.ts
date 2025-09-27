import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	realtime: {
		params: {
			eventsPerSecond: 10,
		},
	},
});

export type SupabaseMatch = {
	id: string;
	face_a_id: string;
	face_b_id: string;
	similarity_score: number;
	created_at: string;
};
