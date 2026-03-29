/**
 * IndexedDB storage module for Grok Imagine - efficient image persistence
 */
import { buildStoredGalleryImage } from '@/lib/imagine-gallery-utils';

const DB_NAME = 'grok-imagine-gallery';
const DB_VERSION = 1;
const IMAGES_STORE = 'images';
const BLOBS_STORE = 'blobs';
const FOLDERS_STORE = 'folders';

export interface StoredImage {
    id: string;
    prompt: string;
    createdAt: number;
    aspectRatio: string;
    folderId: string | null;
    type: 'image' | 'video';
    url?: string; // For video URLs or temporary display
}

export interface Folder {
    id: string;
    name: string;
    createdAt: number;
    order: number;
}

class ImagineStorage {
    private db: IDBDatabase | null = null;
    private ready: Promise<void> | null = null;

    constructor() {
        // Defer initialization to avoid SSR issues
        if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
            this.ready = this.initDB();
        }
    }

    async waitReady(): Promise<void> {
        // Lazy init for client-side
        if (!this.ready) {
            if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
                return Promise.resolve(); // SSR - no-op
            }
            this.ready = this.initDB();
        }
        return this.ready;
    }

    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains(IMAGES_STORE)) {
                    const imagesStore = db.createObjectStore(IMAGES_STORE, { keyPath: 'id' });
                    imagesStore.createIndex('createdAt', 'createdAt', { unique: false });
                    imagesStore.createIndex('folderId', 'folderId', { unique: false });
                }

                if (!db.objectStoreNames.contains(BLOBS_STORE)) {
                    db.createObjectStore(BLOBS_STORE, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
                    const foldersStore = db.createObjectStore(FOLDERS_STORE, { keyPath: 'id' });
                    foldersStore.createIndex('order', 'order', { unique: false });
                }
            };
        });
    }

    async saveImage(
        metadata: StoredImage,
        fullBlob: Blob,
        thumbnailBlob: Blob
    ): Promise<void> {
        await this.ready;
        if (!this.db) throw new Error('Database not initialized');

        const thumbnailBlobId = `${metadata.id}-thumb`;
        const fullImageBlobId = `${metadata.id}-full`;

        const tx = this.db.transaction([IMAGES_STORE, BLOBS_STORE], 'readwrite');
        const imagesStore = tx.objectStore(IMAGES_STORE);
        const blobsStore = tx.objectStore(BLOBS_STORE);

        imagesStore.put({
            ...metadata,
            thumbnailBlobId,
            fullImageBlobId,
        });

        blobsStore.put({ id: thumbnailBlobId, blob: thumbnailBlob, size: thumbnailBlob.size });
        blobsStore.put({ id: fullImageBlobId, blob: fullBlob, size: fullBlob.size });

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async getImage(id: string): Promise<StoredImage | null> {
        await this.ready;
        if (!this.db) return null;

        const tx = this.db.transaction(IMAGES_STORE, 'readonly');
        const store = tx.objectStore(IMAGES_STORE);
        const request = store.get(id);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async getFullImageBlob(id: string): Promise<Blob | null> {
        await this.ready;
        if (!this.db) return null;

        const blobId = `${id}-full`;
        return this.getBlob(blobId);
    }

    async getThumbnailBlob(id: string): Promise<Blob | null> {
        await this.ready;
        if (!this.db) return null;

        const blobId = `${id}-thumb`;
        return this.getBlob(blobId);
    }

    private async getBlob(blobId: string): Promise<Blob | null> {
        if (!this.db) return null;

        const tx = this.db.transaction(BLOBS_STORE, 'readonly');
        const store = tx.objectStore(BLOBS_STORE);
        const request = store.get(blobId);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.blob : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteImage(id: string): Promise<void> {
        await this.ready;
        if (!this.db) return;

        const tx = this.db.transaction([IMAGES_STORE, BLOBS_STORE], 'readwrite');
        const imagesStore = tx.objectStore(IMAGES_STORE);
        const blobsStore = tx.objectStore(BLOBS_STORE);

        imagesStore.delete(id);
        blobsStore.delete(`${id}-thumb`);
        blobsStore.delete(`${id}-full`);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async getAllImages(): Promise<(StoredImage & { thumbnailUrl?: string })[]> {
        await this.ready;
        if (!this.db) return [];

        const tx = this.db.transaction([IMAGES_STORE, BLOBS_STORE], 'readonly');
        const imagesStore = tx.objectStore(IMAGES_STORE);
        const blobsStore = tx.objectStore(BLOBS_STORE);

        const images = await new Promise<StoredImage[]>((resolve, reject) => {
            const request = imagesStore.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const results = await Promise.all(
            images.map(async (img) => {
                const thumbRequest = blobsStore.get(`${img.id}-thumb`);
                const thumbBlob = await new Promise<Blob | null>((resolve) => {
                    thumbRequest.onsuccess = () => resolve(thumbRequest.result?.blob || null);
                    thumbRequest.onerror = () => resolve(null);
                });

                return {
                    ...buildStoredGalleryImage(
                        img,
                        thumbBlob ? URL.createObjectURL(thumbBlob) : undefined,
                    ),
                };
            })
        );

        return results.sort((a, b) => b.createdAt - a.createdAt);
    }

    async clearAll(): Promise<void> {
        await this.ready;
        if (!this.db) return;

        const tx = this.db.transaction([IMAGES_STORE, BLOBS_STORE], 'readwrite');
        tx.objectStore(IMAGES_STORE).clear();
        tx.objectStore(BLOBS_STORE).clear();

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    // Folder Methods
    async saveFolder(folder: Folder): Promise<void> {
        await this.ready;
        if (!this.db) return;

        const tx = this.db.transaction(FOLDERS_STORE, 'readwrite');
        const store = tx.objectStore(FOLDERS_STORE);
        store.put(folder);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async getAllFolders(): Promise<Folder[]> {
        await this.ready;
        if (!this.db) return [];

        const tx = this.db.transaction(FOLDERS_STORE, 'readonly');
        const store = tx.objectStore(FOLDERS_STORE);
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const folders = request.result || [];
                resolve(folders.sort((a: Folder, b: Folder) => a.order - b.order));
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteFolder(id: string): Promise<void> {
        await this.ready;
        if (!this.db) return;

        const tx = this.db.transaction(FOLDERS_STORE, 'readwrite');
        const store = tx.objectStore(FOLDERS_STORE);
        store.delete(id);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async updateImageFolder(imageId: string, folderId: string | null): Promise<void> {
        await this.ready;
        if (!this.db) return;

        const image = await this.getImage(imageId);
        if (!image) throw new Error(`Image ${imageId} not found`);

        const tx = this.db.transaction(IMAGES_STORE, 'readwrite');
        const store = tx.objectStore(IMAGES_STORE);
        store.put({ ...image, folderId });

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async getStorageEstimate(): Promise<{ used: number; quota: number }> {
        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage || 0,
                quota: estimate.quota || 0,
            };
        }
        return { used: 0, quota: 0 };
    }

    static isSupported(): boolean {
        try {
            return typeof window !== 'undefined' && typeof indexedDB !== 'undefined' && indexedDB !== null;
        } catch {
            return false;
        }
    }
}

// Singleton export
export const imagineStorage = new ImagineStorage();

// Helper utilities
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function dataUriToBlob(dataUri: string): Blob {
    const parts = dataUri.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    // Clean the base64 string - remove whitespace/newlines that may break atob
    const cleanB64 = parts[1].replace(/[\s\n\r]/g, '');
    const bstr = atob(cleanB64);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

export async function generateThumbnail(blob: Blob, maxSize = 400): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let { width, height } = img;
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                } else {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(new Error('Failed to create thumbnail'));
                    }
                },
                'image/jpeg',
                0.8
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
