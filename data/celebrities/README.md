# Celebrity Images Setup

This directory contains celebrity images for the lookalike matching feature.

## Directory Structure

```
data/celebrities/
├── actors/
│   ├── tom-cruise.jpg
│   ├── jennifer-lawrence.jpg
│   └── ...
├── musicians/
│   ├── taylor-swift.jpg
│   ├── bruno-mars.jpg
│   └── ...
├── athletes/
│   ├── serena-williams.jpg
│   ├── lebron-james.jpg
│   └── ...
├── influencers/
│   └── ...
└── metadata.json
```

## Image Requirements

### Quality
- **Resolution**: Minimum 512x512 pixels (higher is better)
- **Format**: JPG, JPEG, PNG, or WebP
- **Size**: Under 10MB per image
- **Face visibility**: Clear, front-facing portrait with good lighting

### Best Practices
1. **One face per image**: Ensure only the celebrity's face is in the photo
2. **Well-lit**: Good lighting helps with face detection
3. **Front-facing**: Face should be looking at the camera
4. **High quality**: Professional photos work best
5. **No filters**: Avoid heavy filters or edits

### Naming Convention
- Use lowercase
- Replace spaces with hyphens
- Example: `taylor-swift.jpg`, `tom-cruise.jpg`

## Adding Celebrities

### Step 1: Collect Images
1. Find high-quality, front-facing photos of celebrities
2. Download and save them to the appropriate category folder
3. Name them according to the naming convention above

### Step 2: Update metadata.json
Add an entry for each celebrity:

```json
{
  "filename": "celebrity-name.jpg",
  "name": "Celebrity Name",
  "bio": "Short biography or description",
  "category": "actors",
  "gender": "male"
}
```

**Fields:**
- `filename`: Exact filename in the category folder
- `name`: Full celebrity name (proper capitalization)
- `bio`: Short description (1-2 sentences)
- `category`: Must match folder name (actors, musicians, athletes, influencers)
- `gender`: "male" or "female" (used for matching filters)

### Step 3: Run the Generator Script

```bash
# Make sure your AI service is running
# Make sure environment variables are set (.env file)

# Run the script
npx tsx scripts/generate-celebrity-embeddings.ts
```

The script will:
1. ✅ Read all images from category folders
2. ✅ Extract face embeddings using InsightFace
3. ✅ Upload images to Supabase storage
4. ✅ Insert celebrity records into database

## Sourcing Celebrity Images

### Recommended Sources
1. **Wikimedia Commons**: Free, high-quality images
   - URL: https://commons.wikimedia.org
   - Filter by license: Public domain or CC-BY

2. **Official Press Photos**: Check celebrity/studio websites
   - Usually high quality and properly licensed

3. **Stock Photo Sites**: Pexels, Unsplash (with proper licenses)

### Legal Considerations
- ⚠️ Ensure you have the right to use the images
- Use images with appropriate licenses (CC-BY, Public Domain)
- For commercial use, verify licensing requirements
- Consider privacy and publicity rights

## Example Metadata Entry

```json
{
  "filename": "taylor-swift.jpg",
  "name": "Taylor Swift",
  "bio": "Grammy-winning singer-songwriter known for hits like 'Shake It Off'",
  "category": "musicians",
  "gender": "female"
}
```

## Troubleshooting

### "No face detected" error
- Ensure face is clearly visible and front-facing
- Check image lighting and quality
- Try a different photo

### "Invalid embedding dimension" error
- AI service may not be running
- Check PYTHON_AI_SERVICE_URL in .env
- Verify AI service logs

### Upload failed
- Check Supabase credentials
- Verify storage bucket exists: `celebrity-images`
- Check file size (must be under 10MB)

## Categories

### Actors
Hollywood and international film/TV actors

### Musicians
Singers, bands, music artists

### Athletes
Sports stars from various disciplines

### Influencers
Social media personalities, content creators

## Recommended Dataset

For testing, start with:
- **20-50 celebrities** total
- **Gender balanced**: 50% male, 50% female
- **Category balanced**: Distribute evenly across categories
- **Diverse**: Include different ethnicities, ages, styles

## Privacy & Ethics

⚠️ **Important Notes:**
- Only use publicly available images
- Respect copyright and licensing
- Consider ethical implications of facial recognition
- Provide clear privacy policies to users
- Allow users to opt-out of celebrity matching

## Support

If you encounter issues:
1. Check the script output for detailed error messages
2. Verify AI service is running: `http://localhost:8000/health`
3. Check Supabase dashboard for uploaded images
4. Review database logs in Supabase

---

**Ready to start?** Add some celebrity images to the folders and run the script!
