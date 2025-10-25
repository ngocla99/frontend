import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,

	// Image optimization (for Supabase Storage images)
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "*.supabase.co",
				pathname: "/storage/v1/**",
			},
			{
				protocol: "https",
				hostname: "fal.media", // FAL.AI baby images
			},
		],
	},

	// Environment variables
	env: {
		NEXT_PUBLIC_BASE_API_URL: process.env.NEXT_PUBLIC_BASE_API_URL,
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
			process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
	},
};

export default nextConfig;
