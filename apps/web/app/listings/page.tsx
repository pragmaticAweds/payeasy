import { ListingSearchResult } from '../../lib/db/types'
import ListingCard from '../../components/listings/ListingCard'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'

// Helper to fetch data
async function getListings(page: number): Promise<ListingSearchResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/listings/search?page=${page}&limit=12`, {
    cache: 'no-store'
  })
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || res.statusText || 'Failed to fetch listings');
  }
  
  return res.json()
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const page = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const data = await getListings(page)

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Link 
                    href="/browse"
                    className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                    aria-label="Back to Browse"
                >
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">All Listings</h1>
            </div>
            
            {data.listings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {data.listings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No listings found.</p>
                </div>
            )}

            {/* Pagination */}
            {data.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 py-8">
                    <Link
                        href={`/listings?page=${page - 1}`}
                        className={`px-6 py-3 rounded-lg border border-gray-300 flex items-center gap-2 bg-white text-gray-900 font-semibold shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95 ${page <= 1 ? 'pointer-events-none opacity-40 bg-gray-100' : ''}`}
                        aria-disabled={page <= 1}
                    >
                        <ChevronLeft size={20} />
                        Previous
                    </Link>
                    <span className="text-gray-700 font-semibold text-lg px-4">
                        Page {page} <span className="text-gray-400 font-normal">of</span> {data.totalPages}
                    </span>
                    <Link
                        href={`/listings?page=${page + 1}`}
                        className={`px-6 py-3 rounded-lg border border-gray-300 flex items-center gap-2 bg-white text-gray-900 font-semibold shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95 ${page >= data.totalPages ? 'pointer-events-none opacity-40 bg-gray-100' : ''}`}
                        aria-disabled={page >= data.totalPages}
                    >
                        Next
                        <ChevronRight size={20} />
                    </Link>
                </div>
            )}
        </main>
    </div>
  )
}
