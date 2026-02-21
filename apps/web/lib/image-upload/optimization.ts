import sharp from 'sharp';

export interface ProcessedImage {
    buffer: Buffer;
    mimetype: string;
}

export async function processImage(fileBuffer: Buffer): Promise<{
    fullSize: ProcessedImage;
    thumbnail: ProcessedImage;
}> {
    // Compress and convert to WebP at 1200x900 resolution with 80% quality
    const fullSizeBuffer = await sharp(fileBuffer)
        .resize(1200, 900, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

    const thumbnailBuffer = await sharp(fileBuffer)
        .resize(500, 500, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

    return {
        fullSize: {
            buffer: fullSizeBuffer,
            mimetype: 'image/webp',
        },
        thumbnail: {
            buffer: thumbnailBuffer,
            mimetype: 'image/webp',
        },
    };
}
