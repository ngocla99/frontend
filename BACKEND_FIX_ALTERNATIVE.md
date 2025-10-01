# Backend Alternative: Handle Supabase Default Email Flow

If you **cannot modify the Supabase email template**, you need to change the backend approach.

## Problem

Supabase default email template links to:
```
https://kugsmmtdlhcyxxtbdoml.supabase.co/auth/v1/verify?token=...&redirect_to=...
```

This goes through Supabase's verification endpoint, which then redirects to your `redirect_to` URL.

---

## Solution: Let Supabase Verify, Then Exchange Token

### Backend Changes Needed

Update `send_magic_link()` in `auth.route.py`:

```python
@bp.route('/api/auth/magic-link', methods=['POST'])
def send_magic_link():
    try:
        body = request.json or {}
        email = (body.get('email') or '').strip()
        if not email:
            return jsonify({'error': 'email is required'}), 400

        # Frontend callback URL (not backend!)
        frontend_url = current_app.config.get('FRONTEND_URL')
        frontend_callback = f"{frontend_url}/auth/callback"

        supabase = current_app.extensions['supabase']

        # Send magic link with frontend callback
        _ = supabase.auth.sign_in_with_otp({
            'email': email,
            'options': {
                'shouldCreateUser': True,
                'emailRedirectTo': frontend_callback,  # Changed to frontend
            },
        })

        return jsonify({'message': 'Magic link sent'}), 200
    except Exception:
        current_app.logger.exception('Lỗi khi gửi magic link')
        return jsonify({'error': 'Internal Server Error'}), 500
```

### Add New Backend Endpoint for Token Exchange

Add this new endpoint to `auth.route.py`:

```python
@bp.route('/api/auth/supabase-exchange', methods=['POST'])
def supabase_token_exchange():
    """Exchange Supabase session token for backend JWT"""
    try:
        body = request.json or {}
        supabase_token = body.get('supabase_token', '').strip()

        if not supabase_token:
            return jsonify({'error': 'supabase_token is required'}), 400

        supabase = current_app.extensions['supabase']

        # Verify the Supabase token and get user info
        try:
            # Get user info from Supabase token
            user_response = supabase.auth.get_user(supabase_token)
            user = user_response.user if hasattr(user_response, 'user') else user_response

            if not user or not hasattr(user, 'email'):
                return jsonify({'error': 'Invalid Supabase token'}), 401

            user_email = user.email
            user_name = getattr(user, 'user_metadata', {}).get('name', '')

        except Exception as e:
            current_app.logger.exception('Supabase token verification failed')
            return jsonify({'error': 'Invalid Supabase token'}), 401

        # Find or create profile in our database
        from ..services.user_service import _supabase_get_profile_by_email, _supabase_upsert_profile_from_oauth

        profile = _supabase_get_profile_by_email(user_email)
        if not profile:
            oinfo = {'email': user_email, 'name': user_name or ''}
            profile = _supabase_upsert_profile_from_oauth(oinfo)

        if not profile:
            return jsonify({'error': 'Profile creation failed'}), 500

        # Verify school
        try:
            from ..services.user_service import infer_school_and_update_profile
            school, err = infer_school_and_update_profile(user_email, profile.get('id'))
            if school:
                profile['school'] = school
        except Exception:
            current_app.logger.exception('School verification failed')

        # Generate our backend JWT
        jwt_token = generate_jwt_token({
            'profile_id': profile.get('id'),
            'email': profile.get('email') or user_email,
            'name': profile.get('name') or user_name,
        })

        return jsonify({
            'access_token': jwt_token,
            'user': {
                'id': profile.get('id'),
                'email': profile.get('email'),
                'name': profile.get('name'),
                'school': profile.get('school'),
                'gender': profile.get('gender'),
                'default_face_id': profile.get('default_face_id'),
            }
        }), 200

    except Exception:
        current_app.logger.exception('Token exchange failed')
        return jsonify({'error': 'Token exchange failed'}), 500
```

---

## Frontend Changes

### Update `magic-link-callback.tsx`

```typescript
import { useRouter, useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/stores/auth-store";

export function MagicLinkCallback() {
	const router = useRouter();
	const { setAccessToken, setUser } = useAuth();
	const [hasProcessed, setHasProcessed] = React.useState(false);

	const searchParams = useSearch({ from: "/auth/callback" });

	React.useEffect(() => {
		if (hasProcessed) return;

		const handleAuthCallback = async () => {
			try {
				// Check if we got a token from backend (old flow)
				const backendToken = searchParams.token;
				if (backendToken) {
					setAccessToken(backendToken);

					// Fetch user data
					const user = await apiClient.get("/api/auth/me");
					setUser(user);
					toast.success("Successfully signed in!");
					router.navigate({ to: "/" });
					setHasProcessed(true);
					return;
				}

				// New flow: Get Supabase session and exchange for backend token
				const { data, error } = await supabase.auth.getSession();
				console.log("🚀 ~ Supabase session:", data);

				if (error || !data.session) {
					throw new Error("No session found");
				}

				// Exchange Supabase token for backend token
				const response = await apiClient.post("/api/auth/supabase-exchange", {
					supabase_token: data.session.access_token,
				});

				setAccessToken(response.access_token);
				setUser(response.user);
				toast.success("Successfully signed in!");
				router.navigate({ to: "/" });
				setHasProcessed(true);

			} catch (error) {
				console.error("Auth callback error:", error);
				toast.error(
					error instanceof Error ? error.message : "Authentication failed",
				);
				router.navigate({ to: "/" });
			}
		};

		handleAuthCallback();
	}, [hasProcessed, searchParams, setAccessToken, setUser, router]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
				<p className="mt-4 text-sm text-muted-foreground">
					Completing authentication...
				</p>
			</div>
		</div>
	);
}
```

---

## Updated Flow

```
1. User enters email
   └→ POST /api/auth/magic-link { email }

2. Backend sends magic link via Supabase
   └→ Email redirects to frontend: /auth/callback

3. Supabase verifies and redirects
   └→ Frontend: /auth/callback#access_token=...

4. Frontend gets Supabase session
   └→ POST /api/auth/supabase-exchange { supabase_token }

5. Backend verifies Supabase token
   ├→ Creates/finds user profile
   ├→ Generates backend JWT
   └→ Returns: { access_token, user }

6. Frontend stores backend token ✅
```

---

## Which Approach to Use?

### Option 1: Custom Email Template (Recommended)
- ✅ Cleaner flow
- ✅ Backend handles everything
- ✅ More secure (no token exposure to frontend)
- ❌ Requires Supabase dashboard access

### Option 2: Token Exchange (Alternative)
- ✅ Works with default Supabase template
- ✅ No Supabase config changes needed
- ❌ Extra API call
- ❌ Supabase token briefly exposed to frontend

---

Choose Option 1 if you can access Supabase dashboard (recommended).
Use Option 2 if you cannot modify email templates.

