# Facebook Page publishing

TexMoto publishes an `AVAILABLE` motorcycle to a configured Facebook Page after the website mutation returns. Telegram and Facebook run independently, and each result is stored in `publications`. A failed Facebook request never rolls back the website listing or a successful Telegram post.

## Configuration

- Set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin.
- Set `META_GRAPH_API_VERSION` to the version configured for your Meta app.
- Open **Admin → Settings → Integrations → Facebook Page**.
- Save the numeric Page ID and a Page access token, enable automatic publishing, then test the connection.

The token is encrypted with `INTEGRATION_ENCRYPTION_KEY`. It is never returned by settings queries or rendered back into the form.

## Publication behavior

- One photo is created as a Page photo post with the listing caption.
- Multiple photos are uploaded unpublished and attached to one Page feed post, up to ten photos.
- The bilingual caption includes motorcycle details, shop contact information, and the stable public listing URL.
- A unique business/motorcycle/channel record prevents duplicate automatic or manual posts.
- Authentication, permission, Page access, media, and network failures are stored as safe messages and can be retried from the motorcycle detail page.

## Production notes

- The integration supports Facebook Pages, not personal profiles.
- Page access and production publishing depend on the Meta app and Page configuration. Follow the current workflow shown in the Meta developer dashboard for the selected Graph API version.
- Meta must be able to fetch every photo URL. Localhost and private storage URLs will fail.
- Next.js `after()` keeps automatic publishing outside the page response, but it is not a durable job queue. For high-volume or multi-instance production, replace the scheduler boundary with a persistent queue and worker while keeping the provider/data interfaces.
