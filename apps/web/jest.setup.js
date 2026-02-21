require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

if (typeof global.Request === 'undefined') {
    global.Request = class Request { };
}
if (typeof global.Response === 'undefined') {
    global.Response = class Response { };
}
if (typeof global.Headers === 'undefined') {
    global.Headers = class Headers { };
}

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));
