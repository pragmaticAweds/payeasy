# Input Validation and Sanitization

This module provides comprehensive input validation and sanitization to protect against injection attacks and ensure data integrity.

## Features

- ✅ **Zod Schema Validation** - Type-safe validation with automatic type inference
- ✅ **HTML Sanitization** - Prevent XSS attacks using `sanitize-html`
- ✅ **SQL Injection Prevention** - Defense-in-depth alongside parameterized queries
- ✅ **Length Limits** - Enforce maximum and minimum input lengths
- ✅ **Format Validation** - Email, URL, phone, Stellar addresses, etc.
- ✅ **Safe Error Messages** - Error messages are escaped to prevent injection
- ✅ **Suspicious Pattern Detection** - Detect potentially malicious input patterns

## Quick Start

```typescript
import { 
  emailSchema, 
  passwordSchema, 
  validateInput,
  sanitizeHTML,
  sanitizePlainText 
} from '@/lib/validation/input';

// Validate user input
const result = validateInput(emailSchema, userInput);

if (result.success) {
  const email = result.data; // Type-safe, sanitized email
} else {
  console.error(result.errors); // { email: "Invalid email format" }
}
```

## Common Schemas

### Authentication

```typescript
import { 
  emailSchema, 
  usernameSchema, 
  passwordSchema,
  stellarPublicKeySchema 
} from '@/lib/validation/input';

// Registration form
const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  walletAddress: stellarPublicKeySchema.optional(),
});
```

### Content

```typescript
import { 
  titleSchema, 
  descriptionSchema, 
  messageContentSchema 
} from '@/lib/validation/input';

// Listing creation
const listingSchema = z.object({
  title: titleSchema,
  description: descriptionSchema, // Allows safe HTML
  price: priceSchema,
});

// Messages (plain text only)
const messageSchema = z.object({
  content: messageContentSchema, // Strips all HTML
  recipientId: uuidSchema,
});
```

### Pagination

```typescript
import { paginationSchema } from '@/lib/validation/input';

const params = validateInput(paginationSchema, {
  page: queryParams.page,
  pageSize: queryParams.pageSize,
});
```

## Sanitization Functions

### HTML Sanitization

```typescript
import { sanitizeHTML, sanitizePlainText } from '@/lib/validation/input';

// Allow safe HTML tags (p, strong, em, etc.)
const safeHTML = sanitizeHTML(userInput);

// Strip all HTML tags
const plainText = sanitizePlainText(userInput);
```

### Search Query Sanitization

```typescript
import { sanitizeSearchQuery, searchQuerySchema } from '@/lib/validation/input';

// Sanitize search input
const query = sanitizeSearchQuery(userInput);

// Or validate with schema
const result = validateInput(searchQuerySchema, userInput);
```

## API Endpoint Example

```typescript
// app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { titleSchema, descriptionSchema, priceSchema, validateInput } from '@/lib/validation/input';
import { z } from 'zod';

const createListingSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  price: priceSchema,
  address: addressSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateInput(createListingSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.errors },
        { status: 400 }
      );
    }
    
    const { title, description, price, address } = validation.data;
    
    // Data is now validated and sanitized
    // Safe to use in database queries (with parameterized queries)
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Security Best Practices

### 1. Always Validate Input

```typescript
// ❌ Bad - Using raw user input
const email = request.body.email;

// ✅ Good - Validate first
const result = validateInput(emailSchema, request.body.email);
if (!result.success) {
  throw new Error('Invalid email');
}
const email = result.data;
```

### 2. Sanitize HTML Content

```typescript
// ❌ Bad - Rendering unsanitized HTML
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ Good - Sanitize first
import { sanitizeHTML } from '@/lib/validation/input';
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userContent) }} />
```

### 3. Use Parameterized Queries

```typescript
// ❌ Bad - String concatenation (SQL injection risk)
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ Good - Parameterized query
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email); // Supabase handles escaping
```

### 4. Check for Suspicious Patterns

```typescript
import { containsSuspiciousPatterns } from '@/lib/validation/input';

if (containsSuspiciousPatterns(userInput)) {
  // Log security event
  console.warn('Suspicious input detected:', { userInput });
  return { error: 'Invalid input' };
}
```

### 5. Safe Error Messages

```typescript
import { createSafeError } from '@/lib/validation/input';

// ❌ Bad - Might leak sensitive info
return { error: `User ${email} not found in database table ${tableName}` };

// ✅ Good - Generic, safe message
return createSafeError('Invalid credentials');
```

## Input Limits Reference

```typescript
export const INPUT_LIMITS = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  EMAIL_MAX: 254,
  NAME_MAX: 100,
  TITLE_MAX: 200,
  DESCRIPTION_MAX: 5000,
  MESSAGE_MAX: 5000,
  ADDRESS_MAX: 500,
  PHONE_MAX: 20,
  URL_MAX: 2048,
  SEARCH_QUERY_MAX: 200,
  STELLAR_ADDRESS_LENGTH: 56,
};
```

## Testing Injection Attempts

```typescript
import { containsSuspiciousPatterns, validateInput } from '@/lib/validation/input';

// Test cases
const injectionAttempts = [
  '<script>alert("XSS")</script>',
  '"; DROP TABLE users; --',
  'javascript:alert(1)',
  '<img src=x onerror=alert(1)>',
  "' OR '1'='1",
  '../../../etc/passwd',
];

injectionAttempts.forEach(attempt => {
  const isSuspicious = containsSuspiciousPatterns(attempt);
  console.log(`Input: ${attempt}, Suspicious: ${isSuspicious}`);
});
```

## Custom Validation

```typescript
import { z } from 'zod';
import { sanitizePlainText } from '@/lib/validation/input';

// Create custom schema
const customSchema = z
  .string()
  .min(5)
  .max(100)
  .regex(/^[A-Z]/, 'Must start with uppercase letter')
  .transform(sanitizePlainText);

// Use with validateInput
const result = validateInput(customSchema, userInput);
```

## Performance Considerations

- ✅ Validation is synchronous and fast (<1ms for most schemas)
- ✅ HTML sanitization is optimized for performance
- ✅ Schemas are reusable (compile once, use many times)
- ✅ Transformations (sanitization) happen during validation

## Maintenance

### Adding New Schemas

1. Add constants to `INPUT_LIMITS` if needed
2. Create Zod schema with appropriate validation rules
3. Add `.transform(sanitizePlainText)` or `.transform(sanitizeHTML)`
4. Export schema and inferred type
5. Document in this README

### Updating HTML Sanitization Rules

Edit `ALLOWED_HTML_TAGS` and `ALLOWED_HTML_ATTRIBUTES` in `input.ts`:

```typescript
const ALLOWED_HTML_TAGS = [
  'p', 'br', 'strong', 'em', // ... add more safe tags
];
```

## Related Files

- [`input.ts`](./input.ts) - Main validation module
- [`../validators/auth.ts`](../validators/auth.ts) - Auth-specific validators (legacy)
- [`../validators/messages.ts`](../validators/messages.ts) - Message validators (legacy)

## Migration from Legacy Validators

Old validators in `lib/validators/` can be gradually migrated to use schemas from this module:

```typescript
// Before (lib/validators/auth.ts)
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// After (using shared schemas)
import { emailSchema, passwordSchema } from '@/lib/validation/input';

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
```

## Security Audit Checklist

- [x] All user inputs validated with Zod schemas
- [x] HTML content sanitized before storage/display
- [x] Length limits enforced on all text inputs
- [x] Email, URL, phone formats validated
- [x] Stellar addresses validated with regex
- [x] SQL injection prevention (parameterized queries + validation)
- [x] XSS prevention (HTML sanitization)
- [x] Path traversal prevention (filename validation)
- [x] Error messages sanitized
- [x] Suspicious pattern detection
- [x] Type safety with TypeScript + Zod
- [x] Comprehensive documentation

## Resources

- [Zod Documentation](https://zod.dev/)
- [sanitize-html](https://github.com/apostrophecms/sanitize-html)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
