import { UserFactory, ListingFactory, MessageFactory, PaymentFactory } from '../../lib/test-utils';

describe('Test Data Factories', () => {
    it('generates realistic User data', () => {
        const user = UserFactory.build();
        expect(user.id).toBeDefined();
        expect(user.public_key.startsWith('G')).toBe(true);
        expect(user.email).toContain('@');
    });

    it('supports customization of User data', () => {
        const user = UserFactory.build({ username: 'custom_user' });
        expect(user.username).toBe('custom_user');
    });

    it('generates realistic Listing data', () => {
        const listing = ListingFactory.build();
        expect(listing.id).toBeDefined();
        expect(listing.landlord_id).toBeDefined();
        expect(listing.rent_xlm).toBeGreaterThanOrEqual(100);
    });

    it('supports relationships between entities', () => {
        // Generate a landlord
        const landlord = UserFactory.build();

        // Generate a listing linked to that landlord
        const listing = ListingFactory.build({ landlord_id: landlord.id });
        expect(listing.landlord_id).toBe(landlord.id);

        // Generate a tenant
        const tenant = UserFactory.build();

        // Generate a message from tenant to landlord
        const message = MessageFactory.build({
            sender_id: tenant.id,
            conversation_id: faker_placeholder() // Will just use a UUID in the factory
        });
        expect(message.sender_id).toBe(tenant.id);

        // Generate a payment for the listing from the tenant
        const payment = PaymentFactory.build({
            listing_id: listing.id,
            tenant_id: tenant.id,
            amount_xlm: listing.rent_xlm,
        });
        expect(payment.listing_id).toBe(listing.id);
        expect(payment.tenant_id).toBe(tenant.id);
        expect(payment.amount_xlm).toBe(listing.rent_xlm);
    });

    it('generates lists of mock objects', () => {
        const listings = ListingFactory.buildList(3);
        expect(listings.length).toBe(3);
        expect(listings[0].id).not.toBe(listings[1].id);
    });
});

// Helper for the test just to get a unique id without needing to import faker
function faker_placeholder() {
    return 'conv-1234';
}
