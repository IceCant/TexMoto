# TexMoto

TexMoto is a mobile-first motorcycle dealer platform for Cambodia. A shop creates a motorcycle once, publishes it to its website, Telegram channel, and Facebook Page, manages reservations, completes the sale, and retains the buyer and ownership history.

## Stack

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4
- PostgreSQL with Drizzle ORM
- Database-backed HTTP-only sessions and bcrypt password hashing
- AES-256-GCM encrypted integration credentials
- Pluggable local image storage and narrow Telegram/Facebook provider boundaries
- Zod boundary parsing and Vitest domain/database integration tests

## Local setup

Requirements: Node.js 20.9+ and PostgreSQL 15+.

1. Copy `.env.example` to `.env`.
2. Configure `DATABASE_URL` and a random `INTEGRATION_ENCRYPTION_KEY` of at least 32 characters.
3. Run `npm install`.
4. Run `npm run db:migrate`.
5. Run `npm run db:seed`.
6. Run `npm run dev`.

Demo login: `owner@texmoto.test` / `TexMoto123!`. Replace it before a real deployment.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `INTEGRATION_ENCRYPTION_KEY` | Social publishing | Encrypts Telegram and Facebook tokens at rest; use 32+ random characters and preserve it across releases |
| `NEXT_PUBLIC_APP_URL` | Production/social publishing | Canonical public origin used in captions and public image URLs |
| `META_GRAPH_API_VERSION` | Facebook | Graph API version configured for your Meta app, in `vXX.X` format |
| `SESSION_TTL_DAYS` | No | Session lifetime, default 30 days |
| `STORAGE_DRIVER` | No | `local` or `s3` (S3-compatible: AWS S3, Cloudflare R2, MinIO). Defaults to `local` |
| `S3_ENDPOINT` | `s3` driver | S3-compatible endpoint URL, e.g. `http://127.0.0.1:9000` (MinIO) or `https://<account>.r2.cloudflarestorage.com` (R2) |
| `S3_REGION` | No | S3 region, defaults to `us-east-1` |
| `S3_BUCKET` | `s3` driver | Storage bucket name; created automatically for MinIO-style endpoints |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | `s3` driver | Access key and secret for the bucket |
| `S3_FORCE_PATH_STYLE` | No | Set to `true` for MinIO and other path-style endpoints (default `true`, disable for most managed S3-compatible services) |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Multi-instance production | Stable Server Action key shared by instances |

### Storage drivers

`STORAGE_DRIVER=local` (default) writes uploaded photos under `public/uploads` on the application's own filesystem (or Docker container volume). This is convenient in dev and single-container setups, but the filesystem is ephemeral — it does not survive container recreation, is read-only on some production images, and is invisible to other instances.

`STORAGE_DRIVER=s3` stores photos in S3-compatible object storage and serves them through the app at `/s3/<key>`, so the bucket can stay private. It is the recommended driver for Docker and production:

```bash
docker compose up -d postgres minio   # MinIO runs at http://127.0.0.1:9000, console on :9001
```

Then set `STORAGE_DRIVER=s3`, `S3_ENDPOINT=http://127.0.0.1:9000`, `S3_BUCKET=texmoto`, and `minioadmin` as both access key and secret. The bucket is created on first upload. For AWS S3 or Cloudflare R2, keep `S3_FORCE_PATH_STYLE=false` and use your provider's endpoint and keys. When the app runs inside the same compose network, use `S3_ENDPOINT=http://minio:9000` and `S3_FORCE_PATH_STYLE=true`.

A real Telegram channel or Facebook cannot fetch a `localhost` image URL, so safe real-provider testing requires a deployed public origin (`NEXT_PUBLIC_APP_URL`) for both drivers.

## M1–M3 capabilities

- Secure multi-tenant inventory with drafts, ordered photos, and stable public URLs
- Backend-configured mobile storefront styles
- Public storefront and motorcycle detail pages
- Telegram bot/channel and Facebook Page configuration with encrypted credentials
- Automatic non-blocking fan-out after a motorcycle is published to the website
- Per-channel publication status, persisted safe errors, idempotency, and manual retry
- Lightweight reservations that retain history
- Transactional sales with buyer, historical listed/selling price, currency, payment method, and creator
- Customer ownership history and searchable customer list
- Sales history and a minimal monthly sales dashboard
- Public `RESERVED`/`SOLD` detail URLs while only `AVAILABLE` motorcycles appear in inventory results
- English/Khmer UI structure and bilingual Telegram captions

## Telegram setup

1. In Telegram, open `@BotFather`, run `/newbot`, and copy the resulting token.
2. Add the bot to the target channel as an administrator with permission to post messages.
3. In TexMoto, open **Settings → Integrations → Telegram**.
4. Enter the bot token and the channel username (for example `@texmoto`) or numeric channel ID.
5. Enable publishing and save. TexMoto encrypts the token and never displays it again.
6. Press **Test connection**.
7. New website publications now post automatically. The motorcycle detail screen also provides manual retry after a failure.

Do not commit tokens, log them, or reuse the local development encryption key in production. See [docs/telegram.md](docs/telegram.md) for troubleshooting and safe testing.

## Facebook Page setup

1. Create or select a Meta app that can manage the target Facebook Page.
2. Obtain a Page access token for that Page and note its numeric Page ID.
3. Set `META_GRAPH_API_VERSION` to the version configured in the Meta app dashboard.
4. In TexMoto, open **Settings → Integrations → Facebook Page**.
5. Enter the Page access token and Page ID, enable automatic publishing, and save.
6. Press **Test connection** before publishing inventory.

The integration targets Facebook Pages, not personal profiles. Meta app permissions, access-token lifetime, and production access must be configured in Meta. Public posting also requires `NEXT_PUBLIC_APP_URL` and all motorcycle image URLs to be reachable by Facebook; `localhost` images cannot be fetched by Meta.

## Reservation and sale workflow

- `AVAILABLE → Reserve` records a lightweight name/phone reservation and changes the motorcycle to `RESERVED`.
- Cancelling an active reservation retains it as `CANCELLED` and returns the motorcycle to `AVAILABLE`.
- `AVAILABLE` or `RESERVED → Complete sale` accepts an existing or new customer, selling price, and payment method.
- The sale transaction creates/fetches the buyer, snapshots prices, marks the motorcycle `SOLD`, and completes the active reservation atomically.
- A unique sale constraint and idempotent application flow prevent duplicate sales.
- Sold motorcycles cannot be casually reopened.

## Commands

- `npm run dev` — development server
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript checks
- `npm test` — domain and PostgreSQL integration tests
- `npm run db:generate` — generate a new migration
- `npm run db:migrate` — apply migrations
- `npm run db:seed` — seed demo data
- `npm run build` — production build

## Explicitly out of scope

Instagram publishing, social scheduling/analytics, parts, POS, KHQR verification, online checkout, financing/installments, customer accounts, service/repair history, mechanics, loyalty, payroll, multi-branch UI, advanced analytics, and AI-generated descriptions are not implemented.

See [docs/architecture.md](docs/architecture.md) for data flow, security boundaries, and state transitions.
