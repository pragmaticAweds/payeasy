'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useAvatarUpload } from '@/lib/hooks/useAvatarUpload';

interface AvatarUploadProps {
  onSuccess?: (publicUrl: string) => void;
  onError?: (error: string) => void;
  className?: string;
  maxSizeMB?: number;
  currentAvatarUrl?: string;
}

/**
 * Avatar Upload Component
 *
 * Features:
 * - Image preview before upload
 * - Drag and drop support
 * - File size and type validation
 * - Loading state
 * - Error and success feedback
 *
 * Usage:
 * ```tsx
 * <AvatarUpload
 *   onSuccess={(url) => console.log('Avatar uploaded:', url)}
 *   currentAvatarUrl={user.avatar_url}
 * />
 * ```
 */
export function AvatarUpload({
  onSuccess,
  onError,
  className = '',
  maxSizeMB = 5,
  currentAvatarUrl,
}: AvatarUploadProps) {
  const { upload, loading, error, success } = useAvatarUpload();
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Quick validation before upload
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Selected file is not an image';
      setPreview(null);
      onError?.(errorMsg);
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      const errorMsg = `Image must be smaller than ${maxSizeMB}MB`;
      setPreview(null);
      onError?.(errorMsg);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const result = await upload(file);
    if (result) {
      onSuccess?.(result.publicUrl);
    } else {
      onError?.(error || 'Upload failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleChange}
          disabled={loading}
          className="hidden"
          aria-label="Upload avatar"
        />

        {preview ? (
          <div className="space-y-4">
            <div className="relative w-32 h-32 mx-auto">
              <Image
                src={preview}
                alt="Avatar preview"
                fill
                className="object-cover rounded"
              />
            </div>
            <p className="text-sm text-gray-600">
              {loading ? 'Uploading...' : 'Click or drag to replace'}
            </p>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-28-12l8-8m0 0l8 8m-8-8v24"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-700">
              Drag image here or click to select
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG or JPEG, max {maxSizeMB}MB
            </p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
            <div className="animate-spin">
              <svg className="h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          Avatar uploaded successfully!
        </div>
      )}
    </div>
  );
}
