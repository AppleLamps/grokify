'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Copy, Check, Clapperboard } from 'lucide-react';
import type { GalleryImage, VideoExtendSettings } from './types';
import ImagineExtendDialog from './ImagineExtendDialog';

interface ImagineLightboxProps {
    image: GalleryImage | null;
    onClose: () => void;
    getFullImageUrl: (id: string) => Promise<string | null>;
    onExtendVideo: (settings: VideoExtendSettings) => void;
    isGenerating: boolean;
}

export default function ImagineLightbox({
    image,
    onClose,
    getFullImageUrl,
    onExtendVideo,
    isGenerating,
}: ImagineLightboxProps) {
    const [fullUrl, setFullUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [extendDialogOpen, setExtendDialogOpen] = useState(false);

    useEffect(() => {
        if (!image) {
            setFullUrl(null);
            return;
        }

        setIsLoading(true);

        // For videos, use the URL directly
        if (image.type === 'video' && image.url) {
            setFullUrl(image.url);
            setIsLoading(false);
            return;
        }

        // For images, load from storage
        getFullImageUrl(image.id).then((url) => {
            setFullUrl(url);
            setIsLoading(false);
        });
    }, [image, getFullImageUrl]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleDownload = async () => {
        if (!image || !fullUrl) return;

        try {
            const response = await fetch(fullUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `grok-imagine-${image.id}.${image.type === 'video' ? 'mp4' : 'png'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    const handleCopyPrompt = async () => {
        if (!image) return;
        try {
            await navigator.clipboard.writeText(image.prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const handleExtendSubmit = useCallback(({ prompt, duration }: { prompt: string; duration: number }) => {
        if (!image || image.type !== 'video' || !fullUrl) return;

        onExtendVideo({
            prompt,
            duration,
            sourceVideoUrl: fullUrl,
            aspectRatio: image.aspectRatio,
        });
        setExtendDialogOpen(false);
    }, [fullUrl, image, onExtendVideo]);

    if (!image) return null;

    return (
        <div className="imagine-lightbox" onClick={onClose}>
            {/* Close button */}
            <button className="imagine-lightbox__close" onClick={onClose}>
                <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="imagine-lightbox__content" onClick={(e) => e.stopPropagation()}>
                {/* Media */}
                <div className="imagine-lightbox__media">
                    {isLoading ? (
                        <div className="imagine-lightbox__loading">
                            <div className="imagine-lightbox__spinner" />
                        </div>
                    ) : image.type === 'video' ? (
                        <video
                            src={fullUrl || undefined}
                            controls
                            autoPlay
                            className="imagine-lightbox__video"
                        />
                    ) : (
                        <img
                            src={fullUrl || image.thumbnailUrl}
                            alt={image.prompt}
                            className="imagine-lightbox__image"
                        />
                    )}
                </div>

                {/* Info panel */}
                <div className="imagine-lightbox__info">
                    {/* Metadata */}
                    <div className="imagine-lightbox__metadata">
                        <div className="imagine-lightbox__meta-item">
                            <span className="imagine-lightbox__meta-label">Type</span>
                            <span className="imagine-lightbox__meta-value">
                                {image.type === 'video' ? 'Video' : 'Image'}
                            </span>
                        </div>
                        <div className="imagine-lightbox__meta-item">
                            <span className="imagine-lightbox__meta-label">Aspect</span>
                            <span className="imagine-lightbox__meta-value">{image.aspectRatio}</span>
                        </div>
                    </div>

                    {/* Prompt */}
                    <div className="imagine-lightbox__prompt-container">
                        <p className="imagine-lightbox__prompt">{image.prompt}</p>
                        <button className="imagine-lightbox__copy" onClick={handleCopyPrompt}>
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="imagine-lightbox__actions">
                        <button className="imagine-lightbox__btn imagine-lightbox__btn--primary" onClick={handleDownload}>
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                        {image.type === 'video' && fullUrl && (
                            <button
                                className="imagine-lightbox__btn imagine-lightbox__btn--accent"
                                onClick={() => setExtendDialogOpen(true)}
                                disabled={isGenerating}
                            >
                                <Clapperboard className="w-4 h-4" />
                                Extend
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <ImagineExtendDialog
                open={extendDialogOpen}
                onClose={() => setExtendDialogOpen(false)}
                title="Extend Generated Video"
                subtitle="Describe what should happen next in this clip."
                defaultPrompt={image.prompt}
                defaultDuration={6}
                isSubmitting={isGenerating}
                onSubmit={handleExtendSubmit}
            />
        </div>
    );
}
