import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/live-matches')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/live-matches"!</div>
}
