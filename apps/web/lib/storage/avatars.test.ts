import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateAvatarFile,
  generateAvatarFilename,
  uploadAvatar,
  deleteAvatar,
  getAvatarPublicUrl,
} from './avatars';

describe('Avatar Storage', () => {
  describe('validateAvatarFile', () => {
    it('should accept valid JPEG files', () => {
      const file = new File(['data'], 'image.jpg', { type: 'image/jpeg' });
      expect(() => validateAvatarFile(file)).not.toThrow();
    });

    it('should accept valid PNG files', () => {
      const file = new File(['data'], 'image.png', { type: 'image/png' });
      expect(() => validateAvatarFile(file)).not.toThrow();
    });

    it('should reject files larger than 5MB', () => {
      const largeData = new Uint8Array(5 * 1024 * 1024 + 1);
      const file = new File([largeData], 'large.jpg', { type: 'image/jpeg' });
      
      expect(() => validateAvatarFile(file)).toThrow('File size exceeds 5MB limit');
    });

    it('should reject non-image files', () => {
      const file = new File(['data'], 'document.txt', { type: 'text/plain' });
      
      expect(() => validateAvatarFile(file)).toThrow('Invalid file type');
    });

    it('should reject WebP files', () => {
      const file = new File(['data'], 'image.webp', { type: 'image/webp' });
      
      expect(() => validateAvatarFile(file)).toThrow('Invalid file type');
    });

    it('should provide file size in error message', () => {
      const data = new Uint8Array(6 * 1024 * 1024);
      const file = new File([data], 'large.jpg', { type: 'image/jpeg' });
      
      expect(() => validateAvatarFile(file)).toThrow(/6\.\d+MB/);
    });
  });

  describe('generateAvatarFilename', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-02-21T12:00:00Z'));
    });

    it('should generate filename for JPEG files', () => {
      const file = new File(['data'], 'image.jpg', { type: 'image/jpeg' });
      const filename = generateAvatarFilename('user-123', file);
      
      expect(filename).toMatch(/^user-123-\d+\.jpg$/);
    });

    it('should generate filename for PNG files', () => {
      const file = new File(['data'], 'image.png', { type: 'image/png' });
      const filename = generateAvatarFilename('user-123', file);
      
      expect(filename).toMatch(/^user-123-\d+\.png$/);
    });

    it('should include timestamp in filename', () => {
      const file = new File(['data'], 'image.jpg', { type: 'image/jpeg' });
      const filename = generateAvatarFilename('user-123', file);
      
      // Extract timestamp
      const timestamp = filename.split('-')[1].split('.')[0];
      expect(Number(timestamp)).toBeGreaterThan(0);
    });

    it('should generate unique filenames for multiple uploads', () => {
      const file = new File(['data'], 'image.jpg', { type: 'image/jpeg' });
      
      const filename1 = generateAvatarFilename('user-123', file);
      vi.advanceTimersByTime(1000);
      const filename2 = generateAvatarFilename('user-123', file);
      
      expect(filename1).not.toBe(filename2);
    });
  });

  describe('uploadAvatar', () => {
    let mockSupabase: any;

    beforeEach(() => {
      mockSupabase = {
        storage: {
          from: vi.fn(),
        },
      };
    });

    it('should validate file before upload', async () => {
      const largeData = new Uint8Array(5 * 1024 * 1024 + 1);
      const file = new File([largeData], 'large.jpg', { type: 'image/jpeg' });

      await expect(uploadAvatar(mockSupabase, 'user-123', file)).rejects.toThrow(
        'File size exceeds 5MB limit'
      );
    });

    it('should handle valid file upload', async () => {
      const file = new File(['image data'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockBucket = {
        upload: vi.fn().mockResolvedValue({
          data: { path: 'user-123/user-123-timestamp.jpg' },
          error: null,
        }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/avatar.jpg' },
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.storage.from.mockReturnValue(mockBucket);

      const result = await uploadAvatar(mockSupabase, 'user-123', file);

      expect(result.publicUrl).toBe('https://example.com/avatar.jpg');
      expect(mockBucket.upload).toHaveBeenCalled();
    });

    it('should delete old avatars before uploading new ones', async () => {
      const file = new File(['image data'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockBucket = {
        upload: vi.fn().mockResolvedValue({
          data: { path: 'user-123/user-123-timestamp.jpg' },
          error: null,
        }),
        list: vi.fn().mockResolvedValue({
          data: [{ name: 'user-123-old.jpg' }],
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/avatar.jpg' },
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.storage.from.mockReturnValue(mockBucket);

      await uploadAvatar(mockSupabase, 'user-123', file);

      // Should have called remove for old files
      expect(mockBucket.remove).toHaveBeenCalled();
    });

    it('should return public URL', async () => {
      const file = new File(['image data'], 'avatar.jpg', { type: 'image/jpeg' });
      const publicUrl = 'https://storage.example.com/avatars/user-123/avatar.jpg';
      const mockBucket = {
        upload: vi.fn().mockResolvedValue({
          data: { path: 'user-123/user-123-1708516801000.jpg' },
          error: null,
        }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl },
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.storage.from.mockReturnValue(mockBucket);

      const result = await uploadAvatar(mockSupabase, 'user-123', file);

      expect(result.publicUrl).toBe(publicUrl);
      expect(result.path).toMatch(/^user-123\/user-123-\d+\.jpg$/);
    });
  });

  describe('deleteAvatar', () => {
    it('should delete avatar file', async () => {
      const mockBucket = {
        remove: vi.fn().mockResolvedValue({ error: null }),
      };
      const mockSupabase = {
        storage: {
          from: vi.fn().mockReturnValue(mockBucket),
        },
      };

      await deleteAvatar(mockSupabase, 'user-123/avatar.jpg');

      expect(mockBucket.remove).toHaveBeenCalledWith(['user-123/avatar.jpg']);
    });

    it('should throw error if deletion fails', async () => {
      const mockBucket = {
        remove: vi.fn().mockResolvedValue({
          error: { message: 'File not found' },
        }),
      };
      const mockSupabase = {
        storage: {
          from: vi.fn().mockReturnValue(mockBucket),
        },
      };

      await expect(deleteAvatar(mockSupabase, 'user-123/avatar.jpg')).rejects.toThrow(
        'Failed to delete avatar'
      );
    });
  });

  describe('getAvatarPublicUrl', () => {
    it('should return public URL for avatar', () => {
      const publicUrl = 'https://storage.example.com/avatars/user-123/avatar.jpg';
      const mockBucket = {
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl },
        }),
      };
      const mockSupabase = {
        storage: {
          from: vi.fn().mockReturnValue(mockBucket),
        },
      };

      const result = getAvatarPublicUrl(mockSupabase, 'user-123/avatar.jpg');

      expect(result).toBe(publicUrl);
      expect(mockBucket.getPublicUrl).toHaveBeenCalledWith('user-123/avatar.jpg');
    });
  });
});
