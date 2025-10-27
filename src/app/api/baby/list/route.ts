import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/middleware/error-handler'

/**
 * GET /api/baby/list - List user's baby images
 *
 * Query params:
 *   - user_id: Filter by user (optional, defaults to current user)
 *   - limit: Number of results (default: 20)
 *   - skip: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = searchParams.get('user_id') || user.id
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = parseInt(searchParams.get('skip') || '0')

    // Get babies where user is either parent
    const { data: babies, error: babiesError } = await supabase
      .from('babies')
      .select(`
        id,
        match_id,
        image_url,
        created_at,
        parent_a:profiles!babies_parent_a_id_fkey (
          id,
          name,
          gender
        ),
        parent_b:profiles!babies_parent_b_id_fkey (
          id,
          name,
          gender
        ),
        match:matches (
          id,
          similarity_score
        )
      `)
      .or(`parent_a_id.eq.${userId},parent_b_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1)

    if (babiesError) {
      throw babiesError
    }

    const formattedBabies = (babies || []).map((baby) => ({
      id: baby.id,
      match_id: baby.match_id,
      image_url: baby.image_url,
      created_at: baby.created_at,
      similarity_score: baby.match?.similarity_score,
      parents: {
        a: baby.parent_a,
        b: baby.parent_b,
      },
    }))

    return NextResponse.json({
      babies: formattedBabies,
      total: formattedBabies.length,
      skip,
      limit,
    })

  } catch (error) {
    return handleApiError(error)
  }
}
