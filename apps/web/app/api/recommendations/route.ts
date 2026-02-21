import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, getUserId } from '@/lib/api-utils';
import { upstashGet, upstashSet } from '../../../lib/recommendation/cache';

import { createServerClient } from '@/lib/supabase/server';
import { getRecommendations } from '../../../lib/recommendation/engine';

export async function GET (request: NextRequest) {
    const supabase = createServerClient();
    const userId = getUserId(request);
    if (!userId) {
        return errorResponse("Authentication required.", 401, "UNAUTHORIZED");
    }

    // Try cache first
    const cached = await upstashGet(userId);
    if (cached) {
        return NextResponse.json({ recommendations: cached, cached: true });
    }

    // Fetch user data
    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', userId)
        .single();

    if (!userData) {
        return errorResponse("User not found.", 404, "NOT_FOUND");
    }

    // Generate recommendations
    const recommendations = await getRecommendations(userData);

    // Cache recommendations
    await upstashSet(userId, recommendations);

    return NextResponse.json({ recommendations, cached: false });
}
