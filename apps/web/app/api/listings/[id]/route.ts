import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { listingUpdateSchema } from '@/lib/types/validation'
import { z } from 'zod'

const amenitiesSchema = z
  .array(z.string().min(1).max(50))
  .max(30, 'Cannot have more than 30 amenities')
  .optional()

/** PUT — Update a listing (owner only) */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params
  const supabase = await createClient()

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  // Verify listing exists and check ownership
  const { data: existing, error: fetchError } = await supabase
    .from('listings')
    .select('landlord_id, status')
    .eq('id', listingId)
    .single()

  if (fetchError || !existing) {
    return errorResponse('Listing not found', 404)
  }

  if (existing.status === 'deleted') {
    return errorResponse('Cannot update a deleted listing', 410)
  }

  if (existing.landlord_id !== user.id) {
    return errorResponse('You do not have permission to update this listing', 403)
  }

  // Parse and validate request body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON body', 400)
  }

  const { amenities, ...listingFields } = body
  const result = listingUpdateSchema.safeParse(listingFields)

  if (!result.success) {
    return errorResponse(
      result.error.issues.map((i) => i.message).join('; '),
      400,
      'VALIDATION_ERROR'
    )
  }

  // Validate amenities separately if provided
  const amenitiesResult = amenitiesSchema.safeParse(amenities)
  if (!amenitiesResult.success) {
    return errorResponse(
      amenitiesResult.error.issues.map((i) => i.message).join('; '),
      400,
      'VALIDATION_ERROR'
    )
  }

  // Update listing fields (only if there are fields to update)
  const hasListingFields = Object.keys(result.data).length > 0
  let updatedListing = null

  if (hasListingFields) {
    const { data, error } = await supabase
      .from('listings')
      .update(result.data)
      .eq('id', listingId)
      .select()
      .single()

    if (error) {
      return errorResponse(error.message, 500)
    }
    updatedListing = data
  }

  // Update amenities if provided
  if (amenitiesResult.data) {
    // Remove existing amenities
    const { error: deleteError } = await supabase
      .from('listing_amenities')
      .delete()
      .eq('listing_id', listingId)

    if (deleteError) {
      return errorResponse(deleteError.message, 500)
    }

    // Insert new amenities
    if (amenitiesResult.data.length > 0) {
      const amenityRows = amenitiesResult.data.map((amenity) => ({
        listing_id: listingId,
        amenity,
      }))

      const { error: insertError } = await supabase
        .from('listing_amenities')
        .insert(amenityRows)

      if (insertError) {
        return errorResponse(insertError.message, 500)
      }
    }
  }

  // Fetch the final listing with amenities to return
  if (!updatedListing) {
    const { data, error } = await supabase
      .from('listings')
      .select()
      .eq('id', listingId)
      .single()

    if (error) {
      return errorResponse(error.message, 500)
    }
    updatedListing = data
  }

  // Fetch amenities for the response
  const { data: currentAmenities } = await supabase
    .from('listing_amenities')
    .select('amenity')
    .eq('listing_id', listingId)

  return successResponse({
    ...updatedListing,
    amenities: (currentAmenities || []).map((a) => a.amenity),
  })
}

/** DELETE — Soft-delete a listing (owner only) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params
  const supabase = await createClient()

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Unauthorized', 401)
  }

  // Verify listing exists and check ownership
  const { data: existing, error: fetchError } = await supabase
    .from('listings')
    .select('landlord_id, status')
    .eq('id', listingId)
    .single()

  if (fetchError || !existing) {
    return errorResponse('Listing not found', 404)
  }

  if (existing.status === 'deleted') {
    return errorResponse('Listing is already deleted', 410)
  }

  if (existing.landlord_id !== user.id) {
    return errorResponse('You do not have permission to delete this listing', 403)
  }

  // Soft-delete: mark status as 'deleted'
  const { data: deletedListing, error: deleteError } = await supabase
    .from('listings')
    .update({ status: 'deleted' })
    .eq('id', listingId)
    .select()
    .single()

  if (deleteError) {
    return errorResponse(deleteError.message, 500)
  }

  // Clean up related data: remove favorites for this listing
  await supabase
    .from('user_favorites')
    .delete()
    .eq('listing_id', listingId)

  // Clean up amenities
  await supabase
    .from('listing_amenities')
    .delete()
    .eq('listing_id', listingId)

  return successResponse({
    ...deletedListing,
    message: 'Listing has been deleted',
  })
}
