import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/listings/[id]/images/upload/route';
import { DELETE } from '../app/api/listings/[id]/images/[imageId]/route';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/image-upload/optimization', () => ({
    processImage: vi.fn().mockResolvedValue({
        fullSize: { buffer: Buffer.from('full'), mimetype: 'image/webp' },
        thumbnail: { buffer: Buffer.from('thumb'), mimetype: 'image/webp' },
    }),
}));

import { createClient } from '@/lib/supabase/server';

describe('Listing Image Upload & Deletion', () => {
    let mockSupabase: any;
    let mockRequest: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = {
            auth: {
                getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
            },
            from: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'listing-456' }, error: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn().mockReturnThis(),
            storage: {
                from: vi.fn().mockReturnThis(),
                upload: vi.fn().mockResolvedValue({ error: null }),
                remove: vi.fn().mockResolvedValue({ error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'mock-url' } }),
            },
        };
        (createClient as any).mockResolvedValue(mockSupabase);
    });

    function createMockRequest(files: { name: string; type: string; size: number }[] = []) {
        const formData = new FormData();
        for (const f of files) {
            const file = new File(['mock content'], f.name, { type: f.type });
            Object.defineProperty(file, 'size', { value: f.size });
            formData.append('files', file);
        }
        return {
            formData: vi.fn().mockResolvedValue(formData),
        } as unknown as Request;
    }

    describe('POST /api/listings/[id]/images/upload', () => {
        it('handles valid uploads and ordering', async () => {
            mockRequest = createMockRequest([{ name: 'test.png', type: 'image/png', size: 1024 }]);

            const response = await POST(mockRequest, { params: { id: 'listing-456' } });
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.message).toBe('Images uploaded successfully');
            expect(mockSupabase.storage.upload).toHaveBeenCalledTimes(2); // Full + thumb
            expect(mockSupabase.insert).toHaveBeenCalledTimes(1);
        });

        it('rejects invalid file type', async () => {
            mockRequest = createMockRequest([{ name: 'test.txt', type: 'text/plain', size: 1024 }]);

            const response = await POST(mockRequest, { params: { id: 'listing-456' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.errors).toBeDefined();
            expect(data.errors[0].error).toContain('Invalid file type');
        });

        it('rejects oversized files', async () => {
            mockRequest = createMockRequest([{ name: 'large.jpg', type: 'image/jpeg', size: 20 * 1024 * 1024 }]); // 20MB

            const response = await POST(mockRequest, { params: { id: 'listing-456' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.errors[0].error).toContain('File is too large');
        });

        it('handles storage failure by throwing inner error and returning 500', async () => {
            mockRequest = createMockRequest([{ name: 'test.jpg', type: 'image/jpeg', size: 1024 }]);
            mockSupabase.storage.upload.mockResolvedValueOnce({ error: { message: 'Storage full' } });

            const response = await POST(mockRequest, { params: { id: 'listing-456' } });
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain('Failed to upload');
        });

        it('cleans up storage artifacts if database insert fails', async () => {
            mockRequest = createMockRequest([{ name: 'test.jpg', type: 'image/jpeg', size: 1024 }]);
            mockSupabase.insert.mockResolvedValueOnce({ error: { message: 'DB error' } });

            const response = await POST(mockRequest, { params: { id: 'listing-456' } });
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toContain('Database error');
            expect(mockSupabase.storage.remove).toHaveBeenCalled(); // Should clean up
        });
    });

    describe('DELETE /api/listings/[id]/images/[imageId]', () => {
        it('handles deletion flow correctly', async () => {
            mockSupabase.single.mockResolvedValueOnce({ data: { id: 'listing-456' }, error: null }) // listing Check
                .mockResolvedValueOnce({ data: { id: 'img-789', url: 'full.jpg', thumbnail_url: 'thumb.jpg' }, error: null }); // image check

            const response = await DELETE({} as Request, { params: { id: 'listing-456', imageId: 'img-789' } });
            expect(response.status).toBe(200);
            expect(mockSupabase.storage.remove).toHaveBeenCalled();
            expect(mockSupabase.delete).toHaveBeenCalled();
        });
    });
});
