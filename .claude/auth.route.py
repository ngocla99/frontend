from flask import Blueprint, current_app, request, jsonify, redirect, session, url_for

from ..services.user_service import (
    generate_jwt_token,
    verify_jwt_token,
)


bp = Blueprint('auth', __name__)


@bp.route('/api/auth/me')
def get_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No valid authorization token'}), 401
    token = auth_header.split(' ')[1]
    user_data = verify_jwt_token(token)
    if not user_data:
        return jsonify({'error': 'Invalid or expired token'}), 401

    supabase = current_app.extensions['supabase']

    profile = None
    try:
        # Ưu tiên profile_id từ JWT, fallback email
        profile_id = user_data.get('profile_id')
        email = user_data.get('email')
        if profile_id:
            resp = supabase.table('profiles').select('*').eq('id', profile_id).limit(1).execute()
        else:
            resp = supabase.table('profiles').select('*').eq('email', email).limit(1).execute()
        rows = getattr(resp, 'data', None) or []
        profile = rows[0] if rows else None
    except Exception:
        current_app.logger.exception('Truy vấn profile từ Supabase thất bại')

    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    # Ảnh: nếu có default_face_id → ký URL; nếu không, fallback sang avatar Google trong JWT (picture)
    image_url = None
    try:
        default_face_id = profile.get('default_face_id')
        if default_face_id:
            from ..services.user_service import get_face_uri_service
            info, err = get_face_uri_service(str(default_face_id))
            if info and isinstance(info, dict):
                image_url = info.get('image_url') or None
        # if not image_url:
        #     picture = user_data.get('picture')
        #     if picture:
        #         image_url = picture
    except Exception:
        current_app.logger.exception('Lấy image_url cho default_face_id thất bại (GET /api/auth/me)')

    return jsonify({
        'id': profile.get('id'),
        'email': profile.get('email') or '',
        'name': profile.get('name') or '',
        'image': image_url or '',
        'school': profile.get('school'),
        'gender': profile.get('gender'),
        'default_face_id': profile.get('default_face_id'),
    })


@bp.route('/api/auth/me', methods=['PATCH'])
def update_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No valid authorization token'}), 401
    try:
        from ..services.user_service import update_current_user_service
        data, err = update_current_user_service(request.json or {})
        if err:
            body, code = err
            return jsonify(body), code
        return jsonify(data)
    except Exception as e:
        current_app.logger.exception('Cập nhật user thất bại')
        return jsonify({'error': 'Cập nhật thất bại'}), 500


@bp.route('/login')
def login():
    # Phase 2: hỗ trợ query param "callback_url" (ưu tiên), fallback "callback" cho compatibility
    callback_url = request.args.get('callback_url') or request.args.get('callback') or f"{current_app.config.get('FRONTEND_URL')}/auth/callback"
    session['frontend_callback'] = callback_url
    redirect_uri = url_for('auth.callback', _external=True)
    return current_app.extensions['oauth'].google.authorize_redirect(redirect_uri)


@bp.route('/callback')
def callback():
    try:
        token = current_app.extensions['oauth'].google.authorize_access_token()
        user_info = token.get('userinfo')
        if not user_info:
            frontend_callback = session.get('frontend_callback', f"{current_app.config.get('FRONTEND_URL')}/auth/callback")
            return redirect(f"{frontend_callback}?error=no_user_info")

        # Upsert profiles từ OAuth
        from ..services.user_service import _supabase_upsert_profile_from_oauth
        profile = _supabase_upsert_profile_from_oauth(user_info) or {}

        # Sau khi có profile, xác thực email trường và cập nhật 'school'
        try:
            from ..services.user_service import infer_school_and_update_profile
            school, err = infer_school_and_update_profile(user_info.get('email'), profile.get('id'))
            if err and err not in ['update_failed']:
                frontend_callback = session.get('frontend_callback', f"{current_app.config.get('FRONTEND_URL')}/auth/callback")
                return redirect(f"{frontend_callback}?error={err}")
            if school:
                profile['school'] = school
        except Exception:
            current_app.logger.exception('Xác thực/cập nhật school thất bại (OAuth callback)')

        # Sinh JWT theo Phase 2, kèm picture làm fallback avatar
        jwt_token = generate_jwt_token({
            'profile_id': profile.get('id'),
            'email': profile.get('email') or user_info.get('email'),
            'name': profile.get('name') or user_info.get('name'),
            'picture': user_info.get('picture'),
        })

        frontend_callback = session.get('frontend_callback', f"{current_app.config.get('FRONTEND_URL')}/auth/callback")
        # Phase 2: redirect với ?token=
        return redirect(f"{frontend_callback}?token={jwt_token}")
    except Exception as e:
        current_app.logger.exception('OAuth callback thất bại')
        frontend_callback = session.get('frontend_callback', f"{current_app.config.get('FRONTEND_URL')}/auth/callback")
        return redirect(f"{frontend_callback}?error={str(e)}")


@bp.route('/api/auth/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'})


# ===== Passwordless (Magic Link) with Supabase =====
@bp.route('/api/auth/magic-link', methods=['POST'])
def send_magic_link():
    try:
        body = request.json or {}
        email = (body.get('email') or '').strip()
        if not email:
            return jsonify({'error': 'email is required'}), 400

        # Optional redirect override from client; else use configured FRONTEND_URL
        frontend_url = current_app.config.get('FRONTEND_URL')
        default_redirect = f"{frontend_url}/auth/callback"
        email_redirect_to = (body.get('emailRedirectTo') or body.get('redirect_to') or default_redirect)

        supabase = current_app.extensions['supabase']

        # Supabase Python client: signInWithOtp (sends Magic Link by default)
        # ref: https://supabase.com/docs/guides/auth/auth-email-passwordless#with-magic-link
        # In Python SDK, it's `auth.sign_in_with_otp({ email, options })` equivalent.
        # Some versions expose `sign_in_with_otp` on supabase.auth; if not available,
        # use the underlying GoTrue client when accessible.
        try:
            # The official supabase-py exposes `auth.sign_in_with_otp` in recent releases
            _ = supabase.auth.sign_in_with_otp({
                'email': email,
                'options': {
                    'shouldCreateUser': True,
                    'emailRedirectTo': email_redirect_to,
                },
            })
        except Exception:
            # Fallback: legacy signature without options key
            try:
                _ = supabase.auth.sign_in_with_otp({
                    'email': email,
                })
            except Exception:
                current_app.logger.exception('Gửi magic link thất bại')
                return jsonify({'error': 'Failed to send magic link'}), 500

        return jsonify({'message': 'Magic link sent'}), 200
    except Exception:
        current_app.logger.exception('Lỗi không xác định khi gửi magic link')
        return jsonify({'error': 'Internal Server Error'}), 500


@bp.route('/auth/confirm')
def auth_confirm():
    """Handle Supabase magic link/OTP confirmation.

    Supported query params from email template:
      - token_hash & type=email  (PKCE flow template)
      - token & type=email       (OTP verify)

    After verification, upsert profile in our own `profiles` table
    and redirect to frontend callback with our app JWT.
    """
    supabase = current_app.extensions['supabase']
    frontend_callback = session.get('frontend_callback', f"{current_app.config.get('FRONTEND_URL')}/auth/callback")

    token_hash = request.args.get('token_hash')
    token = request.args.get('token')
    vtype = request.args.get('type') or 'email'

    try:
        # Verify via Supabase
        if token_hash:
            # PKCE email confirmation
            verify_resp = supabase.auth.verify_otp({
                'token_hash': token_hash,
                'type': vtype,
            })
        elif token:
            email = request.args.get('email') or ''
            verify_resp = supabase.auth.verify_otp({
                'email': email,
                'token': token,
                'type': vtype,
            })
        else:
            return redirect(f"{frontend_callback}?error=missing_token")

        # Extract user info
        # supabase-py returns an object with user/session depending on version
        user_email = None
        user_name = None
        try:
            # Newer API: verify_resp.session.user
            session_obj = getattr(verify_resp, 'session', None)
            if session_obj and getattr(session_obj, 'user', None):
                user_email = getattr(session_obj.user, 'email', None)
                # name may be in user.user_metadata
                meta = getattr(session_obj.user, 'user_metadata', None) or {}
                user_name = meta.get('name') or meta.get('full_name')
        except Exception:
            pass
        if not user_email:
            try:
                data = getattr(verify_resp, 'user', None) or getattr(verify_resp, 'data', None) or {}
                if isinstance(data, dict):
                    user_email = data.get('email') or (data.get('user') or {}).get('email')
                    user_name = (data.get('user') or {}).get('user_metadata', {}).get('name')
            except Exception:
                pass

        if not user_email:
            return redirect(f"{frontend_callback}?error=missing_email")

        # Upsert our profiles
        from ..services.user_service import _supabase_get_profile_by_email, _supabase_upsert_profile_from_oauth
        profile = _supabase_get_profile_by_email(user_email)
        if not profile:
            oinfo = {'email': user_email, 'name': user_name or ''}
            profile = _supabase_upsert_profile_from_oauth(oinfo)
        if not profile:
            return redirect(f"{frontend_callback}?error=profile_upsert_failed")

        # Sau khi có profile, xác thực email trường và cập nhật 'school'
        try:
            from ..services.user_service import infer_school_and_update_profile
            school, err = infer_school_and_update_profile(user_email, profile.get('id'))
            if err and err not in ['update_failed']:
                return redirect(f"{frontend_callback}?error={err}")
        except Exception:
            current_app.logger.exception('Xác thực/cập nhật school thất bại (auth_confirm)')

        # Issue our app JWT and redirect
        jwt_token = generate_jwt_token({
            'profile_id': profile.get('id'),
            'email': profile.get('email') or user_email,
            'name': profile.get('name') or (user_name or ''),
        })
        return redirect(f"{frontend_callback}?token={jwt_token}")
    except Exception:
        current_app.logger.exception('Xác nhận magic link thất bại')
        return redirect(f"{frontend_callback}?error=confirm_failed")
