import crypto from 'crypto';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

export interface FeatureFlag {
    flag_key: string;
    is_enabled: boolean;
    rollout_percentage: number;
    target_segments: string[];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const getSupabase = () => createClient(supabaseUrl, supabaseKey);

/**
 * Deterministically evaluates if a user falls within a rollout bucket based on their ID and the flag key
 */
export function evaluateRollout(userId: string, flagKey: string, percentage: number): boolean {
    if (percentage <= 0) return false;
    if (percentage >= 100) return true;

    const hash = crypto.createHash('md5').update(`${userId}:${flagKey}`).digest('hex');
    const numericHash = parseInt(hash.substring(0, 8), 16);
    return (numericHash % 100) < percentage;
}

/**
 * Check if the user's segment falls inside the target segments
 */
export function evaluateSegments(userSegment: string | undefined, targetSegments: string[]): boolean {
    if (!targetSegments || targetSegments.length === 0) return true;
    if (!userSegment) return false;
    return targetSegments.includes(userSegment);
}

/**
 * Fetches a flag from the database using Next.js unstable_cache to avoid excessive DB reads
 */
export const getFeatureFlag = unstable_cache(
    async (flagKey: string): Promise<FeatureFlag | null> => {
        if (!supabaseUrl || !supabaseKey) return null;
        const { data, error } = await getSupabase()
            .from('features')
            .select('flag_key, is_enabled, rollout_percentage, target_segments')
            .eq('flag_key', flagKey)
            .single();

        if (error || !data) return null;
        return data;
    },
    ['feature-flags'],
    { revalidate: 3600, tags: ['feature-flags'] }
);

/**
 * Core evaluation engine to check if a feature flag is enabled for a specific user.
 * 
 * @param userId - Unique identifier for the user
 * @param flagKey - The key of the feature flag
 * @param userSegment - Optional. The segment to which the user belongs
 * @returns boolean indicating if the feature is enabled
 */
export async function isFeatureEnabled(userId: string, flagKey: string, userSegment?: string): Promise<boolean> {
    const flag = await getFeatureFlag(flagKey);

    // If the flag doesn't exist or is hard-disabled
    if (!flag || !flag.is_enabled) {
        trackEvaluation(userId, flagKey, false);
        return false;
    }

    // Evaluate Target Segments
    const segmentAllows = evaluateSegments(userSegment, flag.target_segments);
    if (!segmentAllows) {
        trackEvaluation(userId, flagKey, false);
        return false;
    }

    // Evaluate Gradual Rollout
    const rolloutAllows = evaluateRollout(userId, flagKey, flag.rollout_percentage);
    trackEvaluation(userId, flagKey, rolloutAllows);

    return rolloutAllows;
}

/**
 * Dispatches an analytics event asynchronously without blocking the flag evaluation request
 */
function trackEvaluation(userId: string, flagKey: string, result: boolean) {
    // Fire and forget via fetch to our internal analytics API
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/analytics/flags`, {
        method: 'POST',
        body: JSON.stringify({ userId, flagKey, result, timestamp: new Date().toISOString() }),
        headers: { 'Content-Type': 'application/json' },
    }).catch(err => console.error('Feature Flag tracking failed:', err));
}
