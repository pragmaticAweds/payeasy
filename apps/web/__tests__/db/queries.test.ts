import { getUserById, getListingById, getTransactionsByUserId } from '@/lib/db/queries';
import { createMockSupabaseClient } from '../../__mocks__/supabaseMock';

describe('Database Queries', () => {
    let mockSupabase: any;
    let mockClient: any;
    let mockFrom: any;
    let mockSelect: any;
    let mockEq: any;
    let mockOrder: any;

    beforeEach(() => {
        mockSupabase = createMockSupabaseClient();
        mockClient = mockSupabase.mockClient;
        mockFrom = mockSupabase.mockFrom;
        mockSelect = mockSupabase.mockSelect;
        mockEq = mockSupabase.mockEq;
        mockOrder = mockSupabase.mockOrder;

        // Ensure mockSelect properly chains eq and order in this test
        // Overrides the base mock structure since queries specifically does .from().select().eq().single()
        mockSelect.mockReturnValue({
            eq: mockEq,
            order: mockOrder
        });

        // Ensure mockEq returns single and order
        mockEq.mockReturnValue({
            single: jest.fn(),
            order: mockOrder
        });

        // Ensure mockFrom returns select
        mockFrom.mockReturnValue({
            select: mockSelect
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserById', () => {
        it('should retrieve a user successfully', async () => {
            const mockUser = { id: 'u1', username: 'testuser' };

            const mockSingle = jest.fn().mockResolvedValue({ data: mockUser, error: null });
            mockEq.mockReturnValue({ single: mockSingle });

            const result = await getUserById(mockClient, 'u1');

            expect(mockFrom).toHaveBeenCalledWith('users');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockEq).toHaveBeenCalledWith('id', 'u1');
            expect(mockSingle).toHaveBeenCalled();
            expect(result).toEqual(mockUser);
        });

        it('should throw an error if retrieval fails', async () => {
            const mockError = { message: 'User not found' };
            const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
            mockEq.mockReturnValue({ single: mockSingle });

            await expect(getUserById(mockClient, 'u1')).rejects.toThrow('Failed to fetch user: User not found');
        });
    });

    describe('getListingById', () => {
        it('should retrieve a listing successfully', async () => {
            const mockListing = { id: 'l1', title: 'Test Listing' };

            const mockSingle = jest.fn().mockResolvedValue({ data: mockListing, error: null });
            mockEq.mockReturnValue({ single: mockSingle });

            const result = await getListingById(mockClient, 'l1');

            expect(mockFrom).toHaveBeenCalledWith('listings');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockEq).toHaveBeenCalledWith('id', 'l1');
            expect(mockSingle).toHaveBeenCalled();
            expect(result).toEqual(mockListing);
        });

        it('should throw an error if retrieval fails', async () => {
            const mockError = { message: 'Listing not found' };
            const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
            mockEq.mockReturnValue({ single: mockSingle });

            await expect(getListingById(mockClient, 'l1')).rejects.toThrow('Failed to fetch listing: Listing not found');
        });
    });

    describe('getTransactionsByUserId', () => {
        it('should retrieve transactions successfully', async () => {
            const mockTransactions = [{ id: 't1', amount_paid: 100 }];

            mockOrder.mockResolvedValue({ data: mockTransactions, error: null });

            const result = await getTransactionsByUserId(mockClient, 'u1');

            expect(mockFrom).toHaveBeenCalledWith('contract_transactions');
            expect(mockSelect).toHaveBeenCalledWith('*');
            expect(mockEq).toHaveBeenCalledWith('user_id', 'u1');
            expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
            expect(result).toEqual(mockTransactions);
        });

        it('should throw an error if retrieval fails', async () => {
            const mockError = { message: 'Database error' };
            mockOrder.mockResolvedValue({ data: null, error: mockError });

            await expect(getTransactionsByUserId(mockClient, 'u1')).rejects.toThrow('Failed to fetch transactions: Database error');
        });
    });
});
