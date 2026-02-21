import { faker } from '@faker-js/faker';
import type {
    Listing,
    ListingInsert,
    ListingStatus,
    ISOTimestamp,
    ContractId
} from '@/lib/types/database';

/**
 * Generates a mock Soroban Contract ID.
 * Contract IDs start with 'C' and are 56 characters long, base32 encoded.
 */
export const generateContractId = (): ContractId => {
    return `C${faker.string.alphanumeric({ length: 55, casing: 'upper' })}` as ContractId;
};

/**
 * Factory to generate mock Listing data for testing.
 */
export const ListingFactory = {
    /**
     * Generates a fully populated Listing object (as returned from DB).
     */
    build: (overrides?: Partial<Listing>): Listing => {
        const createdAt = faker.date.past().toISOString() as ISOTimestamp;
        const updatedAt = faker.date.recent().toISOString() as ISOTimestamp;

        return {
            id: faker.string.uuid(),
            landlord_id: faker.string.uuid(),
            title: faker.lorem.words(4),
            description: faker.lorem.paragraph(),
            address: faker.location.streetAddress(),
            rent_xlm: faker.number.int({ min: 100, max: 5000 }),
            bedrooms: faker.number.int({ min: 1, max: 5 }),
            bathrooms: faker.number.int({ min: 1, max: 3 }),
            furnished: faker.datatype.boolean(),
            pet_friendly: faker.datatype.boolean(),
            latitude: faker.location.latitude(),
            longitude: faker.location.longitude(),
            status: faker.helpers.arrayElement<ListingStatus>(['active', 'inactive', 'deleted']),
            created_at: createdAt,
            updated_at: updatedAt,
            ...overrides,
        };
    },

    /**
     * Generates an active Listing object with a contract ID.
     */
    buildDeployed: (overrides?: Partial<Listing>): Listing => {
        return ListingFactory.build({
            status: 'active',
            contract_id: generateContractId(),
            ...overrides,
        });
    },

    /**
     * Generates a Listing object suitable for database insertion (ListingInsert).
     */
    buildInsert: (overrides?: Partial<ListingInsert>): ListingInsert => {
        return {
            id: faker.string.uuid(),
            landlord_id: faker.string.uuid(),
            title: faker.lorem.words(4),
            description: faker.lorem.paragraph(),
            address: faker.location.streetAddress(),
            rent_xlm: faker.number.int({ min: 100, max: 5000 }),
            bedrooms: faker.number.int({ min: 1, max: 5 }),
            bathrooms: faker.number.int({ min: 1, max: 3 }),
            furnished: faker.datatype.boolean(),
            pet_friendly: faker.datatype.boolean(),
            latitude: faker.location.latitude(),
            longitude: faker.location.longitude(),
            status: 'active',
            contract_id: null,
            ...overrides,
        };
    },

    /**
     * Builds multiple Listing objects.
     */
    buildList: (count: number, overrides?: Partial<Listing>): Listing[] => {
        return Array.from({ length: count }, () => ListingFactory.build(overrides));
    },
};
