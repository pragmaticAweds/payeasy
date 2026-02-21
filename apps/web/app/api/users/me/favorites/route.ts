import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/api-utils'

/** GET — Return all of the authenticated user's favorite listings */
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .select('*, listings(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return errorResponse(error.message, 400)
  }

  return successResponse(data)
}
