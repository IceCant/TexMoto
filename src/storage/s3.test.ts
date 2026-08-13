import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getImageStorage } from "@/storage";
import { S3ImageStorage, readStoredImage } from "@/storage/s3";

describe("s3 image storage", () => {
  let storage: S3ImageStorage;
  const businessId = `test-${crypto.randomUUID().slice(0, 8)}`;
  const created: string[] = [];

  beforeAll(() => {
    if ((process.env.STORAGE_DRIVER ?? "local") !== "s3") return;
    storage = getImageStorage() as S3ImageStorage;
  });

  afterAll(async () => {
    for (const url of created) {
      await (storage as S3ImageStorage)?.remove(url);
    }
  });

  it("stores an uploaded photo as an object in the bucket and serves it back", async () => {
    if (!storage) return;
    const file = new File([Buffer.from("s3-object-contents", "utf8")], "photo.jpg", { type: "image/jpeg" });
    const stored = await storage.save(file, businessId);
    created.push(stored.url);

    expect(stored.url).toMatch(/^\/s3\/uploads\/test-/);
    const object = await readStoredImage(stored.url);
    expect(object).not.toBeNull();
    expect(object?.contentType).toBe("image/jpeg");
    expect(await new Response(object!.body).text()).toBe("s3-object-contents");
  });

  it("removes the object from the bucket", async () => {
    if (!storage) return;
    const file = new File([Buffer.from("to-be-deleted", "utf8")], "photo.png", { type: "image/png" });
    const stored = await storage.save(file, businessId);
    created.push(stored.url);

    await storage.remove(stored.url);
    expect(await readStoredImage(stored.url)).toBeNull();
  });

  it("rejects unsupported extra-large photos before any write", async () => {
    if (!storage) return;
    const file = new File([Buffer.alloc(9 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" });
    await expect(storage.save(file, businessId)).rejects.toThrow("smaller than 8 MB");
  });
});