import { SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile, Listing, ContractTransaction } from '@/lib/types/superbase';

export async function getUserById(supabase: SupabaseClient, id: string): Promise<UserProfile> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data as UserProfile;
}

export async function getListingById(supabase: SupabaseClient, id: string): Promise<Listing> {
    const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        throw new Error(`Failed to fetch listing: ${error.message}`);
    }

    return data as Listing;
}

export async function getTransactionsByUserId(supabase: SupabaseClient, userId: string): Promise<ContractTransaction[]> {
    const { data, error } = await supabase
        .from('contract_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return data as ContractTransaction[];
}
