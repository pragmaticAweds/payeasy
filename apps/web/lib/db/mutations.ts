import { SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile, Listing } from '@/lib/types/superbase';

export async function createUser(supabase: SupabaseClient, userData: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select('*')
        .single();

    if (error) {
        throw new Error(`Failed to create user: ${error.message}`);
    }

    return data as UserProfile;
}

export async function createListing(supabase: SupabaseClient, listingData: Partial<Listing>): Promise<Listing> {
    const { data, error } = await supabase
        .from('listings')
        .insert(listingData)
        .select('*')
        .single();

    if (error) {
        throw new Error(`Failed to create listing: ${error.message}`);
    }

    return data as Listing;
}

export async function updateListing(supabase: SupabaseClient, id: string, listingData: Partial<Listing>): Promise<Listing> {
    const { data, error } = await supabase
        .from('listings')
        .update(listingData)
        .eq('id', id)
        .select('*')
        .single();

    if (error) {
        throw new Error(`Failed to update listing: ${error.message}`);
    }

    return data as Listing;
}

export async function deleteListing(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(`Failed to delete listing: ${error.message}`);
    }
}

/**
 * Execute a transaction-like sequence of operations.
 * Supabase/PostgREST typically doesn't support interactive transactions from the client.
 * For true transactions passing multiple operations, you would typically use an RPC call.
 * This simulates a transaction by doing them sequentially, or via an RPC.
 */
export async function executeTransaction(supabase: SupabaseClient, rpcName: string, payload: any): Promise<any> {
    const { data, error } = await supabase.rpc(rpcName, payload);

    if (error) {
        throw new Error(`Transaction failed: ${error.message}`);
    }

    return data;
}
