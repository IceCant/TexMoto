import "server-only";

import { TelegramApiPublisher } from "@/integrations/telegram/api";
import type { TelegramPublisher } from "@/integrations/telegram/types";

let testPublisher: TelegramPublisher | undefined;

export function getTelegramPublisher() {
  return testPublisher ?? new TelegramApiPublisher();
}

export function setTelegramPublisherForTests(publisher?: TelegramPublisher) {
  if (process.env.NODE_ENV !== "test") throw new Error("Telegram test provider can only be changed in tests.");
  testPublisher = publisher;
}
