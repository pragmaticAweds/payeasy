import { createClient } from "../supabaseClient";
const supabase = createClient();

export async function getUserPreferences (userId: string) {
    const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .limit(1)
        .eq('user_id', userId);
    return data?.[0] || {};
}

export async function getUserFavorites (userId: string) {
    const { data } = await supabase
        .from('user_favorites')
        .select('listing_id')
        .eq('user_id', userId);
    return data || [];
}

export async function getUserSearchHistory (userId: string) {
    const { data } = await supabase
        .from('user_search_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return data || [];
}
