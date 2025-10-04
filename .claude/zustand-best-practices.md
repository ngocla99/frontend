# Zustand Best Practices Guide

A comprehensive guide to best practices for using Zustand state management in React applications (2025).

---

## Table of Contents

1. [Core Best Practices](#core-best-practices)
2. [TypeScript Patterns](#typescript-patterns)
3. [Store Organization](#store-organization)
4. [Persist Middleware](#persist-middleware)
5. [Performance Optimization](#performance-optimization)
6. [Common Pitfalls](#common-pitfalls)

---

## Core Best Practices

### 1. Only Export Custom Hooks

**✅ DO:**
```typescript
// Store file
const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))

// Export custom hooks with selectors
export const useBears = () => useBearStore((state) => state.bears)
export const useIncrease = () => useBearStore((state) => state.increase)
```

**❌ DON'T:**
```typescript
// Don't export the raw store
export const useBearStore = create(...)

// Don't subscribe to entire store
const { bears, increase } = useBearStore()
```

**Benefits:**
- Prevents accidentally subscribing to the entire store
- Provides a cleaner interface for consuming state
- Reduces unnecessary re-renders

---

### 2. Prefer Atomic Selectors

**✅ DO:**
```typescript
// Return individual values
export const useBears = () => useBearStore((state) => state.bears)
export const useFishes = () => useBearStore((state) => state.fishes)
```

**❌ DON'T:**
```typescript
// Don't return objects unless necessary
export const useAnimals = () => useBearStore((state) => ({
  bears: state.bears,
  fishes: state.fishes
}))
```

**Why:** Individual selectors optimize rendering performance by only triggering re-renders when specific values change.

---

### 3. Separate Actions from State

**✅ DO:**
```typescript
interface StoreState {
  // State
  user: User | null
  count: number

  // Actions
  actions: {
    setUser: (user: User) => void
    increment: () => void
    reset: () => void
  }
}

const useStore = create<StoreState>()((set) => ({
  user: null,
  count: 0,

  actions: {
    setUser: (user) => set({ user }),
    increment: () => set((state) => ({ count: state.count + 1 })),
    reset: () => set({ user: null, count: 0 }),
  },
}))

// Export actions as single hook
export const useStoreActions = () => useStore((state) => state.actions)
```

**Benefits:**
- Actions remain static and don't impact performance
- Clear separation between data and behavior
- Easy to expose all actions via a single hook

---

### 4. Model Actions as Events, Not Setters

**✅ DO:**
```typescript
// Keep business logic inside the store
const useStore = create<StoreState>()((set, get) => ({
  items: [],
  total: 0,

  actions: {
    addItem: (item: Item) => set((state) => ({
      items: [...state.items, item],
      total: state.total + item.price,
    })),

    checkout: async () => {
      const { items, total } = get()
      await api.createOrder({ items, total })
      set({ items: [], total: 0 })
    },
  },
}))
```

**❌ DON'T:**
```typescript
// Don't use simple setters
const useStore = create<StoreState>()((set) => ({
  items: [],
  setItems: (items) => set({ items }), // Too simple, no business logic
}))
```

**Why:** Actions should describe what happened, not just set values. Keep business logic centralized in the store.

---

### 5. Keep Store Scope Small

**✅ DO:**
```typescript
// Multiple small, focused stores
const useAuthStore = create<AuthState>()(...)
const useCartStore = create<CartState>()(...)
const useUIStore = create<UIState>()(...)

// Combine using custom hooks if needed
const useCheckout = () => {
  const user = useAuthStore((state) => state.user)
  const items = useCartStore((state) => state.items)
  const checkout = useCartStore((state) => state.actions.checkout)

  return { user, items, checkout }
}
```

**Benefits:**
- Easier to maintain and test
- Better code organization
- Can be easily integrated with other hooks

---

## TypeScript Patterns

### Basic Type Declaration

Use the curried syntax `create<T>()()` to properly annotate state types:

```typescript
interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))
```

---

### Middleware with TypeScript

Annotate middlewares immediately inside `create`:

```typescript
const useBearStore = create<BearState>()(
  devtools(
    persist(
      (set) => ({
        bears: 0,
        increase: (by) => set((state) => ({ bears: state.bears + by })),
      }),
      { name: 'bearStore' }
    )
  )
)
```

**Important:** Place `devtools` as the last middleware to ensure proper type inference.

---

### Type Inference with `combine`

Use the `combine` middleware to infer state types without explicit annotation:

```typescript
const useBearStore = create(
  combine(
    { bears: 0 }, // State
    (set) => ({ // Actions
      increase: (by: number) => set((state) => ({ bears: state.bears + by })),
    })
  )
)
```

---

### Slices Pattern with TypeScript

```typescript
interface BearSlice {
  bears: number
  addBear: () => void
}

interface FishSlice {
  fishes: number
  addFish: () => void
}

const createBearSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  BearSlice
> = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
})

const createFishSlice: StateCreator<
  BearSlice & FishSlice,
  [],
  [],
  FishSlice
> = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
})

const useBoundStore = create<BearSlice & FishSlice>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}))
```

---

## Store Organization

### The Slices Pattern

Divide your main store into smaller individual stores for better modularity:

```typescript
// bearSlice.ts
export const createBearSlice = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
})

// fishSlice.ts
export const createFishSlice = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
})

// store.ts
export const useBoundStore = create((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}))
```

---

### Updating Multiple Stores

You can create methods that update multiple slices simultaneously:

```typescript
export const createBearFishSlice = (set, get) => ({
  addBearAndFish: () => {
    get().addBear()
    get().addFish()
  },
})
```

---

### Adding Middlewares to Slices

**✅ DO:** Apply middlewares at the combined store level:

```typescript
export const useBoundStore = create(
  persist(
    (...a) => ({
      ...createBearSlice(...a),
      ...createFishSlice(...a),
    }),
    { name: 'bound-store' }
  )
)
```

**❌ DON'T:** Apply middlewares inside individual slices (can cause issues).

---

## Persist Middleware

### Basic Usage

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      token: '',
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage', // Storage key
      storage: createJSONStorage(() => localStorage), // Default
    }
  )
)
```

---

### Don't Persist Functions/Actions

**✅ DO:** Use `partialize` to persist only data:

```typescript
const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      count: 0,

      actions: {
        setUser: (user) => set({ user }),
        increment: () => set((state) => ({ count: state.count + 1 })),
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        user: state.user,
        count: state.count,
        // Don't persist actions
      }),
    }
  )
)
```

**Why:** Persisting functions can cause issues during deployments when code changes.

---

### Storage Options

```typescript
// localStorage (default)
storage: createJSONStorage(() => localStorage)

// sessionStorage
storage: createJSONStorage(() => sessionStorage)

// AsyncStorage (React Native)
import AsyncStorage from '@react-native-async-storage/async-storage'
storage: createJSONStorage(() => AsyncStorage)

// Custom storage
storage: createJSONStorage(() => customStorage)
```

---

### Partialize Options

**Include only specific fields:**
```typescript
partialize: (state) => ({
  user: state.user,
  preferences: state.preferences
})
```

**Exclude specific fields:**
```typescript
partialize: (state) =>
  Object.fromEntries(
    Object.entries(state).filter(([key]) => !['tempData'].includes(key))
  )
```

---

### Hydration Handling

With async storage, the store won't be hydrated at initial render:

```typescript
const useStore = create(
  persist(
    (set) => ({ ... }),
    {
      name: 'storage',
      onRehydrateStorage: () => (state) => {
        console.log('Hydration finished')
      },
    }
  )
)

// Wait for hydration
const hasHydrated = useStore.persist.hasHydrated()
```

---

## Performance Optimization

### 1. Use Selectors Everywhere

**✅ DO:**
```typescript
// Even for single values
const bears = useBearStore((state) => state.bears)
```

**Why:** Ensures only components using that specific value re-render when it changes.

---

### 2. Shallow Comparison for Objects

If you must return objects, use shallow comparison:

```typescript
import { shallow } from 'zustand/shallow'

const { bears, fishes } = useBoundStore(
  (state) => ({ bears: state.bears, fishes: state.fishes }),
  shallow
)
```

---

### 3. Memoize Complex Selectors

```typescript
import { useMemo } from 'react'

const useExpensiveData = () => {
  const data = useStore((state) => state.data)
  return useMemo(() => processData(data), [data])
}
```

---

## Common Pitfalls

### ❌ Never Mutate State Directly

```typescript
// DON'T
const useStore = create((set, get) => ({
  items: [],
  addItem: (item) => {
    get().items.push(item) // ❌ Direct mutation
  },
}))

// DO
const useStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item] // ✅ New array
  })),
}))
```

---

### ❌ Don't Define Stores Inside Components

```typescript
// DON'T
function MyComponent() {
  const useStore = create(...) // ❌ Re-created on every render
  return <div>...</div>
}

// DO
const useStore = create(...) // ✅ Outside component

function MyComponent() {
  const data = useStore((state) => state.data)
  return <div>...</div>
}
```

---

### ❌ Avoid Over-Subscribing

```typescript
// DON'T - subscribes to entire store
const store = useStore()

// DO - subscribe to specific values
const user = useStore((state) => state.user)
const count = useStore((state) => state.count)
```

---

### ❌ Don't Use Interactive Git Commands

When working with stores in version control, avoid interactive commands:

```bash
# DON'T
git add -i

# DO
git add src/stores/
```

**Why:** Interactive commands aren't supported in automated environments.

---

## When to Choose Zustand

Zustand is ideal for:
- ✅ Small to medium-sized applications
- ✅ Projects needing simple, flexible state management
- ✅ Teams wanting minimal boilerplate
- ✅ Applications requiring good performance with minimal effort

Consider alternatives when:
- ❌ Building large enterprise applications (Redux might be better)
- ❌ Need complex time-travel debugging
- ❌ Require strict architectural patterns

---

## Summary Checklist

- [ ] Use custom hooks with selectors, not raw store exports
- [ ] Prefer atomic selectors over object selectors
- [ ] Separate actions from state (use `actions` object)
- [ ] Model actions as events with business logic
- [ ] Keep stores small and focused
- [ ] Use TypeScript with curried syntax `create<T>()()`
- [ ] Apply middlewares at the combined store level
- [ ] Don't persist functions, only data (use `partialize`)
- [ ] Always use selectors, even for single values
- [ ] Never mutate state directly
- [ ] Don't define stores inside components
- [ ] Place `devtools` middleware last

---

## Additional Resources

- [Official Zustand Documentation](https://zustand.docs.pmnd.rs)
- [TkDodo's Blog: Working with Zustand](https://tkdodo.eu/blog/working-with-zustand)
- [TypeScript Guide](https://zustand.docs.pmnd.rs/guides/typescript)
- [Persist Middleware](https://zustand.docs.pmnd.rs/middlewares/persist)
- [Slices Pattern](https://zustand.docs.pmnd.rs/guides/slices-pattern)

---

**Last Updated:** January 2025
