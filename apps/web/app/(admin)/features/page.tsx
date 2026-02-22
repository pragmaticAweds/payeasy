import { revalidateTag } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function fetchFeatures() {
    if (!supabaseUrl || !supabaseKey) return [];
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.from('features').select('*').order('flag_key');
    return data || [];
}

async function updateFeature(formData: FormData) {
    'use server';
    const flag_key = formData.get('flag_key') as string;
    const is_enabled = formData.get('is_enabled') === 'on';
    const rollout_percentage = parseInt(formData.get('rollout_percentage') as string, 10);
    const target_segments = JSON.parse(formData.get('target_segments') as string || '[]');

    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('features').update({
            is_enabled,
            rollout_percentage,
            target_segments
        }).eq('flag_key', flag_key);
    }

    // Aggressively bust internal Next.js cache when an admin updates the feature
    revalidateTag('feature-flags');
}

export default async function AdminFeaturesPage() {
    const features = await fetchFeatures();

    return (
        <div className="p-8 max-w-5xl mx-auto font-sans">
            <h1 className="text-2xl font-bold mb-6">Feature Flags Management</h1>
            <p className="text-gray-600 mb-8">
                Control gradual rollouts, segmentation targeting, and kill-switches in real-time. Changes immediately invalidate edge caches.
            </p>

            <div className="grid gap-6">
                {features.map((flag) => (
                    <form
                        key={flag.flag_key}
                        action={updateFeature}
                        className="border p-6 rounded-lg shadow-sm bg-white"
                    >
                        <input type="hidden" name="flag_key" value={flag.flag_key} />

                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold font-mono">{flag.flag_key}</h2>
                            <label className="flex items-center cursor-pointer">
                                <span className="mr-3 text-sm font-medium text-gray-900">Enabled</span>
                                <input
                                    type="checkbox"
                                    name="is_enabled"
                                    defaultChecked={flag.is_enabled}
                                    className="w-5 h-5 accent-blue-600"
                                />
                            </label>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rollout Percentage ({flag.rollout_percentage}%)
                            </label>
                            <input
                                type="range"
                                name="rollout_percentage"
                                min="0"
                                max="100"
                                defaultValue={flag.rollout_percentage}
                                className="w-full"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Target Segments (JSON Array)
                            </label>
                            <input
                                type="text"
                                name="target_segments"
                                defaultValue={JSON.stringify(flag.target_segments)}
                                className="w-full border p-2 rounded text-sm font-mono"
                                placeholder='["beta-testers", "internal"]'
                            />
                        </div>

                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition"
                        >
                            Save Configuration
                        </button>
                    </form>
                ))}

                {features.length === 0 && (
                    <div className="text-center p-12 text-gray-500 border rounded-lg border-dashed">
                        No features found. Connect your database to visualize flags.
                    </div>
                )}
            </div>
        </div>
    );
}
