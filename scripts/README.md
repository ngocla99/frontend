# Celebrity Embedding Generator - Quick Start Guide

## Prerequisites

1. **AI Service Running**
   ```bash
   # Make sure your Python AI service is running
   # Check: http://localhost:8000/health (or your configured URL)
   ```

2. **Environment Variables**
   Make sure your `.env` or `.env.local` has:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PYTHON_AI_SERVICE_URL=http://localhost:8000
   ```

3. **Celebrity Images**
   - Add celebrity images to `data/celebrities/` folders
   - Update `data/celebrities/metadata.json` with celebrity info
   - See `data/celebrities/README.md` for detailed instructions

## Usage

### Run the Script

```bash
# Install tsx if not already installed
npm install -D tsx

# Run the celebrity embedding generator
npx tsx scripts/generate-celebrity-embeddings.ts
```

### Expected Output

```
═══════════════════════════════════════════════
🎭 Celebrity Embedding Generator
═══════════════════════════════════════════════

📋 Loaded metadata for 20 celebrities

══════════════════════════════════════════════
📁 Category: ACTORS
══════════════════════════════════════════════
   Found 8 images

📸 Processing: tom-cruise.jpg
   ✓ Image loaded (245.67 KB)
   ✓ Embedding extracted (512D vector)
   ✓ Uploaded to storage: celebrities/actors/tom-cruise.jpg
   ✅ Saved to database: Tom Cruise

...

══════════════════════════════════════════════
📊 SUMMARY
══════════════════════════════════════════════
✅ Successfully processed: 18
⏭️  Skipped (already exist): 2
❌ Failed: 0
📈 Total: 20

✅ Celebrity embedding generation complete!
```

## What the Script Does

1. **Scans** `data/celebrities/` for images organized by category
2. **Extracts** 512D face embeddings using your InsightFace AI service
3. **Uploads** images to Supabase `celebrity-images` bucket
4. **Inserts** celebrity records into `celebrities` table with embeddings
5. **Prevents duplicates** using image hash

## Troubleshooting

### AI Service Not Running
```
❌ Failed to extract embedding: fetch failed
```
**Solution**: Start your Python AI service
```bash
cd path/to/ai-service
python main.py  # or however you start it
```

### Missing Environment Variables
```
❌ Missing environment variables:
  - NEXT_PUBLIC_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
```
**Solution**: Check your `.env` file has the required variables

### No Images Found
```
❌ No category folders found in data/celebrities/
```
**Solution**: Add images to the category folders:
```bash
data/celebrities/
├── actors/       ← Add images here
├── musicians/    ← Add images here
├── athletes/     ← Add images here
└── influencers/  ← Add images here
```

### Upload Failed
```
✗ Upload failed: Row level security violation
```
**Solution**:
1. Check Supabase storage policies
2. Verify `celebrity-images` bucket exists
3. Ensure you're using the service role key (not anon key)

## Verify Results

### Check Supabase Dashboard

1. **Database → celebrities table**
   - Should see new celebrity records
   - Each should have an embedding vector

2. **Storage → celebrity-images bucket**
   - Should see uploaded images organized by category
   - Images should be publicly accessible

3. **Test the API**
   ```bash
   # Upload a user photo first, then check celebrity matches
   curl http://localhost:3000/api/matches/celebrity \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Re-running the Script

The script is **idempotent** (safe to run multiple times):
- Existing celebrities (by image hash) are skipped
- New celebrities are added
- Failed uploads can be retried

```bash
# Safe to run again
npx tsx scripts/generate-celebrity-embeddings.ts
```

## Advanced Usage

### Process Specific Category

Temporarily rename other folders to skip them:
```bash
# Only process musicians
mv data/celebrities/actors data/celebrities/_actors
npx tsx scripts/generate-celebrity-embeddings.ts
mv data/celebrities/_actors data/celebrities/actors
```

### Dry Run (Check Without Uploading)

Modify the script to add a `--dry-run` flag (future enhancement)

### Batch Processing

The script includes a 500ms delay between images to avoid overwhelming the AI service. For faster processing, reduce the timeout in the script (line with `setTimeout`).

## Next Steps

After running the script successfully:

1. **Test Celebrity Matching**
   - Upload a photo in the app
   - Wait for background matching to complete
   - Check the celebrity matches tab

2. **Monitor Match Quality**
   - Review similarity scores
   - Adjust celebrity dataset if needed
   - Add more diverse celebrities

3. **Production Deployment**
   - Commit metadata.json to git
   - Document celebrity image sources
   - Set up proper licensing

## Support

- Script errors: Check the error messages in the output
- AI service issues: Check Python service logs
- Supabase issues: Check Supabase dashboard → Logs
- Need help? Check `data/celebrities/README.md`
