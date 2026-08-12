export interface StoredFile {
  url: string;
  key: string;
}

export interface ImageStorage {
  save(file: File, businessId: string): Promise<StoredFile>;
  remove(url: string): Promise<void>;
}

