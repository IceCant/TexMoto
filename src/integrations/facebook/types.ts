export type FacebookConnection = { pageAccessToken: string; pageId: string };

export type FacebookPublishInput = FacebookConnection & {
  message: string;
  imageUrls: string[];
};

export type FacebookPublishResult = { externalPostId: string; externalUrl?: string };

export interface FacebookPublisher {
  testConnection(connection: FacebookConnection): Promise<{ pageName?: string }>;
  publishMotorcycle(input: FacebookPublishInput): Promise<FacebookPublishResult>;
}

export class FacebookProviderError extends Error {
  constructor(message: string, readonly safeCode: "AUTH" | "PAGE_ACCESS" | "PERMISSION" | "MEDIA" | "NETWORK" | "UNKNOWN") {
    super(message);
    this.name = "FacebookProviderError";
  }
}
