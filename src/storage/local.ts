import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ImageStorage } from "@/storage/types";

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);
const maxImageBytes = 8 * 1024 * 1024;

function parseImageFile(file: File) {
  const extension = allowedImageTypes.get(file.type);
  if (!extension) throw new Error("Photos must be JPEG, PNG, WebP, or AVIF.");
  if (file.size < 1) throw new Error("The selected photo is empty.");
  if (file.size > maxImageBytes) throw new Error("Each photo must be smaller than 8 MB.");
  return extension;
}

export class LocalImageStorage implements ImageStorage {
  async save(file: File, businessId: string) {
    const extension = parseImageFile(file);
    const relativeDirectory = path.join("uploads", businessId);
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const absoluteDirectory = path.join(process.cwd(), "public", relativeDirectory);
    await mkdir(absoluteDirectory, { recursive: true });
    await writeFile(path.join(absoluteDirectory, fileName), Buffer.from(await file.arrayBuffer()));
    const key = `${relativeDirectory}/${fileName}`.replaceAll(path.sep, "/");
    return { key, url: `/${key}` };
  }

  async remove(url: string) {
    if (!url.startsWith("/uploads/")) return;
    const absolutePath = path.resolve(process.cwd(), "public", url.slice(1));
    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
    if (!absolutePath.startsWith(`${uploadsRoot}${path.sep}`)) throw new Error("Invalid local storage path.");
    await unlink(absolutePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}

