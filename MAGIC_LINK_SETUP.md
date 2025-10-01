# Magic Link Authentication Setup Guide

## ✅ Frontend Implementation Complete

The frontend has been updated to work with your backend's magic link implementation.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     MAGIC LINK FLOW                             │
└─────────────────────────────────────────────────────────────────┘

1. User enters email on frontend
   └─→ POST /api/auth/magic-link { email }

2. Backend calls Supabase to send magic link
   └─→ Supabase sends email with link

3. User clicks link in email
   └─→ Link points to: {BACKEND_URL}/auth/confirm?token_hash=...&type=email

4. Backend verifies with Supabase
   ├─→ Creates/updates profile in database
   ├─→ Generates backend JWT token
   └─→ Redirects to: {FRONTEND_URL}/auth/callback?token={jwt}

5. Frontend extracts token and authenticates
   ├─→ Stores token in cookies
   ├─→ Calls GET /api/auth/me
   └─→ Redirects to home page ✅
```

---

## Required Supabase Configuration

### 1. **Email Template Configuration**

Go to: **Supabase Dashboard** → **Authentication** → **Email Templates** → **Magic Link**

Update the template to redirect to your **backend** `/auth/confirm` endpoint:

```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Log In</a></p>
```

**Important**: The `{{ .SiteURL }}` must point to your **backend URL**, not frontend!

---

### 2. **Site URL Configuration**

Go to: **Supabase Dashboard** → **Authentication** → **URL Configuration**

Set:
- **Site URL**: `https://fuzed.jayll.qzz.io` (your backend URL)
- **Redirect URLs**: Add both:
  - `https://fuzed.jayll.qzz.io/auth/confirm`
  - `http://localhost:3000/auth/callback` (for development)

---

### 3. **Environment Variables**

Verify your `.env` file has:

```env
VITE_BASE_API_URL=https://fuzed.jayll.qzz.io/
VITE_SUPABASE_URL=https://kugsmmtdlhcyxxtbdoml.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Testing the Complete Flow

### Development Testing

1. **Start your backend** (make sure it's running on the configured URL)

2. **Start frontend**:
   ```bash
   npm run dev
   # or
   bun dev
   ```

3. **Test the flow**:
   - Go to `http://localhost:3000/auth/sign-in`
   - Enter your email address
   - Click "Send sign-in link"
   - Check your email
   - Click the magic link
   - You should be redirected and authenticated ✅

---

## Updated Frontend Files

### 1. `src/features/auth/api/magic-link-auth.ts`
- ✅ Now calls backend `/api/auth/magic-link` instead of Supabase directly
- ✅ Removed client-side Supabase verification

### 2. `src/features/auth/components/magic-link-callback.tsx`
- ✅ Simplified to extract `token` from URL query params
- ✅ Handles `error` parameter from backend
- ✅ Sets token and fetches user data

### 3. `src/routes/auth/callback.tsx`
- ✅ Added validation schema for `token` and `error` params

### 4. `src/routes/auth/sign-in.tsx` & `sign-up.tsx`
- ✅ Already using `MagicLinkForm` component (no changes needed)

### 5. `src/features/auth/components/signin-button.tsx` & `signup-button.tsx`
- ✅ Navigate to auth forms (no changes needed)

---

## Backend Endpoints (Reference)

Your backend already implements these:

### `POST /api/auth/magic-link`
**Request**:
```json
{
  "email": "user@example.com",
  "redirect_to": "https://fuzed.jayll.qzz.io/auth/confirm"
}
```

**Response**:
```json
{
  "message": "Magic link sent"
}
```

### `GET /auth/confirm`
**Query Parameters**:
- `token_hash`: Hash from Supabase magic link
- `type`: Usually "email"

**Action**:
1. Verifies token with Supabase
2. Creates/updates user profile
3. Generates JWT token
4. Redirects to frontend: `?token={jwt}`

---

## Troubleshooting

### "Failed to send magic link"
- ✅ Check backend is running and accessible
- ✅ Verify `/api/auth/magic-link` endpoint is working
- ✅ Check backend logs for errors

### Email not arriving
- ✅ Check spam folder
- ✅ Verify Supabase SMTP is configured
- ✅ Check email address is valid
- ✅ Check Supabase rate limits (1 email per 60 seconds)

### Magic link doesn't work / "No token received"
- ✅ Verify Supabase email template redirects to backend `/auth/confirm`
- ✅ Check Site URL in Supabase is set to backend URL
- ✅ Verify redirect URLs include both backend and frontend
- ✅ Check backend logs for verification errors

### "Invalid or expired token" after signin
- ✅ Verify backend JWT generation is working
- ✅ Check token is being set in cookies correctly
- ✅ Ensure `/api/auth/me` can verify the token

### Infinite loading on callback page
- ✅ Check browser console for errors
- ✅ Verify URL has `?token=...` parameter
- ✅ Check `/api/auth/me` request in Network tab
- ✅ Ensure user data is returned successfully

---

## Security Considerations

✅ **Already handled by your backend**:
- Server-side Supabase token verification
- Profile creation/update in database
- JWT generation with proper expiry
- Secure redirect URLs

✅ **Frontend best practices**:
- Tokens stored in HTTP-only cookies (via api-client)
- No sensitive data in localStorage
- Proper error handling
- HTTPS in production

---

## Next Steps

1. ✅ Update Supabase email template (see section 1)
2. ✅ Configure Site URL and Redirect URLs (see section 2)
3. ✅ Test the complete flow (see Testing section)
4. ✅ Deploy to production
5. ✅ (Optional) Remove old Google OAuth files if not needed

---

## Production Deployment Checklist

- [ ] Update Supabase Site URL to production backend URL
- [ ] Update email template with production URLs
- [ ] Add production redirect URLs to Supabase
- [ ] Update `.env` with production API URL
- [ ] Test magic link on production
- [ ] Verify HTTPS is working
- [ ] Test on different email providers (Gmail, Outlook, etc.)

---

## Comparison: Old vs New Flow

### ❌ Old Flow (Not Working)
```
Frontend → Supabase → Frontend (Supabase token)
                           ↓
                      Backend API ❌ (Rejects Supabase token)
```

### ✅ New Flow (Working)
```
Frontend → Backend → Supabase (sends email)
                         ↓
User clicks → Backend /auth/confirm → Verifies → Generates JWT
                                                       ↓
                                              Frontend (Backend JWT) ✅
```

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify Supabase configuration
4. Test each step individually
5. Check network requests in DevTools

---

**Status**: ✅ Frontend implementation complete and ready to test!

