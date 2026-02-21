import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateImageFile, ALLOWED_TYPES, MAX_FILE_SIZE } from '@/lib/image-upload/validation';
import { processImage } from '@/lib/image-upload/optimization';
import { generateUniqueFilename } from '@/lib/image-upload/filename';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = await createClient();
    const listingId = params.id;

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

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const validationErrors = [];
    const validFiles: { file: File; buffer: Buffer }[] = [];

    for (const file of files) {
        if (!(file instanceof File)) {
            validationErrors.push({ filename: 'unknown', error: 'Invalid file object' });
            continue;
        }
        const error = validateImageFile(file);
        if (error) {
            validationErrors.push(error);
        } else {
            const arrayBuffer = await file.arrayBuffer();
            validFiles.push({ file, buffer: Buffer.from(arrayBuffer) });
        }
    }

    if (validationErrors.length > 0) {
        return NextResponse.json({ errors: validationErrors }, { status: 400 });
    }

    const timestamp = Date.now();
    const uploadResults = [];
    const storageArtifacts: string[] = [];
    let currentIndex = 0; // Or fetch max order_index from DB if appending. Will assume 0-n for now.

    try {
        const { data: currentImages } = await supabase
            .from('listing_images')
            .select('order_index')
            .eq('listing_id', listingId)
            .order('order_index', { ascending: false })
            .limit(1);

        currentIndex = currentImages && currentImages.length > 0 ? currentImages[0].order_index + 1 : 0;
    } catch (e) {
        // Ignore error, fallback to 0
    }

    try {
        // Process and upload all
        for (let idx = 0; idx < validFiles.length; idx++) {
            const item = validFiles[idx];
            const filename = generateUniqueFilename(listingId, timestamp, idx);
            const thumbnailFilename = `thumb-${filename}`;

            // Optimize
            const { fullSize, thumbnail } = await processImage(item.buffer);

            // Upload Full Size
            const { error: fullSizeUploadError } = await supabase.storage
                .from('listing-images')
                .upload(filename, fullSize.buffer, {
                    contentType: fullSize.mimetype,
                    upsert: true,
                });

            if (fullSizeUploadError) throw new Error(`Failed to upload full size image: ${filename}`);
            storageArtifacts.push(filename);

            // Upload Thumbnail
            const { error: thumbnailUploadError } = await supabase.storage
                .from('listing-images')
                .upload(thumbnailFilename, thumbnail.buffer, {
                    contentType: thumbnail.mimetype,
                    upsert: true,
                });

            if (thumbnailUploadError) throw new Error(`Failed to upload thumbnail: ${thumbnailFilename}`);
            storageArtifacts.push(thumbnailFilename);

            // Get Public URLs
            const fullSizeUrl = supabase.storage.from('listing-images').getPublicUrl(filename).data.publicUrl;
            const thumbnailUrl = supabase.storage.from('listing-images').getPublicUrl(thumbnailFilename).data.publicUrl;

            uploadResults.push({
                listing_id: listingId,
                url: fullSizeUrl,
                thumbnail_url: thumbnailUrl,
                order_index: currentIndex + idx,
            });
        }

        // Insert database records
        const { error: dbError } = await supabase
            .from('listing_images')
            .insert(uploadResults);

        if (dbError) {
            throw new Error(`Database error: ${dbError.message}`);
        }

        return NextResponse.json({ message: 'Images uploaded successfully', uploaded: uploadResults.length }, { status: 201 });
    } catch (err: any) {
        // Cleanup orphaned files
        if (storageArtifacts.length > 0) {
            await supabase.storage.from('listing-images').remove(storageArtifacts);
        }
        return NextResponse.json({ error: err.message || 'An unexpected error occurred during upload' }, { status: 500 });
    }
}
