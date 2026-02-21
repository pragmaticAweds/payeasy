import { createClient } from "../superbase/server";

export async function getSimilarListings ({ preferences, favorites, searchHistory, budget, amenities, behavior }: any) {
    const supabase = await createClient();

    // TODO: ML logic to combine signals
    // Example: filter listings by budget, amenities, favorites, etc.
    let query = supabase.from('listings').select('*').eq('status', 'active');
    if (budget) query = query.lte('rent_xlm', budget);
    if (amenities && amenities.length) query = query.in('amenities', amenities);
    // ...more logic
    const { data, error } = await query;
    return data || [];
}
