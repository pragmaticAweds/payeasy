import { faker } from '@faker-js/faker';
import type { User, UserInsert, StellarPublicKey, ISOTimestamp } from '@/lib/types/database';

/**
 * Generates a mock Stellar public key.
 * Stellar public keys start with 'G' and are 56 characters long, base32 encoded.
 */
export const generateStellarPublicKey = (): StellarPublicKey => {
    return `G${faker.string.alphanumeric({ length: 55, casing: 'upper' })}` as StellarPublicKey;
};

/**
 * Factory to generate mock User data for testing.
 */
export const UserFactory = {
    /**
     * Generates a fully populated User object (as returned from DB).
     */
    build: (overrides?: Partial<User>): User => {
        const createdAt = faker.date.past().toISOString() as ISOTimestamp;
        const updatedAt = faker.date.recent().toISOString() as ISOTimestamp;

        return {
            id: faker.string.uuid(),
            public_key: generateStellarPublicKey(),
            username: faker.person.firstName().toLowerCase() + faker.string.numeric(4),
            email: faker.internet.email(),
            avatar_url: faker.image.avatar(),
            bio: faker.lorem.sentence(),
            created_at: createdAt,
            updated_at: updatedAt,
            ...overrides,
        };
    },

    /**
     * Generates a User object suitable for database insertion (UserInsert).
     */
    buildInsert: (overrides?: Partial<UserInsert>): UserInsert => {
        return {
            id: faker.string.uuid(),
            public_key: generateStellarPublicKey(),
            username: faker.person.firstName().toLowerCase() + faker.string.numeric(4),
            email: faker.internet.email(),
            avatar_url: faker.image.avatar(),
            bio: faker.lorem.sentence(),
            ...overrides,
        };
    },

    /**
     * Builds multiple User objects.
     */
    buildList: (count: number, overrides?: Partial<User>): User[] => {
        return Array.from({ length: count }, () => UserFactory.build(overrides));
    },
};
