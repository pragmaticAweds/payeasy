# RentChain — Supabase Migration Files

Run these files **in order** by pasting each one into:
**Supabase Dashboard → SQL Editor → New Query → Run**

---

## Order


| #   | File                                 | What it does                  |
| --- | ------------------------------------ | ----------------------------- |
| 1   | `20240101000001_create_tables.sql`   | Creates all 8 tables          |
| 2   | `20240101000002_seed_amenities.sql`  | Seeds 25 amenities            |
| 3   | `20240101000003_create_indexes.sql`  | Adds 25+ indexes              |
| 4   | `20240101000004_rls_policies.sql`    | Enables RLS + policies        |
| 5   | `20240101000005_create_triggers.sql` | Adds triggers + RPC functions |

| # | File | What it does |
|---|------|--------------|
| 1 | `20240101000001_create_tables.sql` | Creates all 8 tables |
| 2 | `20240101000002_seed_amenities.sql` | Seeds 25 amenities |
| 3 | `20240101000003_create_indexes.sql` | Adds 25+ indexes |
| 4 | `20240101000004_rls_policies.sql` | Enables RLS + policies |
| 5 | `20240101000005_create_triggers.sql` | Adds triggers + RPC functions |

---

## Tables Created

- `users` — profiles linked to Stellar wallets
- `listings` — rental properties with PostGIS location
- `amenities` — master amenity list (pre-seeded)
- `listing_amenities` — junction: which amenities each listing has
- `listing_images` — photos for each listing
- `messages` — direct messages between users
- `payment_records` — on-chain Stellar payment history
- `rent_agreements` — smart contract rental agreements

---

## After Running

Check **Table Editor** in Supabase — you should see all 8 tables.

To test radius search in Postman:


```
POST https://your-project.supabase.co/rest/v1/rpc/listings_within_radius
Body: { "lat": 6.4281, "lng": 3.4219, "radius_km": 5 }
```

```
POST https://your-project.supabase.co/rest/v1/rpc/listings_within_radius
Body: { "lat": 6.4281, "lng": 3.4219, "radius_km": 5 }
```

