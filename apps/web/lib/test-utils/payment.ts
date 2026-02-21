import { faker } from '@faker-js/faker';
import type {
    PaymentRecord,
    PaymentRecordInsert,
    PaymentStatus,
    ISOTimestamp
} from '@/lib/types/database';

/**
 * Factory to generate mock PaymentRecord data for testing.
 */
export const PaymentFactory = {
    /**
     * Generates a fully populated PaymentRecord object.
     */
    build: (overrides?: Partial<PaymentRecord>): PaymentRecord => {
        const createdAt = faker.date.recent().toISOString() as ISOTimestamp;
        const year = faker.date.recent().getFullYear();
        const month = String(faker.date.recent().getMonth() + 1).padStart(2, '0');

        return {
            id: faker.string.uuid(),
            listing_id: faker.string.uuid(),
            tenant_id: faker.string.uuid(),
            amount_xlm: faker.number.int({ min: 100, max: 5000 }),
            transaction_hash: faker.string.hexadecimal({ length: 64, prefix: '' }).toLowerCase(),
            stellar_ledger: faker.number.int({ min: 1000000, max: 5000000 }),
            status: faker.helpers.arrayElement<PaymentStatus>(['pending', 'confirmed', 'failed']),
            payment_period: `${year}-${month}`,
            created_at: createdAt,
            confirmed_at: undefined,
            ...overrides,
        };
    },

    /**
     * Generates a confirmed PaymentRecord object.
     */
    buildConfirmed: (overrides?: Partial<PaymentRecord>): PaymentRecord => {
        return PaymentFactory.build({
            status: 'confirmed',
            confirmed_at: faker.date.recent().toISOString() as ISOTimestamp,
            ...overrides,
        });
    },

    /**
     * Generates a PaymentRecord object suitable for database insertion.
     */
    buildInsert: (overrides?: Partial<PaymentRecordInsert>): PaymentRecordInsert => {
        const year = faker.date.recent().getFullYear();
        const month = String(faker.date.recent().getMonth() + 1).padStart(2, '0');

        return {
            id: faker.string.uuid(),
            listing_id: faker.string.uuid(),
            tenant_id: faker.string.uuid(),
            amount_xlm: faker.number.int({ min: 100, max: 5000 }),
            transaction_hash: faker.string.hexadecimal({ length: 64, prefix: '' }).toLowerCase(),
            status: 'pending',
            payment_period: `${year}-${month}`,
            stellar_ledger: null,
            confirmed_at: null,
            ...overrides,
        };
    },

    /**
     * Builds multiple PaymentRecord objects.
     */
    buildList: (count: number, overrides?: Partial<PaymentRecord>): PaymentRecord[] => {
        return Array.from({ length: count }, () => PaymentFactory.build(overrides));
    },
};
