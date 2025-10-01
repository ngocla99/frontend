# Email Template Installation Guide

## 📧 Modern Student-Friendly Email Template

I've created two versions of a beautiful, student-friendly email template:

1. **SUPABASE_EMAIL_TEMPLATE.html** - Full version with all HTML email best practices
2. **SUPABASE_EMAIL_TEMPLATE_SIMPLE.html** - Simplified version (recommended for Supabase)

---

## 🎨 Design Features

✨ **Student-Friendly Design:**
- Modern gradient header (purple/blue)
- Clean, readable typography
- Mobile-responsive layout
- Clear call-to-action button
- Security notice for awareness
- Friendly, casual tone

🎓 **Student-Focused Elements:**
- Campus branding ("Made for students, by students")
- Emoji usage (appeals to younger demographic)
- Modern color palette
- Professional yet approachable

📱 **Technical Features:**
- Responsive design (works on all devices)
- Fallback link if button doesn't work
- Security tips included
- Email address confirmation

---

## 📝 How to Install

### Step 1: Copy the Template

Open `SUPABASE_EMAIL_TEMPLATE_SIMPLE.html` and **copy the entire content**.

### Step 2: Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard/project/kugsmmtdlhcyxxtbdoml
2. Click **Authentication** → **Email Templates**
3. Click **Magic Link**

### Step 3: Paste the Template

1. **Delete all existing content** in the template editor
2. **Paste** the entire template from `SUPABASE_EMAIL_TEMPLATE_SIMPLE.html`
3. **Click Save**

### Step 4: Test

1. Go to your app: http://localhost:3000/auth/sign-in
2. Enter your email
3. Check your inbox - you should see the beautiful new email! 🎉

---

## 🔧 Customization Options

### Change Colors

Replace the gradient colors in the header:

```html
<!-- Current: Purple/Blue gradient -->
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">

<!-- Option 1: Blue/Cyan (Modern Tech) -->
<div style="background: linear-gradient(135deg, #667eea 0%, #06b6d4 100%);">

<!-- Option 2: Pink/Orange (Vibrant) -->
<div style="background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);">

<!-- Option 3: Green/Teal (Fresh) -->
<div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);">

<!-- Option 4: Red/Pink (Bold) -->
<div style="background: linear-gradient(135deg, #ef4444 0%, #ec4899 100%);">
```

### Change App Name

Replace "AI Matching" with your app name:

```html
<h1 style="...">🎓 Your App Name</h1>
<p style="...">Your Custom Tagline</p>
```

### Change Footer Text

Update the footer:

```html
<p style="...">© 2025 Your App Name. Your custom message.</p>
```

### For Local Development

Replace the URL in the template:

```html
<!-- Production -->
https://fuzed.jayll.qzz.io/auth/confirm?token_hash={{ .TokenHash }}&type=email

<!-- Development -->
http://localhost:5000/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

---

## 🎯 Available Supabase Variables

You can use these variables in your template:

- `{{ .Email }}` - User's email address
- `{{ .TokenHash }}` - The token hash for verification
- `{{ .Token }}` - The verification token (alternative)
- `{{ .SiteURL }}` - Your configured site URL
- `{{ .ConfirmationURL }}` - Supabase default confirmation URL (don't use this!)

---

## 📸 Preview

The email will look like this:

```
┌─────────────────────────────────────┐
│   🎓 AI Matching                    │ ← Purple gradient header
│   Your Campus Connection Platform   │
├─────────────────────────────────────┤
│                                     │
│   Welcome back! 👋                  │
│                                     │
│   Click the button below to...     │
│                                     │
│   ┌──────────────────────────┐     │
│   │  Sign In to Your Account │     │ ← Purple button
│   └──────────────────────────┘     │
│                                     │
│   Button not working? Copy link... │
│   ┌──────────────────────────┐     │
│   │ https://fuzed.jayll...   │     │ ← Fallback link
│   └──────────────────────────┘     │
├─────────────────────────────────────┤
│ 🔒 Security tip: Never share...    │ ← Yellow security notice
├─────────────────────────────────────┤
│ Didn't request this link?...       │
│ © 2025 AI Matching Platform         │ ← Gray footer
│ Made for students, by students.     │
└─────────────────────────────────────┘
```

---

## ✅ Checklist

After installing the template:

- [ ] Template pasted into Supabase
- [ ] Saved successfully
- [ ] Tested by sending magic link
- [ ] Email received and looks good
- [ ] Button works and redirects correctly
- [ ] Mobile view tested (check on phone)
- [ ] Colors match your brand (optional)
- [ ] App name updated (optional)

---

## 🐛 Troubleshooting

### Email looks broken
- Make sure you copied the **entire** template
- Check that no HTML tags were cut off
- Try using the simplified version

### Button doesn't work
- Users can use the fallback link below the button
- Check that the URL is correct
- Verify token_hash variable is present

### Colors don't show
- Some email clients don't support gradients
- The design includes fallback colors
- Test with different email clients

---

## 🎨 Design Inspiration

The template uses:
- **Color Palette**: Purple (#667eea) + Violet (#764ba2)
- **Typography**: System fonts for best compatibility
- **Layout**: Centered, 600px max width
- **Style**: Modern, friendly, professional

Feel free to customize colors and text to match your brand! 🚀

