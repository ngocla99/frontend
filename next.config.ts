import type { NextConfig } from "next";
import "./src/config/env";

const nextConfig: NextConfig = {
	reactStrictMode: true,

	// Image optimization (for Supabase Storage images)
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**.supabase.co", // Supabase storage images
			},
			{
				protocol: "https",
				hostname: "avatar.vercel.sh", // Vercel avatar images
			},
			{
				protocol: "https",
				hostname: "fal.media", // FAL.AI baby images
			},
			{
				protocol: "https",
				hostname: "v3b.fal.media", // FAL.AI baby images
			},
		],
	},
};

export default nextConfig;
