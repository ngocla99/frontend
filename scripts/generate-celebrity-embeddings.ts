#!/usr/bin/env tsx
/**
 * Celebrity Embedding Generator
 *
 * This script:
 * 1. Loads celebrity images from ./data/celebrities/ folder
 * 2. Extracts 512D InsightFace embeddings using existing AI service
 * 3. Uploads images to Supabase celebrity-images bucket
 * 4. Updates celebrities table with embeddings
 *
 * Usage:
 *   npx tsx scripts/generate-celebrity-embeddings.ts
 *
 * Requirements:
 *   - Celebrity images in ./data/celebrities/ organized by category
 *   - AI service running (PYTHON_AI_SERVICE_URL)
 *   - Supabase credentials in .env
 *   - metadata.json with celebrity info (optional)
 *
 * Image folder structure:
 *   ./data/celebrities/
 *     ├── actors/
 *     │   ├── tom-cruise.jpg
 *     │   └── jennifer-lawrence.jpg
 *     ├── musicians/
 *     │   ├── taylor-swift.jpg
 *     │   └── bruno-mars.jpg
 *     ├── athletes/
 *     │   └── serena-williams.jpg
 *     └── metadata.json
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { readdir, readFile } from "fs/promises";
import { basename, extname, join } from "path";
import { extractEmbedding } from "../src/lib/services/ai-service";

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CELEBRITIES_DIR = "./data/celebrities";

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
	console.error("❌ Missing environment variables:");
	console.error("  - NEXT_PUBLIC_SUPABASE_URL");
	console.error("  - SUPABASE_SERVICE_ROLE_KEY");
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

interface CelebrityMetadata {
	name: string;
	bio?: string;
	category: string;
	gender: "male" | "female";
	filename: string;
}

/**
 * Load celebrity metadata from JSON file
 */
async function loadMetadata(): Promise<Map<string, CelebrityMetadata>> {
	try {
		const metadataPath = join(CELEBRITIES_DIR, "metadata.json");
		const content = await readFile(metadataPath, "utf-8");
		const data = JSON.parse(content);

		const map = new Map<string, CelebrityMetadata>();
		for (const celeb of data.celebrities || []) {
			map.set(celeb.filename, celeb);
		}
		console.log(`📋 Loaded metadata for ${map.size} celebrities\n`);
		return map;
	} catch (error) {
		console.warn("⚠️  No metadata.json found, will use filename as name\n");
		return new Map();
	}
}

/**
 * Process a single celebrity image
 */
async function processCelebrityImage(
	filePath: string,
	filename: string,
	category: string,
	metadata?: CelebrityMetadata,
) {
	console.log(`\n📸 Processing: ${filename}`);

	try {
		// 1. Read image file
		const imageBuffer = await readFile(filePath);
		console.log(
			`   ✓ Image loaded (${(imageBuffer.length / 1024).toFixed(2)} KB)`,
		);

		// 2. Generate image hash for deduplication
		const imageHash = createHash("md5").update(imageBuffer).digest("hex");

		// Check if celebrity already exists
		const { data: existing } = await supabase
			.from("celebrities")
			.select("id, name")
			.eq("image_hash", imageHash)
			.maybeSingle();

		if (existing) {
			console.log(`   ⏭️  Already exists: ${existing.name} (skipping)`);
			return { success: true, filename, name: existing.name, skipped: true };
		}

		// 3. Extract embedding using existing AI service
		let embedding: number[];
		try {
			embedding = await extractEmbedding(Buffer.from(imageBuffer));
			console.log(`   ✓ Embedding extracted (${embedding.length}D vector)`);
		} catch (error: any) {
			console.error(`   ✗ Failed to extract embedding: ${error.message}`);
			return { success: false, filename, error: error.message };
		}

		// Validate embedding
		if (!Array.isArray(embedding) || embedding.length !== 512) {
			console.error(
				`   ✗ Invalid embedding: expected 512D vector, got ${embedding?.length}`,
			);
			return {
				success: false,
				filename,
				error: "Invalid embedding dimension",
			};
		}

		// 4. Upload image to Supabase storage
		const storagePath = `celebrities/${category}/${filename}`;
		const { error: uploadError } = await supabase.storage
			.from("celebrity-images")
			.upload(storagePath, imageBuffer, {
				contentType: `image/${extname(filename).slice(1).toLowerCase()}`,
				upsert: true,
				cacheControl: "3600",
			});

		if (uploadError) {
			console.error(`   ✗ Upload failed: ${uploadError.message}`);
			return { success: false, filename, error: uploadError.message };
		}
		console.log(`   ✓ Uploaded to storage: ${storagePath}`);

		// 5. Insert/update celebrity in database
		const name =
			metadata?.name ||
			basename(filename, extname(filename))
				.replace(/-/g, " ")
				.replace(/_/g, " ")
				.replace(/\b\w/g, (l) => l.toUpperCase());

		const gender = metadata?.gender || "female"; // Default, should be in metadata

		const { error: dbError } = await supabase.from("celebrities").upsert(
			{
				name,
				bio: metadata?.bio,
				category,
				gender,
				image_path: storagePath,
				embedding: `[${embedding.join(",")}]`, // PostgreSQL vector format
				image_hash: imageHash,
			},
			{
				onConflict: "image_hash",
				ignoreDuplicates: false,
			},
		);

		if (dbError) {
			console.error(`   ✗ Database insert failed: ${dbError.message}`);
			return { success: false, filename, error: dbError.message };
		}

		console.log(`   ✅ Saved to database: ${name}`);
		return { success: true, filename, name };
	} catch (error: any) {
		console.error(`   ✗ Unexpected error: ${error.message}`);
		return { success: false, filename, error: error.message };
	}
}

/**
 * Main function
 */
async function main() {
	console.log("═══════════════════════════════════════════════");
	console.log("🎭 Celebrity Embedding Generator");
	console.log("═══════════════════════════════════════════════\n");

	// Check if celebrities directory exists
	try {
		await readdir(CELEBRITIES_DIR);
	} catch (error) {
		console.error(`❌ Directory not found: ${CELEBRITIES_DIR}`);
		console.error("\nPlease create the directory structure:");
		console.error("  mkdir -p data/celebrities/actors");
		console.error("  mkdir -p data/celebrities/musicians");
		console.error("  mkdir -p data/celebrities/athletes");
		console.error("\nThen add celebrity images to the folders.");
		process.exit(1);
	}

	// Load metadata
	const metadata = await loadMetadata();

	// Get all categories (subdirectories)
	const entries = await readdir(CELEBRITIES_DIR, { withFileTypes: true });
	const categories = entries.filter((entry) => entry.isDirectory());

	if (categories.length === 0) {
		console.error("❌ No category folders found in data/celebrities/");
		console.error("\nExpected structure:");
		console.error("  data/celebrities/");
		console.error("    ├── actors/");
		console.error("    ├── musicians/");
		console.error("    └── athletes/");
		process.exit(1);
	}

	const results = {
		success: 0,
		failed: 0,
		skipped: 0,
		errors: [] as any[],
	};

	// Process each category
	for (const category of categories) {
		const categoryName = category.name;
		console.log(`\n${"═".repeat(50)}`);
		console.log(`📁 Category: ${categoryName.toUpperCase()}`);
		console.log("═".repeat(50));

		const categoryPath = join(CELEBRITIES_DIR, categoryName);
		const files = await readdir(categoryPath);

		const imageFiles = files.filter((file) => {
			const ext = extname(file).toLowerCase();
			return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
		});

		if (imageFiles.length === 0) {
			console.log(`   ⚠️  No images found in ${categoryName}/`);
			continue;
		}

		console.log(`   Found ${imageFiles.length} images\n`);

		for (const file of imageFiles) {
			const filePath = join(categoryPath, file);
			const meta = metadata.get(file);

			const result = await processCelebrityImage(
				filePath,
				file,
				categoryName,
				meta,
			);

			if (result.success) {
				if ((result as any).skipped) {
					results.skipped++;
				} else {
					results.success++;
				}
			} else {
				results.failed++;
				results.errors.push(result);
			}

			// Rate limit: wait 500ms between requests to avoid overwhelming AI service
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	// Print summary
	console.log("\n" + "═".repeat(50));
	console.log("📊 SUMMARY");
	console.log("═".repeat(50));
	console.log(`✅ Successfully processed: ${results.success}`);
	console.log(`⏭️  Skipped (already exist): ${results.skipped}`);
	console.log(`❌ Failed: ${results.failed}`);
	console.log(
		`📈 Total: ${results.success + results.failed + results.skipped}`,
	);

	if (results.errors.length > 0) {
		console.log("\n❌ ERRORS:");
		results.errors.forEach((err) => {
			console.log(`   - ${err.filename}: ${err.error}`);
		});
	}

	console.log("\n✅ Celebrity embedding generation complete!");
	console.log("\nNext steps:");
	console.log("  1. Verify celebrities in Supabase dashboard");
	console.log("  2. Test celebrity matching by uploading a photo");
	console.log("  3. Check GET /api/matches/celebrity endpoint\n");
}

// Run the script
main().catch((error) => {
	console.error("\n❌ Fatal error:", error);
	process.exit(1);
});
