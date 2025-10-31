# Auto-Update School from Email Domain

## Overview
Automatically detect and update user's school based on their email domain using the University Domains List API when users update their profile.

## Problem Statement
Currently, users must manually enter their school information. Since we require educational email addresses (.edu), we can automatically detect their university from the email domain to improve user experience and data accuracy.

## Solution Design

### Architecture
1. **Email Validation Layer**: Update to support dev/prod modes
   - Production: Only allow .edu domains
   - Development: Allow any email for testing

2. **University Lookup Service**: New utility to query university data
   - API: `http://universities.hipolabs.com/search?domain={domain}`
   - Extracts domain from email
   - Returns university name or null

3. **Profile Update Hook**: Auto-fill school on PATCH request
   - Triggers when: `body.school` not provided AND `profile.school` is null
   - Queries university API with user's email
   - Updates school field if match found

### API Integration
**University Domains List API**
- Endpoint: `http://universities.hipolabs.com/search?domain={domain}`
- Response structure:
```json
[
  {
    "name": "Massachusetts Institute of Technology",
    "alpha_two_code": "US",
    "country": "United States",
    "domains": ["mit.edu"],
    "web_pages": ["http://web.mit.edu"],
    "state-province": null
  }
]
```
- Free public API (no auth required)
- No caching strategy (always query on demand)

## Implementation Plan

### Phase 1: Environment & Configuration
1. **Update Environment Variables**
   - Remove: `NEXT_PUBLIC_WHITELIST_EMAIL_DOMAINS` (client-side)
   - Add: `DEV_ALLOW_NON_EDU_EMAILS` (server-side boolean, default: false)
   - Files: `src/config/env.ts`, `.env.example`, `.env`

2. **Update Email Validation Logic**
   - File: `src/features/auth/api/magic-link-auth.ts`
   - Production mode: Require .edu domains only
   - Development mode: Accept any email domain
   - Remove whitelist logic

### Phase 2: University Lookup Service
3. **Create University Lookup Utility**
   - File: `src/lib/services/university-lookup.ts` (NEW)
   - Function: `lookupUniversityByEmail(email: string): Promise<string | null>`
   - Extract domain from email
   - Query University Domains API
   - Return first matching university name
   - Handle errors gracefully (return null on failure)

### Phase 3: Profile Update Integration
4. **Update Profile PATCH Endpoint**
   - File: `src/app/api/auth/me/route.ts`
   - Logic:
     ```typescript
     if (body.school === undefined && !profile.school) {
       const detectedSchool = await lookupUniversityByEmail(session.user.email)
       if (detectedSchool) {
         updates.school = detectedSchool
       }
     }
     ```
   - Only runs when school not provided in request AND profile has no school

### Phase 4: Documentation
5. **Update Documentation Files**
   - `.agent/sop/environment-variables.md`: Document new `DEV_ALLOW_NON_EDU_EMAILS`
   - `.agent/system/project_architecture.md`: Remove `NEXT_PUBLIC_WHITELIST_EMAIL_DOMAINS` references
   - `README.md`: Update environment variables section

## Technical Specifications

### Environment Variables
```bash
# Server-side (NEW)
DEV_ALLOW_NON_EDU_EMAILS=false  # true in dev, false in prod

# Client-side (REMOVE)
# NEXT_PUBLIC_WHITELIST_EMAIL_DOMAINS=  # No longer needed
```

### University Lookup Service
```typescript
export async function lookupUniversityByEmail(
  email: string
): Promise<string | null> {
  try {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return null

    const response = await fetch(
      `http://universities.hipolabs.com/search?domain=${domain}`
    )
    const universities = await response.json()

    return universities[0]?.name || null
  } catch (error) {
    console.error('University lookup failed:', error)
    return null
  }
}
```

### Profile Update Logic
```typescript
// In PATCH /api/auth/me
if (body.school === undefined && !profile.school) {
  const detectedSchool = await lookupUniversityByEmail(session.user.email)
  if (detectedSchool) {
    updates.school = detectedSchool
  }
}
```

## User Experience

### Production Flow
1. User signs up with `john@mit.edu`
2. Email validation: Passes (.edu domain)
3. User updates profile (name, gender, etc.)
4. System detects school is missing
5. API lookup finds "Massachusetts Institute of Technology"
6. Profile saved with auto-filled school

### Development Flow
1. User signs up with `test@gmail.com`
2. Email validation: Passes (dev mode enabled)
3. User updates profile
4. System attempts lookup but finds no match
5. Profile saved with school = null
6. User can manually set school later

## Benefits
- Improved UX: One less field for users to fill
- Data accuracy: Reduces typos and inconsistent naming
- Development flexibility: Test with any email in dev mode
- Simplified codebase: Remove complex whitelist logic

## Testing Strategy
1. Unit test university lookup service
2. Test PATCH endpoint with:
   - .edu email with valid university
   - .edu email with no match
   - Non-.edu email in dev mode
   - Profile already has school (should not override)
   - body.school provided (should use provided value)

## Rollout
- No database migration required (school field already exists)
- Backward compatible (existing profiles unaffected)
- Can be deployed without downtime
- Gradual effect as users update their profiles

## Future Enhancements (Out of Scope)
- Cache university list locally for faster lookups
- Support international university domains
- Validate university against curated list
- Allow users to override auto-detected school
