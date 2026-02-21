export function generateUniqueFilename(listingId: string, timestamp: number, index: number): string {
    return `${listingId}-${timestamp}-${index}.jpg`;
}
