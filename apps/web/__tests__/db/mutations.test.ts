import { createUser, createListing, updateListing, deleteListing, executeTransaction } from '@/lib/db/mutations';
import { createMockSupabaseClient } from '../../__mocks__/supabaseMock';

describe('Database Mutations', () => {
    let mockSupabase: any;
    let mockClient: any;
    let mockFrom: any;
    let mockInsert: any;
    let mockSelect: any;
    let mockEq: any;

    beforeEach(() => {
        mockSupabase = createMockSupabaseClient();
        mockClient = mockSupabase.mockClient;
        mockFrom = mockSupabase.mockFrom;
        mockInsert = mockSupabase.mockInsert;
        mockSelect = mockSupabase.mockSelect;
        mockEq = mockSupabase.mockEq;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createUser', () => {
        it('should insert and return a user successfully', async () => {
            const mockUser = { id: 'u1', username: 'testuser' };
            const userData = { username: 'testuser' };

            const mockSingle = jest.fn().mockResolvedValue({ data: mockUser, error: null });
            mockSelect.mockReturnValue({ single: mockSingle });

            const result = await createUser(mockClient, userData);

            expect(mockFrom).toHaveBeenCalledWith('users');
            expect(mockInsert).toHaveBeenCalledWith(userData);
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockSingle).toHaveBeenCalled();
            expect(result).toEqual(mockUser);
        });

        it('should throw an error if insertion fails', async () => {
            const mockError = { message: 'Duplicate key' };
            const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
            mockSelect.mockReturnValue({ single: mockSingle });

            await expect(createUser(mockClient, { username: 'test' })).rejects.toThrow('Failed to create user: Duplicate key');
        });
    });

    describe('createListing', () => {
        it('should insert and return a listing successfully', async () => {
            const mockListing = { id: 'l1', title: 'Test Listing' };
            const listingData = { title: 'Test Listing' };

            const mockSingle = jest.fn().mockResolvedValue({ data: mockListing, error: null });
            mockSelect.mockReturnValue({ single: mockSingle });

            const result = await createListing(mockClient, listingData as any);

            expect(mockFrom).toHaveBeenCalledWith('listings');
            expect(mockInsert).toHaveBeenCalledWith(listingData);
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockSingle).toHaveBeenCalled();
            expect(result).toEqual(mockListing);
        });

        it('should throw an error if insertion fails', async () => {
            const mockError = { message: 'Validation failed' };
            const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
            mockSelect.mockReturnValue({ single: mockSingle });

            await expect(createListing(mockClient, {} as any)).rejects.toThrow('Failed to create listing: Validation failed');
        });
    });

    describe('updateListing', () => {
        it('should update and return a listing successfully', async () => {
            const mockUpdate = jest.fn();
            const mockListing = { id: 'l1', title: 'Updated Title' };
            const updateData = { title: 'Updated Title' };

            const mockSingle = jest.fn().mockResolvedValue({ data: mockListing, error: null });
            mockSelect.mockReturnValue({ single: mockSingle });
            mockEq.mockReturnValue({ select: mockSelect });
            mockUpdate.mockReturnValue({ eq: mockEq });

            mockFrom.mockReturnValue({ update: mockUpdate, select: mockSelect, insert: mockInsert });

            const result = await updateListing(mockClient, 'l1', updateData as any);

            expect(mockFrom).toHaveBeenCalledWith('listings');
            expect(mockUpdate).toHaveBeenCalledWith(updateData);
            expect(mockEq).toHaveBeenCalledWith('id', 'l1');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockSingle).toHaveBeenCalled();
            expect(result).toEqual(mockListing);
        });

        it('should throw an error if update fails', async () => {
            const mockUpdate = jest.fn();
            const mockError = { message: 'Row not found' };

            const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
            mockSelect.mockReturnValue({ single: mockSingle });
            mockEq.mockReturnValue({ select: mockSelect });
            mockUpdate.mockReturnValue({ eq: mockEq });

            mockFrom.mockReturnValue({ update: mockUpdate, select: mockSelect, insert: mockInsert });

            await expect(updateListing(mockClient, 'l1', {} as any)).rejects.toThrow('Failed to update listing: Row not found');
        });
    });

    describe('deleteListing', () => {
        it('should delete a listing successfully', async () => {
            const mockDelete = jest.fn();
            mockEq.mockResolvedValue({ error: null });
            mockDelete.mockReturnValue({ eq: mockEq });
            mockFrom.mockReturnValue({ delete: mockDelete, update: jest.fn(), select: mockSelect, insert: mockInsert });

            await deleteListing(mockClient, 'l1');

            expect(mockFrom).toHaveBeenCalledWith('listings');
            expect(mockDelete).toHaveBeenCalled();
            expect(mockEq).toHaveBeenCalledWith('id', 'l1');
        });

        it('should throw an error if deletion fails', async () => {
            const mockDelete = jest.fn();
            const mockError = { message: 'Cannot delete' };
            mockEq.mockResolvedValue({ error: mockError });
            mockDelete.mockReturnValue({ eq: mockEq });
            mockFrom.mockReturnValue({ delete: mockDelete, update: jest.fn(), select: mockSelect, insert: mockInsert });

            await expect(deleteListing(mockClient, 'l1')).rejects.toThrow('Failed to delete listing: Cannot delete');
        });
    });

    describe('executeTransaction', () => {
        it('should execute RPC successfully', async () => {
            const rpcName = 'process_payment';
            const payload = { amount: 100 };
            const mockResponse = { success: true };

            mockClient.rpc = jest.fn().mockResolvedValue({ data: mockResponse, error: null });

            const result = await executeTransaction(mockClient, rpcName, payload);

            expect(mockClient.rpc).toHaveBeenCalledWith(rpcName, payload);
            expect(result).toEqual(mockResponse);
        });

        it('should throw an error if RPC fails', async () => {
            const rpcName = 'process_payment';
            const payload = { amount: 100 };
            const mockError = { message: 'RPC Error' };

            mockClient.rpc = jest.fn().mockResolvedValue({ data: null, error: mockError });

            await expect(executeTransaction(mockClient, rpcName, payload)).rejects.toThrow('Transaction failed: RPC Error');
        });
    });
});
