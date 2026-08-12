import "server-only";

import { z } from "zod";

import { parseGraphApiVersion } from "@/domain/facebook";
import { FacebookProviderError, type FacebookConnection, type FacebookPublishInput, type FacebookPublisher } from "@/integrations/facebook/types";

const graphErrorSchema = z.object({ error: z.object({ code: z.number().optional(), message: z.string().optional(), type: z.string().optional() }) });
const idResponseSchema = z.object({ id: z.string(), post_id: z.string().optional() });
const pageResponseSchema = z.object({ id: z.string(), name: z.string().optional() });
const permalinkResponseSchema = z.object({ permalink_url: z.string().url() });

function graphUrl(path: string) {
  const version = parseGraphApiVersion(process.env.META_GRAPH_API_VERSION);
  return `https://graph.facebook.com/${version}/${path}`;
}

function providerError(payload: unknown, status: number) {
  const parsed = graphErrorSchema.safeParse(payload);
  const code = parsed.success ? parsed.data.error.code : undefined;
  if (code === 190 || status === 401) return new FacebookProviderError("Facebook Page authentication failed. Replace the Page access token.", "AUTH");
  if (code === 10 || code === 200) return new FacebookProviderError("The Meta app or Page token does not have permission to publish to this Page.", "PERMISSION");
  if (status === 403 || status === 404) return new FacebookProviderError("Facebook Page access failed. Check the Page ID and your Page role.", "PAGE_ACCESS");
  return new FacebookProviderError("Facebook publishing failed. You can retry.", "UNKNOWN");
}

async function graphRequest(path: string, options?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(graphUrl(path), { ...options, signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new FacebookProviderError("Facebook is unavailable. Check your connection and retry.", "NETWORK");
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw providerError(payload, response.status);
  return payload;
}

function publishForm(connection: FacebookConnection, fields: Record<string, string>) {
  const body = new FormData();
  body.set("access_token", connection.pageAccessToken);
  for (const [name, value] of Object.entries(fields)) body.set(name, value);
  return body;
}

async function findPermalink(postId: string, pageAccessToken: string) {
  const query = new URLSearchParams({ fields: "permalink_url", access_token: pageAccessToken });
  try {
    const payload = await graphRequest(`${postId}?${query}`);
    const parsed = permalinkResponseSchema.safeParse(payload);
    return parsed.success ? parsed.data.permalink_url : undefined;
  } catch {
    return undefined;
  }
}

export class FacebookGraphPublisher implements FacebookPublisher {
  async testConnection(connection: FacebookConnection) {
    const query = new URLSearchParams({ fields: "id,name", access_token: connection.pageAccessToken });
    const parsed = pageResponseSchema.safeParse(await graphRequest(`${connection.pageId}?${query}`));
    if (!parsed.success || parsed.data.id !== connection.pageId) throw new FacebookProviderError("Facebook Page access failed. Check the Page ID and Page token.", "PAGE_ACCESS");
    return { pageName: parsed.data.name };
  }

  async publishMotorcycle(input: FacebookPublishInput) {
    if (input.imageUrls.length < 1) throw new FacebookProviderError("Facebook requires at least one public photo URL.", "MEDIA");
    const externalPostId = input.imageUrls.length === 1
      ? await this.publishSinglePhoto(input)
      : await this.publishPhotoAlbum(input);
    return { externalPostId, externalUrl: await findPermalink(externalPostId, input.pageAccessToken) };
  }

  private async publishSinglePhoto(input: FacebookPublishInput) {
    const payload = await graphRequest(`${input.pageId}/photos`, { method: "POST", body: publishForm(input, { url: input.imageUrls[0]!, caption: input.message }) });
    const parsed = idResponseSchema.safeParse(payload);
    if (!parsed.success) throw new FacebookProviderError("Facebook did not confirm the photo post. Check the Page before retrying.", "UNKNOWN");
    return parsed.data.post_id ?? parsed.data.id;
  }

  private async publishPhotoAlbum(input: FacebookPublishInput) {
    const mediaIds = await Promise.all(input.imageUrls.slice(0, 10).map(async (url) => {
      const payload = await graphRequest(`${input.pageId}/photos`, { method: "POST", body: publishForm(input, { url, published: "false" }) });
      const parsed = idResponseSchema.safeParse(payload);
      if (!parsed.success) throw new FacebookProviderError("Facebook could not upload a motorcycle photo. You can retry.", "MEDIA");
      return parsed.data.id;
    }));
    const fields: Record<string, string> = { message: input.message };
    mediaIds.forEach((mediaId, index) => { fields[`attached_media[${index}]`] = JSON.stringify({ media_fbid: mediaId }); });
    const parsed = idResponseSchema.safeParse(await graphRequest(`${input.pageId}/feed`, { method: "POST", body: publishForm(input, fields) }));
    if (!parsed.success) throw new FacebookProviderError("Facebook did not confirm the Page post. Check the Page before retrying.", "UNKNOWN");
    return parsed.data.id;
  }
}
