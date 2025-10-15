# Animations Guidelines

**Related Docs:** [Project Architecture](../system/project_architecture.md) | [README](../README.md)

---

## Overview

This document provides best practices and guidelines for implementing animations in the application. Following these guidelines ensures consistent, performant, and accessible animations across the entire UI.

---

## Keep Your Animations Fast

- **Default to `ease-out`** for most animations
- Animations should **never be longer than 1s** (unless illustrative)
- Most animations should be around **0.2s to 0.3s**

**Why?**
- Fast animations feel responsive and professional
- Long animations make the UI feel sluggish
- Users should never wait for animations to complete

---

## Easing Rules

**Don't use built-in CSS easings** unless it's `ease` or `linear`.

Use the following easings for their described use cases:

### 1. `ease-in` (Starts slow, speeds up)

**⚠️ Generally avoid** - Makes UI feel slow

| Variant | Cubic Bezier | When to Use |
|---------|--------------|-------------|
| `ease-in-quad` | `cubic-bezier(.55, .085, .68, .53)` | Very subtle acceleration |
| `ease-in-cubic` | `cubic-bezier(.550, .055, .675, .19)` | Moderate acceleration |
| `ease-in-quart` | `cubic-bezier(.895, .03, .685, .22)` | Strong acceleration |
| `ease-in-quint` | `cubic-bezier(.755, .05, .855, .06)` | Very strong acceleration |
| `ease-in-expo` | `cubic-bezier(.95, .05, .795, .035)` | Exponential acceleration |
| `ease-in-circ` | `cubic-bezier(.6, .04, .98, .335)` | Circular acceleration |

**Use Case:** Elements leaving the screen (rare)

---

### 2. `ease-out` (Starts fast, slows down) ✅ RECOMMENDED

**Best for:**
- Elements entering the screen
- User-initiated interactions
- Modal/dialog openings
- Dropdown menus

| Variant | Cubic Bezier | When to Use |
|---------|--------------|-------------|
| `ease-out-quad` | `cubic-bezier(.25, .46, .45, .94)` | Subtle deceleration (default choice) |
| `ease-out-cubic` | `cubic-bezier(.215, .61, .355, 1)` | Moderate deceleration |
| `ease-out-quart` | `cubic-bezier(.165, .84, .44, 1)` | Strong deceleration |
| `ease-out-quint` | `cubic-bezier(.23, 1, .32, 1)` | Very strong deceleration |
| `ease-out-expo` | `cubic-bezier(.19, 1, .22, 1)` | Exponential deceleration |
| `ease-out-circ` | `cubic-bezier(.075, .82, .165, 1)` | Circular deceleration |

**Example:**
```css
.modal-enter {
  animation: fadeIn 0.3s cubic-bezier(.23, 1, .32, 1);
}
```

---

### 3. `ease-in-out` (Smooth acceleration and deceleration)

**Best for:**
- Elements moving within the screen
- Position changes
- Carousel transitions
- Swapping content

| Variant | Cubic Bezier | When to Use |
|---------|--------------|-------------|
| `ease-in-out-quad` | `cubic-bezier(.455, .03, .515, .955)` | Subtle smooth motion |
| `ease-in-out-cubic` | `cubic-bezier(.645, .045, .355, 1)` | Moderate smooth motion |
| `ease-in-out-quart` | `cubic-bezier(.77, 0, .175, 1)` | Strong smooth motion |
| `ease-in-out-quint` | `cubic-bezier(.86, 0, .07, 1)` | Very strong smooth motion |
| `ease-in-out-expo` | `cubic-bezier(1, 0, 0, 1)` | Exponential smooth motion |
| `ease-in-out-circ` | `cubic-bezier(.785, .135, .15, .86)` | Circular smooth motion |

**Example:**
```css
.carousel-slide {
  transition: transform 0.5s cubic-bezier(.645, .045, .355, 1);
}
```

---

## Hover Transitions

### Simple Hover Effects

For simple properties like `color`, `background-color`, `opacity`:

```css
.button {
  transition: background-color 200ms ease;
}

.button:hover {
  background-color: var(--color-primary);
}
```

**Rules:**
- Use built-in CSS `ease` easing
- Duration: **200ms**
- Properties: color, background-color, opacity, border-color

### Complex Hover Effects

For transforms, shadows, or multiple properties:

```css
.card {
  transition: all 300ms cubic-bezier(.23, 1, .32, 1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}
```

**Rules:**
- Use easing from the rules above
- Duration: **200-300ms**
- Fall back to easing rules for complex transitions

### Touch Device Optimization

**Disable hover transitions on touch devices:**

```css
@media (hover: hover) and (pointer: fine) {
  .button {
    transition: background-color 200ms ease;
  }
}
```

**Why?**
- Touch devices don't have true hover states
- Prevents animation lag on mobile
- Improves touch responsiveness

---

## Accessibility

### Respect `prefers-reduced-motion`

**Always disable transform animations** for users who prefer reduced motion:

```css
.animated-element {
  animation: slideIn 0.3s cubic-bezier(.23, 1, .32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
  }
}
```

**With Framer Motion:**

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: 0.3,
    ease: [0.23, 1, 0.32, 1]
  }}
/>
```

Framer Motion automatically respects `prefers-reduced-motion` by default.

### What to Disable

**Disable these animations:**
- ✅ `transform` (translate, scale, rotate)
- ✅ Large movement animations
- ✅ Parallax effects
- ✅ Continuous/infinite animations

**Keep these animations:**
- ✅ `opacity` fades
- ✅ Color transitions
- ✅ Essential loading indicators

---

## Origin-Aware Animations

**Elements should animate from their trigger point.**

### Dropdown Example

```tsx
// ❌ Bad - Always animates from top-left
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
/>

// ✅ Good - Animates from button position
<motion.div
  style={{ transformOrigin: 'top right' }} // Adjust based on trigger
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
/>
```

### Transform Origin Guide

| Trigger Position | Transform Origin |
|-----------------|------------------|
| Top Left | `top left` |
| Top Right | `top right` |
| Bottom Left | `bottom left` |
| Bottom Right | `bottom right` |
| Center | `center` |

**Example - Context Menu:**

```tsx
const getTransformOrigin = (position: 'top' | 'bottom', align: 'left' | 'right') => {
  return `${position} ${align}`;
};

<motion.div
  style={{ transformOrigin: getTransformOrigin('bottom', 'right') }}
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
/>
```

---

## Performance

### Use Hardware-Accelerated Properties

**✅ Animate these properties** (GPU accelerated):
- `opacity`
- `transform` (translate, scale, rotate)
- `filter` (with caution)

**❌ Avoid animating these** (CPU intensive):
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `border-width`

### Example: Moving Elements

```css
/* ❌ Bad - Not hardware accelerated */
.element {
  transition: left 0.3s ease-out;
  left: 0;
}
.element.moved {
  left: 100px;
}

/* ✅ Good - Hardware accelerated */
.element {
  transition: transform 0.3s ease-out;
  transform: translateX(0);
}
.element.moved {
  transform: translateX(100px);
}
```

### Blur Performance

**Do not animate blur values higher than 20px**

```css
/* ❌ Bad - Heavy performance cost */
.backdrop {
  backdrop-filter: blur(50px);
  transition: backdrop-filter 0.3s;
}

/* ✅ Good - Acceptable performance */
.backdrop {
  backdrop-filter: blur(10px);
  transition: backdrop-filter 0.3s;
}
```

### Using `will-change`

Use `will-change` to optimize animations, but **only for specific properties**:

```css
.animated-element {
  will-change: transform, opacity;
}
```

**Only use for:**
- `transform`
- `opacity`
- `clip-path`
- `filter` (use sparingly)

**⚠️ Warning:**
- Don't overuse `will-change` (memory intensive)
- Remove `will-change` after animation completes
- Don't use on more than 5-10 elements simultaneously

### CSS Variables in Animations

**❌ Do not animate drag gestures using CSS variables**

```tsx
// ❌ Bad - Not hardware accelerated
<motion.div
  drag
  style={{ '--x': x }} // CSS variable
/>

// ✅ Good - Hardware accelerated
<motion.div
  drag
  style={{ x }} // Framer Motion transform
/>
```

### Framer Motion Performance

**Use `transform` instead of `x`/`y` for hardware acceleration:**

```tsx
// ❌ Less performant
<motion.div
  animate={{ x: 100, y: 50 }}
/>

// ✅ More performant (when you need explicit control)
<motion.div
  animate={{ transform: 'translate(100px, 50px)' }}
/>

// ✅ Best - Let Framer Motion optimize
<motion.div
  animate={{ x: 100, y: 50 }} // Actually fine, Framer Motion optimizes this
/>
```

**Note:** Framer Motion already optimizes `x` and `y` to use transforms, so this is usually not necessary. Only use explicit `transform` if you need full control.

---

## Spring Animations

**Default to spring animations when using Framer Motion.**

### Basic Spring

```tsx
<motion.div
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: 'spring' }}
/>
```

### Spring Configuration

```tsx
// Gentle spring (default)
<motion.div
  animate={{ scale: 1 }}
  transition={{
    type: 'spring',
    stiffness: 300,
    damping: 20
  }}
/>

// Snappy spring
<motion.div
  animate={{ scale: 1 }}
  transition={{
    type: 'spring',
    stiffness: 500,
    damping: 30
  }}
/>

// Slow, smooth spring
<motion.div
  animate={{ scale: 1 }}
  transition={{
    type: 'spring',
    stiffness: 100,
    damping: 15
  }}
/>
```

### Bouncy Springs (Use Sparingly)

**Avoid bouncy springs unless working with drag gestures:**

```tsx
// ❌ Bad - Too bouncy for regular UI
<motion.div
  animate={{ scale: 1 }}
  transition={{
    type: 'spring',
    stiffness: 300,
    damping: 10 // Low damping = bouncy
  }}
/>

// ✅ Good - Appropriate for drag release
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300 }}
  transition={{
    type: 'spring',
    stiffness: 500,
    damping: 25
  }}
/>
```

### Spring vs Tween

| Animation Type | Use Spring | Use Tween |
|---------------|-----------|-----------|
| User interactions | ✅ | |
| Drag gestures | ✅ | |
| Modal open/close | ✅ | |
| Precise timing needed | | ✅ |
| Orchestrated sequences | | ✅ |
| Simple fades | | ✅ |

**Spring Example:**
```tsx
<motion.div
  animate={{ x: 100 }}
  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
/>
```

**Tween Example:**
```tsx
<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
/>
```

---

## Common Animation Patterns

### Modal/Dialog Opening

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
/>
```

### Dropdown Menu

```tsx
<motion.div
  style={{ transformOrigin: 'top right' }}
  initial={{ opacity: 0, scale: 0.95, y: -10 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: -10 }}
  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
/>
```

### List Item Stagger

```tsx
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }}
  initial="hidden"
  animate="show"
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Page Transition

```tsx
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 20 }}
  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
/>
```

---

## Quick Reference

### Animation Timing

| Use Case | Duration | Easing |
|----------|----------|--------|
| Simple hover | 200ms | `ease` |
| Modal open | 200-300ms | `ease-out-quint` |
| Dropdown | 150ms | `ease-out-cubic` |
| Page transition | 300ms | `ease-out-quart` |
| Toast notification | 250ms | `ease-out-cubic` |
| Drag gesture | Spring | `stiffness: 500, damping: 25` |

### Easing Quick Copy

```css
/* Most used - copy these */
--ease-out-cubic: cubic-bezier(.215, .61, .355, 1);
--ease-out-quint: cubic-bezier(.23, 1, .32, 1);
--ease-in-out-cubic: cubic-bezier(.645, .045, .355, 1);
```

### Accessibility Template

```css
.animated-element {
  animation: slideIn 0.3s var(--ease-out-cubic);
}

@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
  }
}
```

---

## Examples in Codebase

### Match Card Hover (src/features/matching/components/live-match/head-card.tsx)

```tsx
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
>
  {/* Card content */}
</motion.div>
```

### Match Dialog Open (src/features/matching/components/match-dialog/match-dialog.tsx)

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.2 }}
/>
```

---

## Related Documentation

- [Project Architecture](../system/project_architecture.md) - Tech stack & frameworks
- [README](../README.md) - Documentation index

---

**Last Updated:** 2025-10-15
