# Phase 1 API Testing Guide

## Setup

1. **Get your Supabase Service Role Key:**
   - Go to: https://supabase.com/dashboard/project/lsbzbltpmmtplakdrjvq/settings/api
   - Scroll to "Project API keys"
   - Copy the `service_role` key (secret key, NOT the anon key)
   - Update `.env` file: `SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...` (replace YOUR_SERVICE_ROLE_KEY_HERE)

2. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Get your JWT token:**
   - Open http://localhost:3000 in browser
   - Sign in via the app
   - Open DevTools (F12) → Application → Cookies
   - Find cookie starting with `sb-lsbzbltpmmtplakdrjvq-auth-token`
   - Copy the entire cookie value (it's a JSON string)
   - Extract the `access_token` value from the JSON

## Test with Thunder Client / Postman

### Test 1: GET /api/auth/me

**Request:**
```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Expected Response (200):**
```json
{
  "id": "uuid",
  "name": "Your Name",
  "email": "your-email@gmail.com",
  "gender": "male",
  "school": "Your School",
  "default_face_id": "uuid or null",
  "image": "https://...signed-url... or null"
}
```

**Error Cases:**
- **401 Unauthorized:** No Authorization header or invalid token
- **404 Not Found:** User authenticated but profile doesn't exist in database

---

### Test 2: PATCH /api/auth/me

**Request:**
```http
PATCH http://localhost:3000/api/auth/me
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json

{
  "name": "Updated Name",
  "school": "New University"
}
```

**Expected Response (200):**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "email": "your-email@gmail.com",
  "gender": "male",
  "school": "New University",
  "default_face_id": null,
  "created_at": "2025-...",
  "updated_at": "2025-..." // Updated timestamp
}
```

**Valid fields to update:**
- `name` (string)
- `gender` (string)
- `school` (string)
- `default_face_id` (uuid string or null)

---

## Test with Frontend

### Option 1: Use existing Profile page

1. Run dev server: `npm run dev`
2. Navigate to: http://localhost:3000/profile
3. Check if profile data loads correctly
4. Try updating your profile
5. Verify changes save to database

### Option 2: Check browser DevTools

1. Open http://localhost:3000/profile
2. Open DevTools (F12) → Network tab
3. Look for request to `/api/auth/me`
4. Verify it returns 200 status
5. Check response data matches your profile

---

## Troubleshooting

### Issue: 401 Unauthorized
**Cause:** Invalid or missing JWT token
**Fix:**
1. Make sure you're signed in to the app
2. Get a fresh token from browser cookies
3. Ensure `Authorization: Bearer <token>` header is set

### Issue: 404 Profile Not Found
**Cause:** User exists in Supabase Auth but not in profiles table
**Fix:**
1. Check if profile exists: `SELECT * FROM profiles WHERE email = 'your-email@gmail.com'`
2. If missing, the backend should auto-create it (or create manually for now)

### Issue: 500 Internal Server Error
**Cause:** Missing `SUPABASE_SERVICE_ROLE_KEY` or other config issue
**Fix:**
1. Verify `.env` has `SUPABASE_SERVICE_ROLE_KEY` set
2. Restart dev server after updating `.env`
3. Check terminal logs for error details

### Issue: CORS errors
**Cause:** Frontend can't reach API
**Fix:**
1. Ensure dev server is running on port 3000
2. Check `.env` has correct `NEXT_PUBLIC_SUPABASE_URL`

---

## Success Criteria

✅ GET /api/auth/me returns user profile (200)
✅ GET /api/auth/me returns 401 without token
✅ PATCH /api/auth/me updates profile successfully
✅ Profile page loads data correctly
✅ No errors in browser console
✅ No errors in terminal logs

---

## Next Steps

Once Phase 1 is working:
1. Keep the Flask backend running for other endpoints
2. Continue to Phase 2: Supabase Vector Migration
3. Then Phase 3: Python AI Microservice
4. Finally Phase 4: Migrate remaining endpoints (matches, faces, baby, etc.)
