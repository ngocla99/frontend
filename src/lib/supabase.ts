/**
 * @deprecated Use createClient from @/lib/supabase/client instead
 * This file is kept for backward compatibility with existing features
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
		flowType: "pkce", // Enable PKCE flow for magic link
	},
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
