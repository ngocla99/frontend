import { createFileRoute } from '@tanstack/react-router'
import { LiveMatch } from '@/features/matching/components/live-match/live-match'

export const Route = createFileRoute('/_authenticated/live-matches')({
  component: RouteComponent,
})

function RouteComponent() {
  return <LiveMatch />
}
