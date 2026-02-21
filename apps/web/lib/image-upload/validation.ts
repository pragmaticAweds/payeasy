export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export interface FileValidationError {
    filename: string;
    error: string;
}

export function validateImageFile(file: File): FileValidationError | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            filename: file.name,
            error: `Invalid file type: ${file.type}. Only JPEG and PNG are allowed.`,
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            filename: file.name,
            error: `File is too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max allowed size is 10MB.`,
        };
    }

    return null;
}
