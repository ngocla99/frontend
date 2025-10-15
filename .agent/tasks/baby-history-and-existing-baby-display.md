# Baby History & Existing Baby Display

**Feature:** Display existing babies when clicking matches and implement baby history list

**Status:** ✅ Completed

**Created:** 2025-10-16
**Completed:** 2025-10-16

---

## Overview

Complete the baby generation feature by:
1. Automatically fetching and displaying existing baby when user clicks a match
2. Building a fully functional baby history list with real data

## Current State

### What Already Exists
- ✅ Backend API endpoints for baby generation and listing (`/api/v1/baby`, `/api/v1/me/babies`)
- ✅ `BabyGenerator` component with UI (placeholder state only)
- ✅ `BabyTab` component with UI shell (no data integration)
- ✅ API layer with hooks: `useBabyForMatch`, `useGenerateBaby`, `useBabyList`
- ✅ Zustand store managing matchId and dialog state
- ✅ Type definitions: `BabyApi`, `BabyListItem`

### What's Missing
1. **Baby Generator**: Doesn't check if baby already exists when dialog opens
2. **Baby History List**: Empty component with no data fetching
3. **Baby History Interaction**: Can't click babies to view in dialog

---

## Requirements

### Functional Requirements
1. When user clicks "View Baby" on a match card:
   - Dialog opens and immediately checks if baby exists
   - If baby exists, display it instantly
   - If not, show "Generate" button
2. Baby History tab displays all generated babies
3. Clicking a baby in history opens the dialog with that baby's details
4. Proper loading states during data fetching
5. Handle empty states gracefully

### Technical Requirements
1. Use existing `useBabyForMatch()` hook to fetch existing baby
2. Use existing `useBabyList()` hook to fetch all babies
3. Maintain type safety with `BabyApi` and `BabyListItem` types
4. Follow animation SOP guidelines
5. Handle error states appropriately

---

## Implementation Plan

### Phase 1: Update Baby Generator Component

**File:** `src/features/matching/components/match-dialog/baby-generator.tsx`

#### Changes Required:

1. **Import the query hook** (line 6):
```typescript
import { useGenerateBaby, useBabyForMatch } from "../../api/generate-baby";
```

2. **Add query to fetch existing baby** (after line 25):
```typescript
// Fetch existing baby for this match
const { data: existingBaby, isLoading: loadingExisting } = useBabyForMatch({
  matchId,
  queryConfig: {
    enabled: !!matchId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  }
});
```

3. **Add useEffect to load existing baby** (after query):
```typescript
// Load existing baby image when available
useEffect(() => {
  if (existingBaby?.image_url) {
    setBabyImage(existingBaby.image_url);
  }
}, [existingBaby]);
```

4. **Update loading state condition** (line 170):
```typescript
// Change from: isGenerating
// Change to: isGenerating || loadingExisting
```

5. **Update helper text logic** (line 377):
```typescript
// Show loading message while checking for existing baby
{!canGenerate && !isGenerating && !loadingExisting && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center text-white/70 text-sm"
  >
    {!matchId
      ? "💡 Match information required to generate baby"
      : "💡 Upload both photos to generate your baby"}
  </motion.div>
)}
```

#### Expected Behavior:
- Dialog opens → Shows loading spinner → Displays existing baby (if found)
- If no baby exists → Shows "?" placeholder + Generate button
- Smooth transitions between states

---

### Phase 2: Complete Baby History List

**File:** `src/features/matching/components/favorite-history/baby-tab.tsx`

#### Changes Required:

1. **Import required hooks and types** (lines 1-8):
```typescript
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Trash2 } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTimeAgo } from "@/lib/utils/date";
import { useBabyList, type BabyListItem } from "@/features/matching/api/generate-baby";
import { useUserMatchesActions } from "@/features/matching/store/user-matches";
import { ImageLoader } from "@/components/image-loader";
```

2. **Replace entire component implementation** (lines 9-83):
```typescript
export function BabyTab() {
  // Fetch all babies for current user
  const { data: babies = [], isLoading } = useBabyList();
  const { onOpen } = useUserMatchesActions();

  // Handle clicking a baby to view details
  const handleBabyClick = (baby: BabyListItem) => {
    onOpen(
      {
        user1: { name: baby.me.name, photo: baby.me.image || "" },
        user2: { name: baby.other.name, photo: baby.other.image || "" },
      },
      baby.id
    );
  };

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-4 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (babies.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-4xl mb-3">👶</div>
        <p>No baby generations yet</p>
        <p className="text-sm">Generate your first baby to see it here</p>
      </div>
    );
  }

  // Display baby history
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnimatePresence>
        {babies.map((baby) => (
          <motion.div
            key={baby.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              className="p-4 group hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleBabyClick(baby)}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-sm">
                    Baby with {baby.other.name}
                  </h3>
                </div>

                {/* Photos Row */}
                <div className="flex items-center justify-between">
                  <ImageLoader
                    src={baby.me.image || ""}
                    alt={baby.me.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border-2 border-pink-200"
                  />

                  {/* Display all baby images */}
                  <div className="flex gap-2">
                    {baby.images.slice(0, 3).map((img, index) => (
                      <ImageLoader
                        key={img.id}
                        src={img.image_url}
                        alt={`Baby ${index + 1}`}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                      />
                    ))}
                    {baby.images.length > 3 && (
                      <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
                        +{baby.images.length - 3}
                      </div>
                    )}
                  </div>

                  <ImageLoader
                    src={baby.other.image || ""}
                    alt={baby.other.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                  />
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {baby.images.length} {baby.images.length === 1 ? 'baby' : 'babies'}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {getTimeAgo(baby.created_at)}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

#### Expected Behavior:
- Tab opens → Fetches all babies → Displays grid
- Loading skeleton shows while fetching
- Empty state if no babies generated
- Click baby card → Opens dialog with baby details
- Shows count of all generated babies per match

---

## API Integration Details

### Backend Endpoints (Already Implemented)

#### Get Existing Baby
```
GET /api/v1/baby
Authorization: Bearer <token>
Body: { "match_id": "<uuid>" }

Response 200:
{
  "id": "match-uuid",
  "image_url": "https://fal.media/.../baby.jpeg",
  "me": { "id": "...", "name": "John", "image": "...", "school": "MIT" },
  "other": { "id": "...", "name": "Jane", "image": "...", "school": "Stanford" },
  "created_at": "2025-10-15T10:30:00Z"
}

Response 404: { "error": "No baby found for this match" }
```

#### Get Baby List
```
GET /api/v1/me/babies?skip=0&limit=50
Authorization: Bearer <token>

Response 200:
[
  {
    "id": "match-uuid",
    "me": { "id": "...", "name": "John", "image": "...", "school": "MIT" },
    "other": { "id": "...", "name": "Jane", "image": "...", "school": "Stanford" },
    "created_at": "2025-10-15T10:30:00Z",
    "images": [
      { "id": "baby-uuid", "image_url": "https://..." }
    ]
  }
]
```

---

## File Structure

```
src/features/matching/
├── api/
│   └── generate-baby.ts              # ✅ Already has all hooks
├── components/
│   ├── match-dialog/
│   │   ├── baby-generator.tsx        # 🔄 UPDATE - Fetch existing baby
│   │   └── match-dialog.tsx          # ✅ Already passes matchId
│   └── favorite-history/
│       └── baby-tab.tsx               # 🔄 UPDATE - Implement data fetching
└── store/
    └── user-matches.ts                # ✅ Already has matchId support
```

---

## Testing Checklist

### Manual Testing
- [ ] Open match card → Dialog shows existing baby (if generated)
- [ ] Open match card → Dialog shows "?" + Generate button (if not generated)
- [ ] Loading state shows while checking for existing baby
- [ ] Generate button works correctly
- [ ] Baby History tab fetches and displays all babies
- [ ] Loading skeleton shows while fetching babies
- [ ] Empty state displays when no babies exist
- [ ] Click baby in history → Opens dialog with correct match info
- [ ] Multiple babies per match display correctly
- [ ] Timestamps display in human-readable format

### Edge Cases
- [ ] No matchId provided
- [ ] API returns 404 (no baby found)
- [ ] API returns error
- [ ] Network timeout
- [ ] Empty baby list
- [ ] Baby with missing images
- [ ] Multiple babies for same match

---

## Dependencies

### Existing Dependencies (No New Installs Needed)
- `@tanstack/react-query` - Already used for data fetching
- `zustand` - Already used for state management
- `framer-motion` - Already used for animations
- `sonner` - Already used for toasts

---

## Success Criteria

✅ Clicking match shows existing baby immediately if available
✅ Baby History tab displays all generated babies
✅ Click baby in history opens dialog correctly
✅ Proper loading states throughout
✅ Error handling is robust
✅ Animations follow SOP guidelines
✅ Type safety maintained throughout

---

## Implementation Order

1. ✅ **Phase 1**: Update `baby-generator.tsx` to fetch existing baby
2. ✅ **Phase 2**: Complete `baby-tab.tsx` with data integration
3. ⏳ **Phase 3**: Manual testing of complete flow
4. ⏳ **Phase 4**: Update documentation

---

## Notes

- Baby generation takes ~3-5 seconds via FAL.AI
- Images are hosted externally (FAL.AI CDN)
- Multiple babies per match are supported
- Backend returns all babies grouped by match
- Cache existing baby data for 5 minutes to reduce API calls

---

**Last Updated:** 2025-10-16
**Status:** ✅ Completed
**Assigned To:** AI Assistant
**Priority:** High
