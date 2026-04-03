'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { upload } from '@vercel/blob/client';

// Import modular CSS files
import '@/app/imagine/imagine.css';
import '@/app/imagine/sidebar.css';
import '@/app/imagine/gallery.css';
import '@/app/imagine/input-bar.css';
import '@/app/imagine/lightbox-settings.css';

import { useImagineStore } from '@/hooks/useImagineStore';
import ImagineSidebar from './ImagineSidebar';
import ImagineGallery from './ImagineGallery';
import ImagineInputBar from './ImagineInputBar';
import ImagineLightbox from './ImagineLightbox';
import ImagineSettings from './ImagineSettings';
import type { GalleryImage, GenerationType, AspectRatio, VideoResolution, VideoSize, VideoExtendSettings } from './types';
import { VIDEO_MAINTENANCE_ENABLED, VIDEO_MAINTENANCE_MESSAGE } from '@/lib/video-maintenance';
import {
    getImagineImageUnavailableMessage,
    getImagineVideoUnavailableMessage,
    isGrokImageGenerationEnabled,
    isGrokVideoGenerationEnabled,
} from '@/lib/grok-image-availability';

export default function ImagineClient() {
    const store = useImagineStore();
    const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleGenerate = useCallback(
        async (settings: {
            prompt: string;
            type: GenerationType;
            aspectRatio: AspectRatio;
            imageCount: number;
            videoDuration: number;
            editImageBase64?: string | null;
            editVideoBase64?: string | null;
            referenceImageBase64s?: string[];
            videoResolution?: VideoResolution;
            videoSize?: VideoSize | null;
            style?: string;
        }) => {
            if (settings.type === 'image' && !isGrokImageGenerationEnabled()) {
                toast.error(getImagineImageUnavailableMessage());
                return;
            }

            if (settings.type === 'video' && !isGrokVideoGenerationEnabled()) {
                toast.error(getImagineVideoUnavailableMessage());
                return;
            }

            if (settings.type === 'video' && VIDEO_MAINTENANCE_ENABLED) {
                toast.error(VIDEO_MAINTENANCE_MESSAGE);
                return;
            }

            if (isGenerating) return;
            setIsGenerating(true);
            abortControllerRef.current = new AbortController();
            const isVideo = settings.type === 'video';
            const count = isVideo || settings.editImageBase64 ? 1 : settings.imageCount;
            const placeholderIds = store.addPlaceholders(count);

            try {
                if (isVideo) {
                    // If video is attached, upload it first for video editing
                    let videoUrl: string | undefined;
                    // If image is attached, upload it first for image-to-video
                    let imageUrl: string | undefined;
                    let referenceImageUrls: string[] = [];

                    if (settings.editVideoBase64) {
                        // Convert base64 data URL to File for client-side upload
                        const base64Match = settings.editVideoBase64.match(/^data:video\/(\w+);base64,(.+)$/);
                        if (!base64Match) {
                            throw new Error('Invalid video data format');
                        }
                        const [, videoType, base64Data] = base64Match;
                        const binaryString = atob(base64Data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        const videoBlob = new Blob([bytes], { type: `video/${videoType}` });
                        const videoFile = new File([videoBlob], `video.${videoType}`, { type: `video/${videoType}` });

                        // Use client-side upload to bypass serverless payload limits
                        const blob = await upload(videoFile.name, videoFile, {
                            access: 'public',
                            handleUploadUrl: '/api/upload-video/token',
                        });
                        videoUrl = blob.url;
                    } else if (settings.editImageBase64) {
                        const uploadRes = await fetch('/api/upload-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ imageDataUrl: settings.editImageBase64 }),
                            signal: abortControllerRef.current.signal,
                        });
                        if (!uploadRes.ok) {
                            throw new Error('Failed to upload image for video generation');
                        }
                        const uploadData = await uploadRes.json();
                        imageUrl = uploadData.imageUrl;
                    }

                    if (settings.referenceImageBase64s?.length) {
                        referenceImageUrls = await Promise.all(
                            settings.referenceImageBase64s.map(async (imageDataUrl) => {
                                const uploadRes = await fetch('/api/upload-image', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ imageDataUrl }),
                                    signal: abortControllerRef.current?.signal,
                                });
                                if (!uploadRes.ok) {
                                    throw new Error('Failed to upload reference image for video generation');
                                }
                                const uploadData = await uploadRes.json();
                                return uploadData.imageUrl as string;
                            })
                        );
                    }

                    const res = await fetch('/api/imagine-video', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt: settings.prompt,
                            aspect_ratio: settings.aspectRatio,
                            duration: settings.videoDuration,
                            resolution: settings.videoResolution,
                            ...(settings.videoSize && { size: settings.videoSize }),
                            ...(videoUrl && { videoUrl }),
                            ...(imageUrl && { imageUrl }),
                            ...(referenceImageUrls.length > 0 && { referenceImages: referenceImageUrls }),
                        }),
                        signal: abortControllerRef.current.signal,
                    });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || 'Video generation failed');
                    }
                    const data = await res.json();
                    store.removePlaceholder(placeholderIds[0]);
                    if (data.video?.url) {
                        await store.addVideoUrl(data.video.url, settings.prompt, settings.aspectRatio);
                        toast.success('Video generated!');
                    }
                } else {
                    const res = await fetch('/api/imagine', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prompt: settings.prompt,
                            n: count,
                            aspect_ratio: settings.aspectRatio,
                            response_format: 'b64_json',
                            ...(settings.editImageBase64 && { imageBase64: settings.editImageBase64 }),
                            ...(settings.style && { style: settings.style }),
                        }),
                        signal: abortControllerRef.current.signal,
                    });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || 'Image generation failed');
                    }
                    const data = await res.json();
                    if (!data.data || !Array.isArray(data.data)) {
                        throw new Error('Invalid response format from API');
                    }
                    for (let i = 0; i < data.data.length; i++) {
                        const b64 = data.data[i].b64_json;
                        if (!b64) {
                            console.error('Missing b64_json in response:', data.data[i]);
                            continue;
                        }
                        const dataUri = `data:image/png;base64,${b64}`;
                        if (placeholderIds[i]) store.removePlaceholder(placeholderIds[i]);
                        await store.addImage(dataUri, settings.prompt, settings.aspectRatio, 'image');
                    }
                    toast.success(`${data.data.length} image${data.data.length > 1 ? 's' : ''} generated!`);
                }
            } catch (err: unknown) {
                if ((err as Error).name === 'AbortError') {
                    toast.info('Generation cancelled');
                } else {
                    toast.error((err as Error).message || 'Generation failed');
                }
                store.removeAllPlaceholders();
            } finally {
                setIsGenerating(false);
                abortControllerRef.current = null;
            }
        },
        [isGenerating, store]
    );

    const handleCancel = useCallback(() => {
        abortControllerRef.current?.abort();
        store.removeAllPlaceholders();
        setIsGenerating(false);
    }, [store]);

    const uploadVideoDataUrl = useCallback(async (videoDataUrl: string) => {
        const base64Match = videoDataUrl.match(/^data:video\/([\w.+-]+);base64,(.+)$/);
        if (!base64Match) {
            throw new Error('Invalid video data format');
        }

        const [, videoType, base64Data] = base64Match;
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const videoBlob = new Blob([bytes], { type: `video/${videoType}` });
        const safeExtension = videoType.replace(/[^a-zA-Z0-9]/g, '') || 'mp4';
        const videoFile = new File([videoBlob], `video.${safeExtension}`, { type: `video/${videoType}` });

        const blob = await upload(videoFile.name, videoFile, {
            access: 'public',
            handleUploadUrl: '/api/upload-video/token',
        });

        return blob.url;
    }, []);

    const handleExtendVideo = useCallback(
        async (settings: VideoExtendSettings) => {
            if (!isGrokVideoGenerationEnabled()) {
                toast.error(getImagineVideoUnavailableMessage());
                return;
            }

            if (VIDEO_MAINTENANCE_ENABLED) {
                toast.error(VIDEO_MAINTENANCE_MESSAGE);
                return;
            }

            if (isGenerating) return;

            setIsGenerating(true);
            abortControllerRef.current = new AbortController();
            const placeholderIds = store.addPlaceholders(1);

            try {
                const sourceVideoUrl = settings.sourceVideoUrl
                    ?? (settings.sourceVideoBase64 ? await uploadVideoDataUrl(settings.sourceVideoBase64) : undefined);

                if (!sourceVideoUrl) {
                    throw new Error('A source video is required to extend.');
                }

                const res = await fetch('/api/imagine-video/extend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: settings.prompt,
                        duration: settings.duration,
                        videoUrl: sourceVideoUrl,
                    }),
                    signal: abortControllerRef.current.signal,
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(data.error || 'Video extension failed');
                }

                store.removePlaceholder(placeholderIds[0]);

                if (data.video?.url) {
                    await store.addVideoUrl(data.video.url, settings.prompt, settings.aspectRatio);
                    toast.success('Video extended!');
                } else {
                    throw new Error('Invalid response from video extension API');
                }
            } catch (err: unknown) {
                if ((err as Error).name === 'AbortError') {
                    toast.info('Generation cancelled');
                } else {
                    toast.error((err as Error).message || 'Video extension failed');
                }
                store.removeAllPlaceholders();
            } finally {
                setIsGenerating(false);
                abortControllerRef.current = null;
            }
        },
        [isGenerating, store, uploadVideoDataUrl]
    );

    const filteredImages = store.getFilteredImages();

    if (store.isLoading) {
        return (
            <div className="imagine-loading">
                <div className="imagine-loading__spinner" />
                <p>Loading gallery...</p>
            </div>
        );
    }

    return (
        <div className={`imagine-layout ${!sidebarOpen ? 'imagine-layout--sidebar-collapsed' : ''}`}>
            <ImagineSidebar
                folders={store.folders}
                images={store.images}
                selectedFolderId={store.selectedFolderId}
                onSelectFolder={store.setSelectedFolder}
                onCreateFolder={store.createFolder}
                onDeleteFolder={store.deleteFolder}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            <main className="imagine-main">
                <ImagineGallery
                    images={filteredImages}
                    placeholderIds={store.placeholderIds}
                    onImageClick={setLightboxImage}
                    onDeleteImage={store.deleteImage}
                />
            </main>

            <ImagineInputBar
                isGenerating={isGenerating}
                folders={store.folders}
                selectedFolderId={store.selectedFolderId}
                onGenerate={handleGenerate}
                onCancel={handleCancel}
                onExtendVideo={handleExtendVideo}
                onSelectFolder={store.setSelectedFolder}
                onOpenSettings={() => setSettingsOpen(true)}
            />

            <ImagineLightbox
                image={lightboxImage}
                onClose={() => setLightboxImage(null)}
                getFullImageUrl={store.getFullImageUrl}
                onExtendVideo={handleExtendVideo}
                isGenerating={isGenerating}
            />

            <ImagineSettings
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                imageCount={store.images.length}
                storageInfo={store.storageInfo}
                onClearAll={store.clearAll}
            />
        </div>
    );
}
