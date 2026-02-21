import { UserFactory, ListingFactory } from '@/lib/test-utils';

/**
 * Standard test fixtures representing common scenarios.
 */
export const Fixtures = {
    /**
     * Represents a verified landlord user.
     */
    landlordUser: UserFactory.build({
        username: 'verified_landlord',
    }),

    /**
     * Represents a standard tenant user.
     */
    tenantUser: UserFactory.build({
        username: 'standard_tenant',
    }),

    /**
     * Represents a fully deployed, active rental listing.
     */
    activeListing: ListingFactory.buildDeployed(),
};
