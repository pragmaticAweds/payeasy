import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './route';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/storage/avatars', () => ({
  uploadAvatar: vi.fn(),
}));

vi.mock('@/lib/api-utils', () => ({
  successResponse: (data: any, status?: number) => ({
    json: async () => ({ success: true, data }),
    status: status || 200,
  }),
  errorResponse: (message: string, status?: number) => ({
    json: async () => ({ success: false, error: { message } }),
    status: status || 400,
  }),
}));

import { createClient } from '@/lib/supabase/server';
import { uploadAvatar } from '@/lib/storage/avatars';
import { successResponse, errorResponse } from '@/lib/api-utils';

describe('POST /api/users/avatar/upload', () => {
  let mockSupabase: any;
  let mockRequest: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
    };

    mockRequest = {
      formData: vi.fn(),
    };
  });

  it('should return 401 if user is not authenticated', async () => {
    (createClient as any).mockResolvedValue(mockSupabase);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    const response = await POST(mockRequest as any);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('should return 400 if no file provided', async () => {
    (createClient as any).mockResolvedValue(mockSupabase);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    mockRequest.formData.mockResolvedValue(new Map());

    const response = await POST(mockRequest as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('should handle file size validation errors', async () => {
    const largeData = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([largeData], 'large.jpg', { type: 'image/jpeg' });

    (createClient as any).mockResolvedValue(mockSupabase);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const formDataMap = new Map();
    formDataMap.set('avatar', file);
    mockRequest.formData.mockResolvedValue(formDataMap);

    (uploadAvatar as any).mockRejectedValue(
      new Error('File size exceeds 5MB limit')
    );

    const response = await POST(mockRequest as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('should successfully upload avatar', async () => {
    const file = new File(['image data'], 'avatar.jpg', {
      type: 'image/jpeg',
    });

    (createClient as any).mockResolvedValue(mockSupabase);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const formDataMap = new Map();
    formDataMap.set('avatar', file);
    mockRequest.formData.mockResolvedValue(formDataMap);

    const uploadResult = {
      publicUrl: 'https://example.com/avatar.jpg',
      path: 'user-123/avatar.jpg',
    };

    (uploadAvatar as any).mockResolvedValue(uploadResult);

    const response = await POST(mockRequest as any);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.publicUrl).toBe(uploadResult.publicUrl);
  });

  it('should handle server errors gracefully', async () => {
    const file = new File(['image data'], 'avatar.jpg', {
      type: 'image/jpeg',
    });

    (createClient as any).mockResolvedValue(mockSupabase);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    const formDataMap = new Map();
    formDataMap.set('avatar', file);
    mockRequest.formData.mockResolvedValue(formDataMap);

    (uploadAvatar as any).mockRejectedValue(
      new Error('Storage service temporarily unavailable')
    );

    const response = await POST(mockRequest as any);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
  });
});
