import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/api-utils'

/** POST — Add a listing to the authenticated user's favorites */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  // Verify the listing exists
  const { data: listing } = await supabase
    .from('listings')
    .select('id')
    .eq('id', listingId)
    .single()

  if (!listing) {
    return errorResponse('Listing not found', 404)
  }

  const { error } = await supabase.from('user_favorites').insert({
    user_id: user.id,
    listing_id: listingId,
  })

  if (error) {
    // Unique constraint violation — already favorited
    if (error.code === '23505') {
      return errorResponse('Already favorited', 409, '23505')
    }
    return errorResponse(error.message, 400)
  }

  return successResponse({ favorited: true, listing_id: listingId }, 201)
}

/** DELETE — Remove a listing from the authenticated user's favorites */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', listingId)

  if (error) {
    return errorResponse(error.message, 400)
  }

  return successResponse({ favorited: false, listing_id: listingId })
}
