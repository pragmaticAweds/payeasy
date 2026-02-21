/**
 * Avatar Upload Examples
 *
 * Various examples of how to use the avatar upload feature in your application.
 */

// ============================================================================
// Example 1: Using the AvatarUpload Component
// ============================================================================

import { AvatarUpload } from '@/components/AvatarUpload';
import { useState } from 'react';

export function ProfileEditPageExample() {
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | undefined>();

  const handleAvatarUploadSuccess = async (publicUrl: string) => {
    // Update the user's avatar in the database
    const response = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: publicUrl }),
    });

    if (response.ok) {
      setUserAvatarUrl(publicUrl);
      // Optional: Show success toast
      // toast.success('Avatar updated successfully');
    }
  };

  const handleAvatarUploadError = (error: string) => {
    console.error('Avatar upload error:', error);
    // Optional: Show error toast
    // toast.error(error);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1>Edit Your Profile</h1>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
        <AvatarUpload
          currentAvatarUrl={userAvatarUrl}
          onSuccess={handleAvatarUploadSuccess}
          onError={handleAvatarUploadError}
          maxSizeMB={5}
          className="max-w-md"
        />
      </section>
    </div>
  );
}

// ============================================================================
// Example 2: Using the useAvatarUpload Hook
// ============================================================================

import { useAvatarUpload } from '@/lib/hooks/useAvatarUpload';
import { useRef } from 'react';

export function CustomAvatarUploadForm() {
  const { upload, loading, error, success } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Perform quick validation
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Max 5MB allowed.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG or PNG)');
      return;
    }

    // Upload
    const result = await upload(file);

    if (result) {
      console.log('Avatar URL:', result.publicUrl);
      // Update user in database
      updateUserAvatar(result.publicUrl);
    }
  };

  const updateUserAvatar = async (publicUrl: string) => {
    // Implementation depends on your data fetching approach
    // This is just an example using fetch
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        disabled={loading}
        style={{ display: 'none' }}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        type="button"
      >
        {loading ? 'Uploading...' : 'Change Avatar'}
      </button>

      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>Avatar updated!</div>}
    </div>
  );
}

// ============================================================================
// Example 3: Direct API Call (without components/hooks)
// ============================================================================

export async function uploadAvatarDirectly(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch('/api/users/avatar/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const { data } = await response.json();
    return data.publicUrl;
  } catch (error) {
    console.error('Avatar upload error:', error);
    return null;
  }
}

// ============================================================================
// Example 4: With Image Preview Before Upload
// ============================================================================

import Image from 'next/image';

export function AvatarUploadWithPreview() {
  const { upload, loading } = useAvatarUpload();
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const result = await upload(file);
    if (result) {
      console.log('Uploaded:', result.publicUrl);
      // Clear preview and reset input
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        disabled={loading}
        style={{ display: 'none' }}
      />

      {preview ? (
        <div className="relative w-40 h-40">
          <Image
            src={preview}
            alt="Avatar preview"
            fill
            className="object-cover"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          >
            {loading ? 'Uploading...' : 'Change'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {loading ? 'Uploading...' : 'Upload Avatar'}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Example 5: Drag and Drop Upload
// ============================================================================

export function AvatarDropZone() {
  const { upload, loading, error } = useAvatarUpload();
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Please drop an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large (max 5MB)');
      return;
    }

    // Upload
    const result = await upload(file);
    if (result) {
      console.log('Avatar uploaded:', result.publicUrl);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
    >
      {loading ? (
        <p>Uploading...</p>
      ) : (
        <>
          <p className="text-gray-700">Drag your avatar here</p>
          <p className="text-sm text-gray-500">PNG or JPEG, max 5MB</p>
        </>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

// ============================================================================
// Example 6: With Database Update
// ============================================================================

import { createClient } from '@/lib/supabase/server';

export function AvatarUploadWithDbUpdate() {
  const { upload, loading } = useAvatarUpload();
  const [isUpdatingDb, setIsUpdatingDb] = useState(false);

  const handleAvatarUpload = async (file: File) => {
    // Upload to storage
    const result = await upload(file);
    if (!result) return;

    // Update database
    setIsUpdatingDb(true);
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: result.publicUrl })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      console.log('Avatar updated in database');
    } catch (error) {
      console.error('Failed to update database:', error);
    } finally {
      setIsUpdatingDb(false);
    }
  };

  return (
    <div>
      <p>Status: {loading || isUpdatingDb ? 'Processing...' : 'Ready'}</p>
      <AvatarUpload
        onSuccess={() => {
          console.log('Total process complete');
        }}
      />
    </div>
  );
}

// ============================================================================
// Example 7: Multi-step Avatar Setup Wizard
// ============================================================================

export function AvatarSetupWizard() {
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const { upload, loading } = useAvatarUpload();

  const handleUpload = async (file: File) => {
    const result = await upload(file);
    if (result) {
      setUploadedUrl(result.publicUrl);
      setStep('preview');
    }
  };

  const handleConfirm = async () => {
    if (!uploadedUrl) return;

    // Save to database
    const response = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: uploadedUrl }),
    });

    if (response.ok) {
      setStep('confirm');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {step === 'upload' && (
        <div>
          <h2>Step 1: Upload Avatar</h2>
          <AvatarUpload
            onSuccess={(url) => {
              setUploadedUrl(url);
              setStep('preview');
            }}
          />
        </div>
      )}

      {step === 'preview' && uploadedUrl && (
        <div>
          <h2>Step 2: Preview</h2>
          <div className="relative w-40 h-40 mx-auto">
            <Image
              src={uploadedUrl}
              alt="Avatar preview"
              fill
              className="object-cover rounded"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setStep('upload')}
              className="flex-1 px-4 py-2 border"
            >
              Change
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white"
            >
              {loading ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div>
          <h2>All Done!</h2>
          <p>Your avatar has been set successfully.</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 8: Error Handling and Retry
// ============================================================================

export function AvatarUploadWithRetry() {
  const { upload, loading, error } = useAvatarUpload();
  const [fileToRetry, setFileToRetry] = useState<File | null>(null);

  const handleRetry = async () => {
    if (!fileToRetry) return;
    await upload(fileToRetry);
  };

  const handleUpload = async (file: File) => {
    setFileToRetry(file);
    await upload(file);
  };

  return (
    <div>
      <AvatarUpload
        onError={(error) => {
          console.error('Upload failed:', error);
          setFileToRetry(null);
        }}
      />

      {error && fileToRetry && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">{error}</p>
          <button
            onClick={handleRetry}
            disabled={loading}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
          >
            {loading ? 'Retrying...' : 'Retry Upload'}
          </button>
        </div>
      )}
    </div>
  );
}
