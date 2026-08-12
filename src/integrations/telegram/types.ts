export type TelegramConnection = { botToken: string; channelId: string; channelUsername?: string | null };

export type TelegramPublishInput = TelegramConnection & {
  caption: string;
  imageUrls: string[];
};

export type TelegramPublishResult = { externalPostId: string; externalUrl?: string };

export interface TelegramPublisher {
  testConnection(connection: TelegramConnection): Promise<void>;
  publishMotorcycle(input: TelegramPublishInput): Promise<TelegramPublishResult>;
}

export class TelegramProviderError extends Error {
  constructor(message: string, readonly safeCode: "AUTH" | "CHANNEL_ACCESS" | "MEDIA" | "NETWORK" | "UNKNOWN") {
    super(message);
    this.name = "TelegramProviderError";
  }
}
