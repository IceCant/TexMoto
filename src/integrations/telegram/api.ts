import "server-only";

import { TelegramProviderError, type TelegramConnection, type TelegramPublishInput, type TelegramPublisher } from "@/integrations/telegram/types";

type TelegramResponse<T> = { ok: boolean; result?: T; description?: string };

function apiUrl(token: string, method: string) {
  return `https://api.telegram.org/bot${token}/${method}`;
}

function providerError(description = "") {
  const normalized = description.toLowerCase();
  if (normalized.includes("unauthorized") || normalized.includes("token")) return new TelegramProviderError("Telegram bot authentication failed.", "AUTH");
  if (normalized.includes("chat not found") || normalized.includes("administrator") || normalized.includes("not enough rights") || normalized.includes("forbidden")) {
    return new TelegramProviderError("Bot cannot post to this channel. Make sure it is an administrator with permission to post messages.", "CHANNEL_ACCESS");
  }
  return new TelegramProviderError("Telegram publishing failed. You can retry.", "UNKNOWN");
}

async function telegramRequest<T>(token: string, method: string, body?: object) {
  let response: Response;
  try {
    response = await fetch(apiUrl(token, method), { method: body ? "POST" : "GET", headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new TelegramProviderError("Telegram is unavailable. Check your connection and retry.", "NETWORK");
  }
  const payload = await response.json() as TelegramResponse<T>;
  if (!response.ok || !payload.ok || payload.result === undefined) throw providerError(payload.description);
  return payload.result;
}

type TelegramMessage = { message_id: number };

export class TelegramApiPublisher implements TelegramPublisher {
  async testConnection(connection: TelegramConnection) {
    await telegramRequest(connection.botToken, "getMe");
    const member = await telegramRequest<{ status: string; can_post_messages?: boolean }>(connection.botToken, "getChatMember", { chat_id: connection.channelId, user_id: (await telegramRequest<{ id: number }>(connection.botToken, "getMe")).id });
    if (!(["administrator", "creator"].includes(member.status)) || member.can_post_messages === false) throw new TelegramProviderError("Bot cannot post to this channel. Make sure it is an administrator with permission to post messages.", "CHANNEL_ACCESS");
  }

  async publishMotorcycle(input: TelegramPublishInput) {
    if (input.imageUrls.length === 1) {
      const message = await telegramRequest<TelegramMessage>(input.botToken, "sendPhoto", { chat_id: input.channelId, photo: input.imageUrls[0], caption: input.caption });
      return { externalPostId: String(message.message_id), externalUrl: input.channelUsername ? `https://t.me/${input.channelUsername}/${message.message_id}` : undefined };
    }
    const messages = await telegramRequest<TelegramMessage[]>(input.botToken, "sendMediaGroup", { chat_id: input.channelId, media: input.imageUrls.slice(0, 10).map((media, index) => ({ type: "photo", media, ...(index === 0 ? { caption: input.caption } : {}) })) });
    const first = messages[0];
    if (!first) throw new TelegramProviderError("Telegram did not confirm the post. Retry only after checking your channel.", "UNKNOWN");
    return { externalPostId: String(first.message_id), externalUrl: input.channelUsername ? `https://t.me/${input.channelUsername}/${first.message_id}` : undefined };
  }
}
