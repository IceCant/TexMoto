import "server-only";

import { readStoredImage } from "@/storage/s3";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await params;
  if (segments.length < 1) return new Response("Not found", { status: 404 });
  const stored = await readStoredImage(`/s3/${segments.join("/")}`);
  if (!stored) return new Response("Not found", { status: 404 });
  return new Response(stored.body, {
    headers: {
      "Content-Type": stored.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      ...(stored.contentLength !== null ? { "Content-Length": String(stored.contentLength) } : {}),
    },
  });
}