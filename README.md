# AI Matching

This is a Next.js application for the AI Matching platform.

# Getting Started

To run this application in development mode:

```bash
bun install
bun run dev
```

The application will start on [http://localhost:3000](http://localhost:3000).

# Building For Production

To build this application for production:

```bash
bun run build
```

To run the production build:

```bash
bun run start
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
bun run test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.



## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpx shadcn@latest add button
```



## Routing

This project uses [Next.js App Router](https://nextjs.org/docs/app). Routes are file-system based in the `src/app` directory.

### Adding A Route

To add a new route, create a new folder in `src/app` with a `page.tsx` file:

```
src/app/about/page.tsx
```

### Adding Links

Use Next.js `Link` component for navigation:

```tsx
import Link from "next/link";

<Link href="/about">About</Link>
```

More information can be found in the [Next.js Routing documentation](https://nextjs.org/docs/app/building-your-application/routing).


## Data Fetching

This project uses [TanStack Query (React Query)](https://tanstack.com/query/latest) for data fetching and state management.

### Using React Query

The QueryClient is already configured in the app. Use `useQuery` to fetch data:

```tsx
import { useQuery } from "@tanstack/react-query";

function Component() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["people"],
    queryFn: () =>
      fetch("https://swapi.dev/api/people")
        .then((res) => res.json())
        .then((data) => data.results as { name: string }[]),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  );
}
```

More information can be found in the [React Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview).

## State Management

This project uses [Zustand](https://zustand.docs.pmnd.rs/) for state management.

### Using Zustand

Create a store in `src/stores`:

```tsx
import { create } from 'zustand';

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

Use the store in your components:

```tsx
function Counter() {
  const { count, increment } = useCounterStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

More information can be found in the [Zustand documentation](https://zustand.docs.pmnd.rs/).

## API Integration

This project uses [Supabase](https://supabase.com/) for backend services and authentication.

### Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DEV_ALLOW_NON_EDU_EMAILS=true  # Set false in production
```

See `.env.example` for complete list of required environment variables.

# Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand.docs.pmnd.rs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
