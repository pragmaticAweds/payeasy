'use client';

import { useState } from 'react';

export interface AvatarUploadResult {
  publicUrl: string;
  path: string;
}

export interface UseAvatarUploadState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Hook for uploading user avatars to Supabase Storage.
 *
 * Usage:
 * ```tsx
 * const { upload, loading, error, success } = useAvatarUpload();
 *
 * const handleUpload = async (file: File) => {
 *   const result = await upload(file);
 *   if (result) {
 *     console.log('Avatar uploaded:', result.publicUrl);
 *   }
 * };
 * ```
 */
export function useAvatarUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const upload = async (file: File): Promise<AvatarUploadResult | null> => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Create FormData
      const formData = new FormData();
      formData.append('avatar', file);

      // Upload to API
      const response = await fetch('/api/users/avatar/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to upload avatar');
      }

      setSuccess(true);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { upload, loading, error, success };
}
