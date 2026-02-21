import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Bed, Bath, User, ShieldCheck, ArrowLeft, Heart, Share2, Wallet } from 'lucide-react'
import FavoriteButton from '@/components/FavoriteButton'

export default async function ListingDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()
  
  let listing: any = null

  // Check if mock data
  if (id.startsWith('mock-')) {
    const mockIndex = parseInt(id.replace('mock-', '')) - 1
    const i = mockIndex >= 0 ? mockIndex : 0
    const imageExt = (i % 4) + 1 === 4 ? 'webp' : 'jpg';

    listing = {
      id: id,
      title: `Mock Listing ${i + 1}`,
      description: "This is a detailed description of the mock listing. It features spacious rooms, modern amenities, and a great location. Perfect for anyone looking for a comfortable and stylish place to live.",
      address: `123 Mock St, City ${i + 1}`,
      rent_xlm: 1000 + i * 50,
      bedrooms: (i % 3) + 1,
      bathrooms: (i % 2) + 1,
      status: "active",
      images: [`/images/airbnb${(i % 4) + 1}.${imageExt}`],
      landlord: {
        username: "Demo Landlord",
        avatar_url: null,
        public_key: "GBDWB..."
      },
      amenities: ["Wifi", "Kitchen", "Washer", "Dryer", "Air conditioning", "Heating", "Dedicated workspace", "TV", "Hair dryer", "Iron"],
      created_at: new Date().toISOString()
    }
  } else {
    // Fetch from Supabase
    const { data, error } = await supabase
      .from('listings')
      .select('*, listing_images(url, sort_order), users(username, avatar_url, public_key)')
      .eq('id', id)
      .single()
      
    if (data) {
      listing = {
        ...data,
        images: data.listing_images 
          ? data.listing_images.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)).map((img: any) => img.url)
          : [],
        landlord: data.users
      }
    }
  }

  if (!listing) {
    notFound()
  }

  const imageUrl = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : '/images/airbnb1.jpg'

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/listings" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Back to listings
          </Link>
          <div className="flex items-center gap-4">
             <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
               <Share2 size={20} />
             </button>
             <FavoriteButton listingId={listing.id} />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
           <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
           <div className="flex items-center text-gray-600 gap-2">
             <MapPin size={18} />
             <span>{listing.address}</span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Column - Images & Description */}
           <div className="lg:col-span-2 space-y-8">
              {/* Image Gallery */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-200 shadow-sm">
                 <Image 
                   src={imageUrl}
                   alt={listing.title}
                   fill
                   className="object-cover"
                   priority
                   sizes="(max-width: 1024px) 100vw, 66vw"
                 />
                 <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                    1 / {listing.images.length || 1}
                 </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-between py-6 border-y border-gray-200">
                 <div className="flex gap-8">
                    <div className="flex items-center gap-2">
                       <div className="p-2 bg-gray-100 rounded-lg"><User size={20} className="text-gray-600" /></div>
                       <div>
                          <p className="text-sm text-gray-500">Hosted by</p>
                          <p className="font-medium">{listing.landlord?.username || 'Unknown Host'}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="p-2 bg-gray-100 rounded-lg"><Bed size={20} className="text-gray-600" /></div>
                       <div>
                          <p className="text-sm text-gray-500">Bedrooms</p>
                          <p className="font-medium">{listing.bedrooms}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="p-2 bg-gray-100 rounded-lg"><Bath size={20} className="text-gray-600" /></div>
                       <div>
                          <p className="text-sm text-gray-500">Bathrooms</p>
                          <p className="font-medium">{listing.bathrooms}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Description */}
              <div>
                 <h2 className="text-xl font-semibold mb-4">About this place</h2>
                 <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {listing.description || "No description provided."}
                 </p>
              </div>

              {/* Amenities */}
              {listing.amenities && listing.amenities.length > 0 && (
                <div>
                   <h2 className="text-xl font-semibold mb-4">What this place offers</h2>
                   <div className="grid grid-cols-2 gap-4">
                      {listing.amenities.map((amenity: string, idx: number) => (
                         <div key={idx} className="flex items-center gap-3 text-gray-600">
                            <ShieldCheck size={18} className="text-green-600" />
                            <span>{amenity}</span>
                         </div>
                      ))}
                   </div>
                </div>
              )}
           </div>

           {/* Right Column - Booking Card */}
           <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                 <div className="flex justify-between items-end mb-6">
                    <div>
                       <span className="text-3xl font-bold text-gray-900">{listing.rent_xlm} XLM</span>
                       <span className="text-gray-500 text-sm ml-1">/ month</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                       <Heart size={14} className="fill-red-500 text-red-500" />
                       <span className="font-medium text-gray-900">4.92</span>
                       <span className="underline">(12 reviews)</span>
                    </div>
                 </div>

                 <div className="space-y-4 mb-6">
                    <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                       <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Contract Address</span>
                       </div>
                       <div className="font-mono text-xs text-gray-500 break-all bg-white p-2 rounded border border-gray-200">
                          CDLZFC3SYJYDZT7KQLSPR4VP68SHJLHPRJ3D547PXVPH3SA2PTUXWW5N
                       </div>
                    </div>
                 </div>
                 
                 <Link 
                   href={`/listings/${id}/pay`}
                   className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5"
                 >
                    <Wallet size={20} />
                    Pay Rent with Stellar
                 </Link>

                 <p className="text-center text-xs text-gray-400 mt-4">
                    Secure payment powered by Soroban Smart Contracts
                 </p>
              </div>
           </div>
        </div>
      </main>
    </div>
  )
}
