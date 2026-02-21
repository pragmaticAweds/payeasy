import 'dotenv/config'

import { createClient } from '@supabase/supabase-js';

const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
}
)

const start = async ({
    email,
    password,
    username,
    walletAddress,
}: {
    email: string;
    password: string;
    username: string;
    walletAddress: string;
}) => {
    const { data: authData, error: authError } = await client.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                wallet_address: walletAddress,
            },
        },
    });

    const { error, data } = authData.user ? await client.from("users").upsert({
        id: authData.user!.id,
        username,
        email,
        wallet_address: walletAddress,
    }) : { data: null, error: new Error("No auth data") };

    console.table(error);
    console.table(authData?.user);
    console.table(authError);
    console.table(data);
}

start({
    email: "mmyP6each1@example.com",
    username: '3@mmyP6esache',
    password: "password",
    walletAddress: process.env.TEST_WALLET_ADDRESS!,
})

export { }