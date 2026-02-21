# Avatar Image Upload Feature

Complete avatar upload functionality for PayEasy with Supabase Storage integration.

## Overview

This feature provides a complete solution for uploading, storing, and managing user avatars:

- **File Validation**: Validates file size (max 5MB) and type (JPEG/PNG only)
- **Secure Upload**: User authentication required via Supabase Auth
- **Public URLs**: Returns publicly accessible URLs for uploaded avatars
- **Automatic Cleanup**: Automatically deletes old avatars when new ones are uploaded
- **Error Handling**: Comprehensive error messages and graceful fallbacks
- **React Integration**: Includes hooks and components for easy frontend integration

## Architecture

### Files

```
lib/
├── storage/
│   └── avatars.ts           # Core storage logic
├── hooks/
│   └── useAvatarUpload.ts   # React hook for uploads
app/
├── api/users/avatar/
│   └── upload/route.ts      # API endpoint
components/
└── AvatarUpload.tsx         # Reusable React component
```

## API Endpoint

### `POST /api/users/avatar/upload`

Upload a user avatar image to Supabase Storage.

#### Request

```bash
curl -X POST http://localhost:3000/api/users/avatar/upload \
  -H "Cookie: auth-token=<your-token>" \
  -F "avatar=@/path/to/image.jpg"
```

**Headers:**
- `Cookie: auth-token=<jwt>` (or `Authorization: Bearer <jwt>`)

**Body:**
- `FormData` with `avatar` file field
- Supported formats: JPEG, PNG
- Max size: 5MB

#### Response

**Success (201):**
```json
{
  "success": true,
  "data": {
    "publicUrl": "https://xyz.supabase.co/storage/v1/object/public/avatars/user-id/filename.jpg",
    "path": "user-id/filename.jpg"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": {
    "message": "File size exceeds 5MB limit. Received: 6.50MB"
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "error": {
    "message": "Unauthorized"
  }
}
```

#### Status Codes

| Code | Meaning |
|------|---------|
| 201 | Avatar uploaded successfully |
| 400 | Bad request (invalid file, missing field) |
| 401 | Unauthorized (not authenticated) |
| 500 | Server error |

## Storage Structure

Avatars are stored in the `avatars` Supabase Storage bucket with the following structure:

```
avatars/
└── {userId}/
    └── {userId}-{timestamp}.{ext}
```

Example:
```
avatars/
└── 550e8400-e29b-41d4-a716-446655440000/
    └── 550e8400-e29b-41d4-a716-446655440000-1708443600000.jpg
```

## Database Integration

To update the user's avatar URL in the database after upload:

```typescript
import { createClient } from '@/lib/superbase/server';

const supabase = await createClient();
const { error } = await supabase
  .from('users')
  .update({ avatar_url: publicUrl })
  .eq('id', userId);

if (error) console.error('Failed to update avatar:', error);
```

## Frontend Usage

### Using the Component

```tsx
import { AvatarUpload } from '@/components/AvatarUpload';

export function UserProfile() {
  const [avatarUrl, setAvatarUrl] = useState<string>();

  return (
    <AvatarUpload
      currentAvatarUrl={avatarUrl}
      onSuccess={(url) => {
        setAvatarUrl(url);
        // Update user record in database
      }}
      onError={(error) => {
        console.error('Upload failed:', error);
      }}
    />
  );
}
```

### Using the Hook

```tsx
'use client';

import { useAvatarUpload } from '@/lib/hooks/useAvatarUpload';

export function AvatarUploadForm() {
  const { upload, loading, error, success } = useAvatarUpload();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await upload(file);
    if (result) {
      console.log('Avatar uploaded:', result.publicUrl);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        disabled={loading}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Avatar uploaded!</p>}
      {loading && <p>Uploading...</p>}
    </div>
  );
}
```

## Supabase Configuration

### Storage Bucket

The feature requires a `avatars` bucket in Supabase Storage:

```sql
-- Create bucket via Supabase Dashboard or SQL
SELECT stripe.create_bucket('avatars');
```

### Bucket Settings

- **Public Access**: Enabled (to serve public URLs)
- **Allowed MIME Types**: `image/jpeg`, `image/png`
- **Max File Size**: 5,242,880 bytes (5MB)

### Row Level Security (RLS)

```sql
-- Users can upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (string_to_array(name, '-'))[1]
);

-- Anyone can view avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (string_to_array(name, '-'))[1]
);
```

## Validation Rules

### File Size
- Maximum: 5MB (5,242,880 bytes)
- Error message: "File size exceeds 5MB limit. Received: XMB"

### File Type
- Allowed: JPEG, PNG
- MIME types: `image/jpeg`, `image/png`
- Error message: "Invalid file type. Only JPEG and PNG files are allowed. Received: X"

### Filename
- Format: `{userId}-{timestamp}.{ext}`
- Example: `550e8400-e29b-41d4-a716-446655440000-1708443600000.jpg`

## Error Handling

### Client-Side Validation

```typescript
import { validateAvatarFile } from '@/lib/storage/avatars';

try {
  validateAvatarFile(file);
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### Upload Failures

The component and hook handle errors gracefully:

- **Validation Errors** (400): Invalid file type or size
- **Auth Errors** (401): User not authenticated
- **Upload Errors** (500): Storage or network issues

Failed uploads automatically clean up partial uploads to prevent storage bloat.

## Testing

### Manual Testing

```bash
# Upload an avatar
curl -X POST http://localhost:3000/api/users/avatar/upload \
  -H "Cookie: auth-token=<valid-jwt>" \
  -F "avatar=@test-image.jpg"

# Verify response
# Should return: { success: true, data: { publicUrl: "...", path: "..." } }
```

### Component Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AvatarUpload } from '@/components/AvatarUpload';

test('uploads avatar on file select', async () => {
  const onSuccess = jest.fn();
  render(<AvatarUpload onSuccess={onSuccess} />);

  const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
  const input = screen.getByRole('button');
  fireEvent.change(input, { target: { files: [file] } });

  // Wait for upload
  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalled();
  });
});
```

## Performance Considerations

### File Size
- Avatars up to 5MB are supported
- For better performance, consider optimizing images client-side before upload
- Consider implementing image compression for avatars larger than 1MB

### Caching
- Public avatar URLs are cached by CDN
- To force refresh after upload, append cache-busting query: `?t=timestamp`

### Storage Costs
- Each avatar upload stores one file
- Old avatars are automatically deleted, preventing storage bloat
- Monthly storage cost depends on avatar sizes and user count

## Future Enhancements

Potential improvements for future versions:

1. **Image Optimization**: Automatically compress and resize images
2. **Multiple Formats**: Generate responsive image sizes (small, medium, large)
3. **Fallback Avatars**: Generate initials-based fallback avatars
4. **Crop/Resize**: Allow users to crop and resize before upload
5. **WebP Support**: Add WebP format for better compression
6. **Batch Operations**: Upload and manage multiple avatars
7. **Analytics**: Track upload success rates and sizes

## Troubleshooting

### "File size exceeds 5MB limit"
- Compress the image before uploading
- Use an image optimization tool
- Consider reducing image dimensions

### "Invalid file type"
- Ensure the file is JPEG or PNG
- Check file extension matches actual format
- Validate with `file` command: `file image.jpg`

### "Unauthorized"
- Ensure user is authenticated
- Check auth token in cookies
- Verify auth token is valid and not expired

### "Failed to upload avatar"
- Check Supabase Storage bucket exists and is public
- Verify network connectivity
- Check browser console for detailed error
- Review server logs at `/app/api/users/avatar/upload/route.ts`

### "Avatar not showing after upload"
- Verify public URL is correct
- Check image.supabase.co domain is accessible
- Clear browser cache
- Try with `?t=timestamp` cache-buster
- Check image exists in Supabase Storage dashboard

## Related Issues

- #16: Create User Profile Page Layout
- #17: Create Edit Profile Form with Validation
- #19: Create Public User Profile View Page
- #20: Create User Dashboard Landing Page

## References

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [MDN File API](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
