import "server-only";

import { CreateBucketCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

import type { ImageStorage } from "@/storage/types";

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);
const maxImageBytes = 8 * 1024 * 1024;
const urlPrefix = "/s3/";

function parseImageFile(file: File) {
  const extension = allowedImageTypes.get(file.type);
  if (!extension) throw new Error("Photos must be JPEG, PNG, WebP, or AVIF.");
  if (file.size < 1) throw new Error("The selected photo is empty.");
  if (file.size > maxImageBytes) throw new Error("Each photo must be smaller than 8 MB.");
  return extension;
}

function s3Configuration() {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket) throw new Error("S3 storage requires S3_ENDPOINT and S3_BUCKET.");
  if (!accessKeyId || !secretAccessKey) throw new Error("S3 storage requires S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.");
  return {
    bucket,
    client: new S3Client({
      endpoint,
      region: process.env.S3_REGION ?? "us-east-1",
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

export class S3ImageStorage implements ImageStorage {
  private readonly config = s3Configuration();
  private ensureBucket: Promise<void> | null = null;

  private async ensureBucketExists() {
    if (this.ensureBucket) return this.ensureBucket;
    this.ensureBucket = (async () => {
      const { bucket, client } = this.config;
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
        return;
      } catch {}
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
    })();
    try {
      await this.ensureBucket;
    } catch {
      this.ensureBucket = null;
    }
  }

  async save(file: File, businessId: string) {
    const extension = parseImageFile(file);
    const key = `uploads/${businessId}/${crypto.randomUUID()}.${extension}`;
    await this.ensureBucketExists();
    await this.config.client.send(new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    }));
    return { key, url: `${urlPrefix}${key}` };
  }

  async remove(url: string) {
    if (!url.startsWith(urlPrefix)) return;
    const key = url.slice(urlPrefix.length);
    await this.config.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key })).catch((error: Error) => {
      if (error.name !== "NotFound") throw error;
    });
  }
}

export async function readStoredImage(url: string) {
  if (!url.startsWith(urlPrefix)) return null;
  const { client, bucket } = s3Configuration();
  const key = url.slice(urlPrefix.length);
  let object;
  try {
    object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === "NoSuchKey" || error.name === "NotFound")) return null;
    throw error;
  }
  if (!object.Body) return null;
  const body = object.Body instanceof Readable ? (Readable.toWeb(object.Body) as unknown as ReadableStream) : (object.Body as unknown as ReadableStream);
  return {
    body,
    contentType: object.ContentType ?? "application/octet-stream",
    contentLength: object.ContentLength ?? null,
  };
}
