# Telegram setup and troubleshooting

## Create and authorize the bot

1. Message `@BotFather` and run `/newbot`.
2. Store the returned token securely.
3. Add the bot to the shop channel as an administrator.
4. Grant permission to post messages.
5. Use the public username such as `@texmoto`, or the numeric channel ID such as `-1001234567890`.

In TexMoto, open **Settings → Integrations → Telegram**, enter the token and channel, enable the integration, save, and then test the connection.

## Safe test procedure

- Use a private test channel first.
- Use a non-production bot token.
- Ensure `NEXT_PUBLIC_APP_URL` is an HTTPS URL reachable by Telegram.
- Ensure motorcycle image URLs are publicly reachable without authentication.
- Publish one available demo motorcycle, confirm all photos/caption/link, then delete the test post in Telegram if desired.
- Never paste the token into issue trackers, screenshots, logs, or chat.

Automated tests replace the provider with an in-memory mock. They do not contact Telegram.

## Common errors

**Bot cannot post to this channel**

Confirm the channel value and make the bot an administrator with post permission.

**Telegram bot authentication failed**

Generate or copy the token again from BotFather, then save it again. TexMoto never redisplays an existing token.

**Image/media error**

Open the image URL from a private browser. `localhost`, private network hosts, authenticated URLs, and ephemeral files cannot be fetched by Telegram.

**Network or ambiguous failure**

Check the Telegram channel before pressing Retry. TexMoto records the failed attempt and reuses the same publication record, but Telegram does not accept TexMoto's own idempotency key. If the HTTP outcome was ambiguous, checking first avoids a potential duplicate external post.

## Secret rotation

Changing `INTEGRATION_ENCRYPTION_KEY` makes existing encrypted tokens unreadable. Plan key rotation explicitly: retain the old key during migration or require owners to re-enter tokens. Do not casually replace it during deployment.
