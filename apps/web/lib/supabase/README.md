# Supabase Setup

Complete Supabase client library setup for PayEasy with TypeScript type safety, error handling, and React hooks.

## 📁 Structure

```
lib/supabase/
├── client.ts       # Client-side Supabase client (browser)
├── server.ts       # Server-side clients (API routes, Server Components)
├── middleware.ts   # Next.js middleware helpers
├── errors.ts       # Error handling utilities
└── index.ts        # Barrel exports

hooks/
├── useSupabase.ts  # Access Supabase client in React
├── useAuth.ts      # Authentication state and operations
├── useQuery.ts     # Data fetching with loading/error states
├── useMutation.ts  # Mutations (insert/update/delete)
└── index.ts        # Barrel exports
```

## 🔧 Installation

The required package is already installed:
```json
{
  "@supabase/supabase-js": "^2.97.0",
  "@supabase/ssr": "^0.8.0"
}
```

## 🔑 Environment Variables

Required environment variables (add to `.env.local`):

```bash
# Public (client-side accessible)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Private (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 Quick Start

### Client Components (Browser)

```tsx
'use client'

import { useSupabase } from '@/hooks'

export function MyComponent() {
  const supabase = useSupabase()

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
      
      if (error) {
        console.error('Failed to fetch:', error)
        return
      }
      
      setListings(data) // data is typed as Listing[]
    }
    
    fetchListings()
  }, [supabase])

  return <div>...</div>
}
```

### Server Components

```tsx
import { createServerClient } from '@/lib/supabase'

export default async function ListingsPage() {
  const supabase = await createServerClient()
  
  // Query respects RLS based on user's session from cookies
  const { data: listings } = await supabase
    .from('listings')
    .select('*, landlord:users(*)')
    .eq('status', 'active')

  return (
    <div>
      {listings?.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
```

### API Routes

```ts
import { NextResponse } from 'next/server'
import { createServerClient, getAdminClient, handleSupabaseQuery } from '@/lib/supabase'
import { listingInsertSchema } from '@/lib/types'

export async function GET() {
  // User-scoped client (respects RLS)
  const supabase = await createServerClient()
  
  const [listings, error] = await handleSupabaseQuery(
    supabase.from('listings').select()
  )
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ data: listings })
}

export async function POST(req: Request) {
  // Validate request body
  const body = await req.json()
  const result = listingInsertSchema.safeParse(body)
  
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  
  // Admin client (bypasses RLS - use with caution!)
  const admin = getAdminClient()
  
  const { data, error } = await admin
    .from('listings')
    .insert(result.data)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}
```

## 🎣 React Hooks

### useAuth - Authentication State

```tsx
'use client'

import { useAuth } from '@/hooks'

export function ProfilePage() {
  const { user, session, loading, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### useQuery - Data Fetching

```tsx
'use client'

import { useQuery } from '@/hooks'

export function ListingsPage() {
  const { data: listings, loading, error, refetch } = useQuery(
    (supabase) => 
      supabase
        .from('listings')
        .select('*, landlord:users(*)')
        .eq('status', 'active')
  )

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {listings?.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
```

### useMutation - Create/Update/Delete

```tsx
'use client'

import { useMutation } from '@/hooks'
import type { ListingInsert } from '@/lib/types'

export function CreateListingForm() {
  const { mutate: createListing, loading, error } = useMutation(
    (supabase, listing: ListingInsert) =>
      supabase.from('listings').insert(listing).select().single(),
    {
      onSuccess: (data) => {
        console.log('Created listing:', data)
        router.push(`/listings/${data.id}`)
      },
      onError: (error) => {
        console.error('Failed to create listing:', error)
      }
    }
  )

  const handleSubmit = async (listing: ListingInsert) => {
    await createListing(listing)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Listing'}
      </button>
      {error && <div className="error">{error.message}</div>}
    </form>
  )
}
```

### useRequireAuth - Protect Client Pages

```tsx
'use client'

import { useRequireAuth } from '@/hooks'

export function ProtectedPage() {
  const { user, loading } = useRequireAuth('/login')

  if (loading) return <div>Loading...</div>
  
  // User is guaranteed to be authenticated here
  return <div>Protected content for {user!.email}</div>
}
```

## 🛡️ Error Handling

### Pattern 1: Tuple Destructuring

```ts
import { handleSupabaseQuery } from '@/lib/supabase'

const [listings, error] = await handleSupabaseQuery(
  supabase.from('listings').select()
)

if (error) {
  console.error('Failed to fetch listings:', error.message)
  return
}

// TypeScript knows listings is not null here
console.log(listings)
```

### Pattern 2: Try/Catch with Mutations

```ts
import { handleSupabaseMutation, SupabaseError } from '@/lib/supabase'

try {
  const listing = await handleSupabaseMutation(
    supabase.from('listings').insert(newListing).select().single()
  )
  console.log('Created listing:', listing)
} catch (error) {
  if (error instanceof SupabaseError) {
    console.error('Database error:', error.message)
    // Access error details
    console.error('Code:', error.code)
    console.error('Details:', error.details)
  }
}
```

### Pattern 3: Error Type Checks

```ts
import { isNotFoundError, isPermissionError, isDuplicateError } from '@/lib/supabase'

const { data, error } = await supabase.from('listings').select().eq('id', id).single()

if (error) {
  if (isNotFoundError(error)) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }
  if (isPermissionError(error)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }
  if (isDuplicateError(error)) {
    return NextResponse.json({ error: 'Listing already exists' }, { status: 409 })
  }
  
  return NextResponse.json({ error: error.message }, { status: 500 })
}
```

## 🚪 Middleware (Route Protection)

Create `middleware.ts` in the app root:

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  
  // Refresh session if expired
  await supabase.auth.getSession()
  
  return response
}

// Match all routes except static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Protect Specific Routes

```ts
import { requireAuth } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Protect these routes
  return await requireAuth(request, ['/dashboard', '/profile', '/api/protected'])
}
```

### Redirect If Already Authenticated

```ts
import { redirectIfAuthenticated } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Redirect authenticated users away from login/signup
  return await redirectIfAuthenticated(request, ['/login', '/signup'], '/dashboard')
}
```

## 🔐 Type Safety

All clients are fully typed with the `Database` interface:

```ts
import type { Database } from '@/lib/types/database'
import { getSupabaseClient } from '@/lib/supabase'

const supabase = getSupabaseClient()

// ✅ Full autocomplete and type checking
const { data } = await supabase
  .from('listings')              // ✅ Autocomplete for table names
  .select('*, landlord:users(*)') // ✅ Autocomplete for columns
  .eq('status', 'active')        // ✅ Only valid status values allowed

// data is typed as:
// (Listing & { landlord: User })[] | null
```

## ⚡ Performance Tips

1. **Use singleton clients** - `getSupabaseClient()` and `getAdminClient()` reuse instances
2. **Connection pooling** - Admin client uses a singleton pattern to avoid creating multiple connections
3. **PKCE flow** - Client uses PKCE for better security and automatic session refresh
4. **SSR integration** - Uses `@supabase/ssr` for optimal Next.js App Router integration

## 🧪 Testing

Reset client instances between tests:

```ts
import { resetClientInstance, resetAdminClientInstance } from '@/lib/supabase'

afterEach(() => {
  resetClientInstance()
  resetAdminClientInstance()
})
```

## 📚 Additional Resources

- [Supabase JS Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Next.js App Router with Supabase](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated:** February 20, 2026  
**Package Version:** @supabase/supabase-js v2.97.0
