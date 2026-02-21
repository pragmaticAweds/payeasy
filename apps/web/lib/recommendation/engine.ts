import { getUserFavorites, getUserPreferences, getUserSearchHistory } from './user-data';
import { upstashGet, upstashSet } from './cache';

import { createServerClient } from '@/lib/supabase/server';
import { getSimilarListings } from './similar-listings';

/**
 * Save user feedback for recommendations
 */
export async function saveRecommendationFeedback (userId: string, feedback: { rating: number, comments?: string, abVariant?: string }) {
    const supabase = createServerClient();
    await supabase.from('user_recommendation_feedback').insert({
        user_id: userId,
        rating: feedback.rating,
        comments: feedback.comments || null,
        ab_variant: feedback.abVariant || null,
        created_at: new Date().toISOString(),
    });
}

/**
 * Recommendation engine: Suggest listings to users based on preferences, favorites, search history, amenities, budget, and behavior.
 */
export async function getRecommendations (userData: any) {
    const { id: userId } = userData;

    // Try cache first
    const cached = await upstashGet(userId);
    if (cached) return cached;

    // Gather user data
    const preferences = await getUserPreferences(userId);
    const favorites = await getUserFavorites(userId);
    const searchHistory = await getUserSearchHistory(userId);

    // A/B test: randomly select algorithm
    const abVariant = Math.random() < 0.5 ? 'A' : 'B';
    let listings;
    if (abVariant === 'A') {
        listings = await getSimilarListings({ preferences, favorites, searchHistory, budget: userData?.budget, amenities: userData?.amenities, behavior: userData?.behavior });
    } else {
        // Variant B: prioritize favorites and budget
        listings = await getSimilarListings({ preferences, favorites, searchHistory, budget: userData?.budget, amenities: userData?.amenities, behavior: userData?.behavior, prioritizeFavorites: true });
    }

    // Log variant for feedback loop
    // TODO: Save abVariant to user_recommendation_log table

    // Generate reasons for each listing
    const reasons = listings.map((listing: any) => {
        const matched: string[] = [];
        if (favorites.some((f: any) => f.listing_id === listing.id)) matched.push('Favorited');
        if (preferences.budget && listing.rent_xlm <= preferences.budget) matched.push('Matches budget');
        if (preferences.amenities && preferences.amenities.some((a: any) => listing.amenities.includes(a))) matched.push('Similar amenities');
        if (searchHistory.some((s: any) => s.listing_id === listing.id)) matched.push('Viewed before');
        return { listingId: listing.id, reasons: matched };
    });

    // Cache result
    await upstashSet(userId, listings);

    return { listings, abVariant, reasons };
}
