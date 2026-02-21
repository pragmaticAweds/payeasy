import { NextRequest } from 'next/server';
import { successResponse, errorResponse, getUserId } from '@/lib/api-utils';
import { verifyJwt } from '@/lib/auth/stellar-auth';

// Add globals that next/server expects in Next 14+ when imported outside Next runtime
global.Response = class Response {
    static json = jest.fn()
} as any;
global.Request = class Request { } as any;

jest.mock('@/lib/auth/stellar-auth', () => ({
    verifyJwt: jest.fn(),
}));

describe('api-utils', () => {
    let responseJsonSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        responseJsonSpy = jest.spyOn(Response, 'json');
    });

    afterEach(() => {
        responseJsonSpy.mockRestore();
    });

    describe('successResponse', () => {
        it('returns a successful JSON response with default 200 status', () => {
            const data = { foo: 'bar' };
            const response = successResponse(data);
            expect(responseJsonSpy).toHaveBeenCalledWith(
                { success: true, data },
                { status: 200 }
            );
            // Since we mocked Response.json directly, it won't return an actual Response
            // but we can at least assert it was called correctly.
        });

        it('returns a successful JSON response with custom status', () => {
            const data = { created: true };
            successResponse(data, 201);

            expect(responseJsonSpy).toHaveBeenCalledWith(
                { success: true, data },
                { status: 201 }
            );
        });
    });

    describe('errorResponse', () => {
        it('returns an error JSON response with default 400 status', () => {
            const response = errorResponse('Bad Request');

            expect(responseJsonSpy).toHaveBeenCalledWith(
                { success: false, error: { message: 'Bad Request' } },
                { status: 400 }
            );
        });

        it('includes a custom code if provided', () => {
            errorResponse('Not Found', 404, 'ERR_NOT_FOUND');

            expect(responseJsonSpy).toHaveBeenCalledWith(
                { success: false, error: { message: 'Not Found', code: 'ERR_NOT_FOUND' } },
                { status: 404 }
            );
        });
    });

    describe('getUserId', () => {
        it('extracts user ID from auth-token cookie', () => {
            const mockRequest = {
                cookies: {
                    get: jest.fn().mockReturnValue({ value: 'mock-jwt-token' }),
                },
            } as unknown as NextRequest;

            (verifyJwt as jest.Mock).mockReturnValue({ sub: 'user-123' });

            const userId = getUserId(mockRequest);
            expect(userId).toBe('user-123');
            expect(mockRequest.cookies.get).toHaveBeenCalledWith('auth-token');
            expect(verifyJwt).toHaveBeenCalledWith('mock-jwt-token');
        });

        it('extracts user ID from Authorization header', () => {
            const mockRequest = {
                headers: {
                    get: jest.fn().mockReturnValue('Bearer mock-header-token'),
                },
            } as unknown as Request;

            (verifyJwt as jest.Mock).mockReturnValue({ sub: 'user-456' });

            const userId = getUserId(mockRequest);
            expect(userId).toBe('user-456');
            expect(mockRequest.headers.get).toHaveBeenCalledWith('authorization');
            expect(verifyJwt).toHaveBeenCalledWith('mock-header-token');
        });

        it('returns null if no token is found', () => {
            const mockRequest = {
                cookies: {
                    get: jest.fn().mockReturnValue(undefined),
                },
                headers: {
                    get: jest.fn().mockReturnValue(null),
                },
            } as unknown as NextRequest;

            const userId = getUserId(mockRequest);
            expect(userId).toBeNull();
            expect(verifyJwt).not.toHaveBeenCalled();
        });

        it('returns null if token is invalid or missing sub', () => {
            const mockRequest = {
                headers: {
                    get: jest.fn().mockReturnValue('Bearer bad-token'),
                },
            } as unknown as Request;

            (verifyJwt as jest.Mock).mockReturnValue({ other_claim: true });

            const userId = getUserId(mockRequest);
            expect(userId).toBeNull();
        });
    });
});
