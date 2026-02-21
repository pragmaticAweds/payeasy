import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string; imageId: string } }
) {
    const supabase = await createClient();
    const listingId = params.id;
    const imageId = params.imageId;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify listing belongs to user
    const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id')
        .eq('id', listingId)
        .eq('landlord_id', user.id)
        .single();

    if (listingError || !listing) {
        return NextResponse.json({ error: 'Listing not found or unauthorized' }, { status: 403 });
    }

    // Get image details
    const { data: image, error: imageError } = await supabase
        .from('listing_images')
        .select('*')
        .eq('id', imageId)
        .eq('listing_id', listingId)
        .single();

    if (imageError || !image) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Extract filenames from URLs
    const extractFilename = (url: string) => {
        const parts = url.split('/');
        return parts[parts.length - 1]; // Only safe if URL structure doesn't change
    };

    const filename = extractFilename(image.url);
    const thumbnailFilename = extractFilename(image.thumbnail_url);

    // Delete from storage
    const { error: storageError } = await supabase.storage
        .from('listing-images')
        .remove([filename, thumbnailFilename]);

    if (storageError) {
        return NextResponse.json({ error: `Failed to delete from storage: ${storageError.message}` }, { status: 500 });
    }

    // Delete from DB
    const { error: dbError } = await supabase
        .from('listing_images')
        .delete()
        .eq('id', imageId);

    if (dbError) {
        return NextResponse.json({ error: `Failed to delete database record: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Image deleted successfully' }, { status: 200 });
}
