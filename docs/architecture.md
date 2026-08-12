# TexMoto M1–M3 architecture

## High-level design

TexMoto remains one deployable Next.js application. Server Components read through business-scoped data functions; authenticated Server Actions parse input and invoke explicit domain operations. PostgreSQL is the source of truth. External providers are downstream destinations and never control motorcycle state.

`routes/components → authenticated actions → business-scoped data services → domain rules/provider boundary → PostgreSQL/external API`

Telegram failure is isolated: it persists a failed publication but never rolls back or changes website availability.

## Multi-tenancy and private data

`Business` remains the tenant root. Users, motorcycles, integrations, publications, customers, reservations, and sales carry `businessId`. Admin actions derive the business from the authenticated session and never trust a browser-supplied tenant ID. Joins and mutations combine resource ID with `businessId`.

Public routes expose business identity and motorcycle listing data only. Customer, reservation, sale, internal notes, and integration credentials are never included in public reads.

## M2 publication model

`TelegramIntegration` is unique per business. It stores channel configuration, enabled state, and an AES-256-GCM encrypted bot token. `INTEGRATION_ENCRYPTION_KEY` is hashed to a fixed cipher key; random IVs and authentication tags are stored in the encrypted payload. Admin reads return a safe summary with no encrypted or plaintext token.

`Publication` is generic and unique on `(businessId, motorcycleId, channel)`. `channel` already includes `FACEBOOK` as a future extension point, but only the Telegram provider exists. Statuses are `PENDING`, `PUBLISHED`, and `FAILED`; external ID/URL, attempt time, safe error code/message, and publication time are retained.

The publishing operation:

1. Loads the motorcycle through `(id, authenticated businessId)`.
2. Requires `AVAILABLE`, normal website publish fields, at least one image, and an enabled integration.
3. Claims the canonical publication record with conflict-safe insertion or a conditional `FAILED → PENDING` retry.
4. Returns an existing `PUBLISHED` record without posting again.
5. Builds a pure localized caption with a stable public URL and only present specifications.
6. Calls `TelegramPublisher`.
7. Persists `PUBLISHED` metadata or a safe `FAILED` state.

Concurrent requests see the canonical `PENDING` record and fail with “already in progress” instead of creating a duplicate. An ambiguous provider/network response is recorded as failed; the owner should check the channel before retrying because Telegram does not offer an application idempotency key for these methods.

`TelegramPublisher` owns all Bot API HTTP calls. Single images use `sendPhoto`; multiple images use `sendMediaGroup` with the caption on the first item. It consumes public URLs, so deployments using private/local image URLs need a future upload-bytes fallback inside this provider—not in routes or domain code. A future Facebook provider can consume the same publication model without a large social abstraction.

## M3 customer and commerce model

`Customer` belongs to one business. Phone formatting accepts common Cambodian `0...`, `855...`, and `+855...` forms and stores a compact local representation. Phone is indexed but not unique: shared household/shop numbers are legitimate, and two businesses may always use the same number.

`MotorcycleReservation` preserves lightweight history. It can store a customer link later, but name and phone are enough to reserve. Statuses:

- `AVAILABLE → ACTIVE reservation + RESERVED motorcycle`
- cancellation: `ACTIVE → CANCELLED` and motorcycle returns to `AVAILABLE`
- sale: `ACTIVE → COMPLETED` and motorcycle becomes `SOLD`

`MotorcycleSale` snapshots listed price, actual selling price, currency, payment method, sold time, creator, and optional buyer/notes. `(businessId, motorcycleId)` is unique.

The sale operation runs in one PostgreSQL transaction:

1. Lock and business-scope the motorcycle.
2. Return an existing sale for an identical network retry.
3. Require `AVAILABLE` or `RESERVED` and a listed price.
4. Business-scope an existing customer or create a parsed new customer.
5. Create the immutable sale snapshot.
6. Set the motorcycle to `SOLD`.
7. Complete any active reservation.
8. Commit together.

The row lock and unique constraint prevent double sales. Generic status actions reject direct `RESERVED`/`SOLD` changes and refuse to reopen sold inventory.

## Public lifecycle behavior

- `AVAILABLE`: appears in storefront results and direct URL; contact actions are shown.
- `RESERVED`: omitted from results; stable direct URL displays a Reserved notice without inquiry actions.
- `SOLD`: omitted from results; stable direct URL displays a Sold notice without buyer, price history, or inquiry actions.
- `DRAFT` and `HIDDEN`: private and return not found publicly.

Telegram messages remain unchanged after reservation/sale in M3. Publication metadata keeps `externalPostId` for a future explicit and safe message-update operation. TexMoto remains authoritative.

## Money and dates

Existing PostgreSQL `numeric(14,2)` price storage is retained; application writes use decimal strings and never perform floating-point totals or conversion. USD and KHR remain separate currencies. Sale currency normally snapshots the motorcycle currency.

Timestamps use timezone-aware PostgreSQL columns and UTC instants. Formatting stays at UI boundaries instead of being spread through domain/data operations.

## Image storage and future service history

`ImageStorage` remains the image boundary. S3/R2 can replace local storage without changing commerce or publication logic.

Customer ownership history is derived from immutable sales. A future service-history module should link service records to `businessId`, `customerId`, and `motorcycleId` without modifying sale snapshots. No service entities are introduced in M3.
