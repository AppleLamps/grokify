'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    imagineStorage,
    generateId,
    dataUriToBlob,
    generateThumbnail,
    type StoredImage,
    type Folder,
} from '@/lib/imagine-storage';
import type { GalleryImage, GenerationType, AspectRatio } from '@/components/imagine/types';

interface UseImagineStoreReturn {
    // Gallery state
    images: GalleryImage[];
    folders: Folder[];
    selectedFolderId: string | null;
    isLoading: boolean;
    placeholderIds: string[];

    // Actions
    addImage: (dataUri: string, prompt: string, aspectRatio: string, type: GenerationType) => Promise<void>;
    addVideoUrl: (url: string, prompt: string, aspectRatio: string) => Promise<void>;
    deleteImage: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
    setSelectedFolder: (folderId: string | null) => void;
    moveToFolder: (imageId: string, folderId: string | null) => Promise<void>;

    // Folder actions
    createFolder: (name: string) => Promise<Folder>;
    deleteFolder: (id: string) => Promise<void>;

    // Generation placeholders
    addPlaceholders: (count: number) => string[];
    removePlaceholder: (id: string) => void;
    removeAllPlaceholders: () => void;

    // Full image access
    getFullImageUrl: (id: string) => Promise<string | null>;
    revokeUrl: (url: string) => void;

    // Filtered images
    getFilteredImages: () => GalleryImage[];

    // Storage info
    storageInfo: { used: number; quota: number };
}

export function useImagineStore(): UseImagineStoreReturn {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [placeholderIds, setPlaceholderIds] = useState<string[]>([]);
    const [storageInfo, setStorageInfo] = useState({ used: 0, quota: 0 });
    const blobUrlsRef = useRef<Map<string, string>>(new Map());

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                await imagineStorage.waitReady();
                const [loadedImages, loadedFolders, storage] = await Promise.all([
                    imagineStorage.getAllImages(),
                    imagineStorage.getAllFolders(),
                    imagineStorage.getStorageEstimate(),
                ]);
                setImages(loadedImages);
                setFolders(loadedFolders);
                setStorageInfo(storage);
            } catch (err) {
                console.error('Failed to load gallery data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
        const blobUrls = blobUrlsRef.current;

        // Cleanup blob URLs on unmount
        return () => {
            blobUrls.forEach((url) => URL.revokeObjectURL(url));
            blobUrls.clear();
        };
    }, []);

    const addImage = useCallback(
        async (dataUri: string, prompt: string, aspectRatio: string, type: GenerationType) => {
            const id = generateId();
            const fullBlob = dataUriToBlob(dataUri);
            const thumbnailBlob = await generateThumbnail(fullBlob);

            const metadata: StoredImage = {
                id,
                prompt,
                createdAt: Date.now(),
                aspectRatio,
                folderId: selectedFolderId,
                type,
            };

            await imagineStorage.saveImage(metadata, fullBlob, thumbnailBlob);

            const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
            blobUrlsRef.current.set(`${id}-thumb`, thumbnailUrl);

            setImages((prev) => [{ ...metadata, thumbnailUrl }, ...prev]);

            // Update storage info
            const storage = await imagineStorage.getStorageEstimate();
            setStorageInfo(storage);
        },
        [selectedFolderId]
    );

    const addVideoUrl = useCallback(
        async (url: string, prompt: string, aspectRatio: string) => {
            const id = generateId();

            const metadata: StoredImage = {
                id,
                prompt,
                createdAt: Date.now(),
                aspectRatio,
                folderId: selectedFolderId,
                type: 'video',
                url,
            };

            // For videos, we just store metadata (no blob)
            // Creating a simple placeholder blob
            const placeholderBlob = new Blob(['video'], { type: 'text/plain' });
            await imagineStorage.saveImage(metadata, placeholderBlob, placeholderBlob);

            setImages((prev) => [{ ...metadata }, ...prev]);
        },
        [selectedFolderId]
    );

    const deleteImage = useCallback(async (id: string) => {
        await imagineStorage.deleteImage(id);

        // Revoke blob URLs
        const thumbUrl = blobUrlsRef.current.get(`${id}-thumb`);
        const fullUrl = blobUrlsRef.current.get(`${id}-full`);
        if (thumbUrl) URL.revokeObjectURL(thumbUrl);
        if (fullUrl) URL.revokeObjectURL(fullUrl);
        blobUrlsRef.current.delete(`${id}-thumb`);
        blobUrlsRef.current.delete(`${id}-full`);

        setImages((prev) => prev.filter((img) => img.id !== id));

        const storage = await imagineStorage.getStorageEstimate();
        setStorageInfo(storage);
    }, []);

    const clearAll = useCallback(async () => {
        await imagineStorage.clearAll();

        // Revoke all blob URLs
        blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        blobUrlsRef.current.clear();

        setImages([]);

        const storage = await imagineStorage.getStorageEstimate();
        setStorageInfo(storage);
    }, []);

    const moveToFolder = useCallback(async (imageId: string, folderId: string | null) => {
        await imagineStorage.updateImageFolder(imageId, folderId);
        setImages((prev) =>
            prev.map((img) => (img.id === imageId ? { ...img, folderId } : img))
        );
    }, []);

    const createFolder = useCallback(async (name: string): Promise<Folder> => {
        const folder: Folder = {
            id: generateId(),
            name: name.trim(),
            createdAt: Date.now(),
            order: folders.length,
        };
        await imagineStorage.saveFolder(folder);
        setFolders((prev) => [...prev, folder]);
        return folder;
    }, [folders.length]);

    const deleteFolder = useCallback(async (id: string) => {
        await imagineStorage.deleteFolder(id);

        // Move all images in folder to uncategorized
        const imagesInFolder = images.filter((img) => img.folderId === id);
        for (const img of imagesInFolder) {
            await imagineStorage.updateImageFolder(img.id, null);
        }

        setImages((prev) =>
            prev.map((img) => (img.folderId === id ? { ...img, folderId: null } : img))
        );
        setFolders((prev) => prev.filter((f) => f.id !== id));

        if (selectedFolderId === id) {
            setSelectedFolderId(null);
        }
    }, [images, selectedFolderId]);

    const addPlaceholders = useCallback((count: number): string[] => {
        const newIds = Array.from({ length: count }, () => `placeholder-${generateId()}`);
        setPlaceholderIds((prev) => [...newIds, ...prev]);
        return newIds;
    }, []);

    const removePlaceholder = useCallback((id: string) => {
        setPlaceholderIds((prev) => prev.filter((p) => p !== id));
    }, []);

    const removeAllPlaceholders = useCallback(() => {
        setPlaceholderIds([]);
    }, []);

    const getFullImageUrl = useCallback(async (id: string): Promise<string | null> => {
        // Check for video URL
        const image = images.find((img) => img.id === id);
        if (image?.url) return image.url;

        // Check cache
        const cached = blobUrlsRef.current.get(`${id}-full`);
        if (cached) return cached;

        // Load from storage
        const blob = await imagineStorage.getFullImageBlob(id);
        if (!blob) return null;

        const url = URL.createObjectURL(blob);
        blobUrlsRef.current.set(`${id}-full`, url);
        return url;
    }, [images]);

    const revokeUrl = useCallback((url: string) => {
        URL.revokeObjectURL(url);
    }, []);

    const getFilteredImages = useCallback((): GalleryImage[] => {
        if (selectedFolderId === null) {
            return images;
        }
        return images.filter((img) => img.folderId === selectedFolderId);
    }, [images, selectedFolderId]);

    return {
        images,
        folders,
        selectedFolderId,
        isLoading,
        placeholderIds,
        addImage,
        addVideoUrl,
        deleteImage,
        clearAll,
        setSelectedFolder: setSelectedFolderId,
        moveToFolder,
        createFolder,
        deleteFolder,
        addPlaceholders,
        removePlaceholder,
        removeAllPlaceholders,
        getFullImageUrl,
        revokeUrl,
        getFilteredImages,
        storageInfo,
    };
}
