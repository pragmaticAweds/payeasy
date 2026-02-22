import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
    try {
        const { userId, flagKey, result, timestamp } = await req.json();

        if (!userId || !flagKey) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        if (supabaseUrl && supabaseKey) {
            // Log event to Supabase
            const supabase = createClient(supabaseUrl, supabaseKey);
            await supabase.from('flag_events').insert({
                user_id: userId,
                flag_key: flagKey,
                evaluation_result: result,
                evaluated_at: timestamp || new Date().toISOString()
            });
        } else {
            console.log(`[Feature Flag Event] User: ${userId} | Flag: ${flagKey} | Result: ${result}`);
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Analytics Recording Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
