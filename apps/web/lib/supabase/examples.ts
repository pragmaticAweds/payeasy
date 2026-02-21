/**
 * @file examples.ts
 * @description Complete examples demonstrating Supabase client usage patterns.
 */

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT-SIDE EXAMPLES (React Components)
// ═══════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────
// Example 1: Basic Data Fetching with useQuery
// ──────────────────────────────────────────────────────────────────────────

/*
'use client'

import { useQuery } from '@/hooks'
import type { ListingWithLandlord } from '@/lib/types'

export function ListingsGrid() {
  const { data: listings, loading, error, refetch } = useQuery<ListingWithLandlord[]>(
    (supabase) =>
      supabase
        .from('listings')
        .select(`
          *,
          landlord:users(id, username, avatar_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20)
  )

  if (loading) {
    return <div className="grid grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => <ListingSkeleton key={i} />)}
    </div>
  }

  if (error) {
    return (
      <div className="error">
        <p>Failed to load listings: {error.message}</p>
        <button onClick={refetch}>Try Again</button>
      </div>
    )
  }

  if (!listings || listings.length === 0) {
    return <div>No listings found</div>
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
*/

// ──────────────────────────────────────────────────────────────────────────
// Example 2: Creating Data with useMutation
// ──────────────────────────────────────────────────────────────────────────

/*
'use client'

import { useMutation } from '@/hooks'
import { listingInsertSchema, type ListingInsertInput } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CreateListingForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<ListingInsertInput>>({})

  const { mutate: createListing, loading, error } = useMutation(
    (supabase, data: ListingInsertInput) =>
      supabase
        .from('listings')
        .insert(data)
        .select(`*, landlord:users(*)`)
        .single(),
    {
      onSuccess: (listing) => {
        console.log('✅ Listing created:', listing)
        router.push(`/listings/${listing.id}`)
      },
      onError: (error) => {
        console.error('❌ Failed to create listing:', error)
      }
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form data
    const result = listingInsertSchema.safeParse(formData)
    if (!result.success) {
      alert('Invalid form data: ' + result.error.message)
      return
    }

    await createListing(result.data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Title"
        value={formData.title || ''}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
      
      <textarea
        placeholder="Description"
        value={formData.description || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Listing'}
      </button>

      {error && <div className="error">{error.message}</div>}
    </form>
  )
}
*/

// ──────────────────────────────────────────────────────────────────────────
// Example 3: Authentication with useAuth
// ──────────────────────────────────────────────────────────────────────────

/*
'use client'

import { useAuth } from '@/hooks'

export function UserMenu() {
  const { user, session, loading, signOut } = useAuth()

  if (loading) {
    return <div className="skeleton h-10 w-32" />
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <Link href="/login">Log In</Link>
        <Link href="/signup">Sign Up</Link>
      </div>
    )
  }

  return (
    <div className="dropdown">
      <button>{user.email}</button>
      <ul className="dropdown-menu">
        <li><Link href="/profile">Profile</Link></li>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><button onClick={signOut}>Sign Out</button></li>
      </ul>
    </div>
  )
}
*/

// ──────────────────────────────────────────────────────────────────────────
// Example 4: Protected Page with useRequireAuth
// ──────────────────────────────────────────────────────────────────────────

/*
'use client'

import { useRequireAuth } from '@/hooks'

export default function DashboardPage() {
  const { user, loading } = useRequireAuth('/login')

  if (loading) {
    return <div>Loading...</div>
  }

  // User is guaranteed to exist here
  return (
    <div>
      <h1>Welcome to your dashboard, {user!.email}</h1>
      <DashboardContent userId={user!.id} />
    </div>
  )
}
*/

// ──────────────────────────────────────────────────────────────────────────
// Example 5: Real-time Subscription
// ──────────────────────────────────────────────────────────────────────────

/*
'use client'

import { useSupabase } from '@/hooks'
import { useEffect, useState } from 'react'
import type { Message } from '@/lib/types'

export function MessageList({ conversationId }: { conversationId: string }) {
  const supabase = useSupabase()
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
    }

    fetchMessages()

    // Subscribe to new messages
    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, conversationId])

  return (
    <div className="messages">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  )
}
*/

// ═══════════════════════════════════════════════════════════════════════════
// SERVER-SIDE EXAMPLES (Server Components & API Routes)
// ═══════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────
// Example 6: Server Component with User-Scoped Client
// ──────────────────────────────────────────────────────────────────────────

/*
import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function MyListingsPage() {
  const supabase = await createServerClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Query respects RLS - only returns listings for current user
  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('landlord_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return <div>Error loading listings: {error.message}</div>
  }

  return (
    <div>
      <h1>My Listings</h1>
      {listings?.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
*/

// ──────────────────────────────────────────────────────────────────────────
// Example 7: API Route with Error Handling
// ──────────────────────────────────────────────────────────────────────────

/*
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, handleSupabaseQuery, handleSupabaseMutation } from '@/lib/supabase'
import { listingInsertSchema } from '@/lib/types'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get('status') || 'active'

  const supabase = await createServerClient()

  // Use error handling wrapper
  const [listings, error] = await handleSupabaseQuery(
    supabase
      .from('listings')
      .select('*, landlord:users(*)')
      .eq('status', status)
  )

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: listings })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Validate request body
  const body = await req.json()
  const result = listingInsertSchema.safeParse({
    ...body,
    landlord_id: user.id
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    )
  }

  // Use mutation wrapper (throws on error)
  try {
    const listing = await handleSupabaseMutation(
      supabase
        .from('listings')
        .insert(result.data)
        .select()
        .single()
    )

    return NextResponse.json({ data: listing }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
*/

// ──────────────────────────────────────────────────────────────────────────
// Example 8: Admin Operations with Service Role
// ──────────────────────────────────────────────────────────────────────────

/*
import { getAdminClient, handleSupabaseMutation } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// ⚠️ IMPORTANT: This endpoint should have proper authorization checks!
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // TODO: Add admin authorization check here
  const isAdmin = await checkIfUserIsAdmin(req)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = getAdminClient()

  try {
    // Admin client bypasses RLS - can delete any listing
    await handleSupabaseMutation(
      admin
        .from('listings')
        .delete()
        .eq('id', params.id)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
*/

// ──────────────────────────────────────────────────────────────────────────
// Example 9: Batch Operations with Transactions
// ──────────────────────────────────────────────────────────────────────────

/*
import { getAdminClient } from '@/lib/supabase'
import type { ListingInsert, RentAgreementInsert } from '@/lib/types'

export async function createListingWithAgreement(
  listing: ListingInsert,
  agreement: RentAgreementInsert
) {
  const admin = getAdminClient()

  try {
    // Insert listing
    const { data: newListing, error: listingError } = await admin
      .from('listings')
      .insert(listing)
      .select()
      .single()

    if (listingError) throw listingError

    // Insert rent agreement
    const { data: newAgreement, error: agreementError } = await admin
      .from('rent_agreements')
      .insert({
        ...agreement,
        listing_id: newListing.id
      })
      .select()
      .single()

    if (agreementError) {
      // Rollback: delete the listing
      await admin.from('listings').delete().eq('id', newListing.id)
      throw agreementError
    }

    return { listing: newListing, agreement: newAgreement }
  } catch (error) {
    console.error('Transaction failed:', error)
    throw error
  }
}
*/

// ──────────────────────────────────────────────────────────────────────────
// Example 10: File Upload with Storage
// ──────────────────────────────────────────────────────────────────────────

/*
'use client'

import { useSupabase } from '@/hooks'
import { useState } from 'react'

export function AvatarUpload({ userId }: { userId: string }) {
  const supabase = useSupabase()
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      alert('Avatar uploaded successfully!')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  )
}
*/

export {}
