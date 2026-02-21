# Supabase Quick Reference

One-page cheat sheet for common Supabase operations in PayEasy.

## 📦 Imports

```ts
// Client-side (React components)
import { useSupabase, useAuth, useQuery, useMutation } from '@/hooks'

// Server-side (API routes, Server Components)
import { createServerClient, getAdminClient, getCurrentUser } from '@/lib/supabase'

// Error handling
import { handleSupabaseQuery, SupabaseError, isNotFoundError } from '@/lib/supabase'

// Types
import type { User, Listing, Database } from '@/lib/types'
```

## 🔐 Authentication

### Get Current User (Client)
```tsx
const { user, loading, signOut } = useAuth()
```

### Get Current User (Server)
```ts
const user = await getCurrentUser()
```

### Sign Out
```tsx
const { signOut } = useAuth()
await signOut()
```

## 📖 Reading Data

### Client Component
```tsx
const { data, loading, error, refetch } = useQuery(
  (supabase) => supabase.from('listings').select('*')
)
```

### Server Component
```ts
const supabase = await createServerClient()
const { data } = await supabase.from('listings').select('*')
```

### With Relations
```ts
const { data } = await supabase
  .from('listings')
  .select(`
    *,
    landlord:users(id, username, avatar_url),
    amenities:listing_amenities(amenity)
  `)
```

### Filters
```ts
.eq('status', 'active')           // WHERE status = 'active'
.neq('id', userId)                // WHERE id != userId
.gt('rent_xlm', 1000)             // WHERE rent_xlm > 1000
.gte('bedrooms', 2)               // WHERE bedrooms >= 2
.lt('created_at', date)           // WHERE created_at < date
.lte('rent_xlm', 5000)            // WHERE rent_xlm <= 5000
.like('title', '%apartment%')     // WHERE title LIKE '%apartment%'
.in('status', ['active', 'draft']) // WHERE status IN (...)
.is('deleted_at', null)           // WHERE deleted_at IS NULL
```

### Ordering & Limiting
```ts
.order('created_at', { ascending: false })
.limit(20)
.range(0, 9)  // Pagination: items 0-9
```

### Single Row
```ts
const { data } = await supabase
  .from('listings')
  .select('*')
  .eq('id', listingId)
  .single()  // Expects exactly 1 row
```

## ✏️ Writing Data

### Insert (Client)
```tsx
const { mutate: createListing } = useMutation(
  (supabase, data: ListingInsert) =>
    supabase.from('listings').insert(data).select().single()
)

await createListing(newListing)
```

### Insert (Server)
```ts
const { data, error } = await supabase
  .from('listings')
  .insert(newListing)
  .select()
  .single()
```

### Update
```ts
const { data, error } = await supabase
  .from('listings')
  .update({ status: 'inactive' })
  .eq('id', listingId)
  .select()
  .single()
```

### Delete
```ts
const { error } = await supabase
  .from('listings')
  .delete()
  .eq('id', listingId)
```

### Upsert
```ts
const { data, error } = await supabase
  .from('user_favorites')
  .upsert({ user_id: userId, listing_id: listingId })
  .select()
```

## 🛡️ Error Handling

### Tuple Pattern
```ts
const [data, error] = await handleSupabaseQuery(
  supabase.from('listings').select()
)

if (error) {
  console.error(error.message)
  return
}

// data is guaranteed to be non-null here
```

### Try/Catch Pattern
```ts
try {
  const listing = await handleSupabaseMutation(
    supabase.from('listings').insert(newListing).select().single()
  )
} catch (error) {
  if (error instanceof SupabaseError) {
    console.error(error.message, error.code)
  }
}
```

### Error Type Checks
```ts
if (isNotFoundError(error)) { /* 404 */ }
if (isPermissionError(error)) { /* 403 */ }
if (isDuplicateError(error)) { /* 409 */ }
```

## 🔄 Real-time

```tsx
useEffect(() => {
  const subscription = supabase
    .channel('listings-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'listings'
      },
      (payload) => {
        console.log('New listing:', payload.new)
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [supabase])
```

## 📁 Storage

### Upload File
```ts
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file)
```

### Get Public URL
```ts
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('path/to/file.jpg')

console.log(data.publicUrl)
```

### Download File
```ts
const { data, error } = await supabase.storage
  .from('avatars')
  .download('path/to/file.jpg')
```

### Delete File
```ts
const { error } = await supabase.storage
  .from('avatars')
  .remove(['path/to/file.jpg'])
```

## 🔑 Admin Operations

```ts
// ⚠️ Bypasses RLS - use with caution!
const admin = getAdminClient()

const { data } = await admin
  .from('users')
  .select('*')  // Can access all users
```

## 🚪 Middleware Protection

```ts
// middleware.ts
import { requireAuth } from '@/lib/supabase/middleware'

export async function middleware(req: NextRequest) {
  return await requireAuth(req, ['/dashboard', '/profile'])
}
```

## 🎨 Common Patterns

### Conditional Query (Search)
```ts
let query = supabase.from('listings').select('*')

if (minPrice) query = query.gte('rent_xlm', minPrice)
if (maxPrice) query = query.lte('rent_xlm', maxPrice)
if (search) query = query.ilike('title', `%${search}%`)

const { data } = await query
```

### Count Total Rows
```ts
const { count } = await supabase
  .from('listings')
  .select('*', { count: 'exact', head: true })
```

### Pagination
```ts
const page = 2
const pageSize = 20
const from = (page - 1) * pageSize
const to = from + pageSize - 1

const { data } = await supabase
  .from('listings')
  .select('*')
  .range(from, to)
```

### Check Existence
```ts
const { data, error } = await supabase
  .from('user_favorites')
  .select('id')
  .eq('user_id', userId)
  .eq('listing_id', listingId)
  .maybeSingle()

const isFavorited = !!data
```

## 📊 Aggregations (RPC)

Create a PostgreSQL function, then:
```ts
const { data } = await supabase
  .rpc('get_listings_count_by_status')
```

## 🔍 Full-Text Search

```ts
const { data } = await supabase
  .from('listings')
  .select('*')
  .textSearch('title', 'apartment & downtown')
```

## ⚡ Performance Tips

1. **Use select()** - Only fetch columns you need
2. **Use indexes** - Ensure filtered columns have indexes
3. **Pagination** - Use `.range()` for large datasets
4. **Singleton clients** - Use `getSupabaseClient()` and `getAdminClient()`
5. **Avoid N+1** - Use joins instead of multiple queries

## 🐛 Common Errors

| Code | Meaning | Fix |
|------|---------|-----|
| `PGRST116` | No rows found | Check filters or use `.maybeSingle()` |
| `23505` | Duplicate key | Check unique constraints |
| `42501` | Permission denied | Check RLS policies |
| `22P02` | Invalid format | Validate input data |

---

**Pro Tip:** Enable Supabase logs in development:
```ts
// Add to .env.local
NEXT_PUBLIC_SUPABASE_DEBUG=true
```
