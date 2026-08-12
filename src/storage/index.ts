import "server-only";

import { LocalImageStorage } from "@/storage/local";
import type { ImageStorage } from "@/storage/types";

export function getImageStorage(): ImageStorage {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") return new LocalImageStorage();
  throw new Error(`Unsupported STORAGE_DRIVER: ${driver}. Add an ImageStorage adapter before enabling it.`);
}

