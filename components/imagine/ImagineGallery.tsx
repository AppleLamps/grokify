'use client';

import { X, Play } from 'lucide-react';
import type { GalleryImage } from './types';

interface ImagineGalleryProps {
    images: GalleryImage[];
    placeholderIds: string[];
    onImageClick: (image: GalleryImage) => void;
    onDeleteImage: (id: string) => void;
}

export default function ImagineGallery({
    images,
    placeholderIds,
    onImageClick,
    onDeleteImage,
}: ImagineGalleryProps) {
    const isEmpty = images.length === 0 && placeholderIds.length === 0;

    if (isEmpty) {
        return (
            <div className="imagine-empty">
                <div className="imagine-empty__icon">
                    <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                </div>
                <h2 className="imagine-empty__title">No images yet</h2>
                <p className="imagine-empty__description">
                    Start creating by typing a description below and clicking generate.
                </p>
            </div>
        );
    }

    return (
        <div className="imagine-gallery">
            {/* Loading Placeholders */}
            {placeholderIds.map((id) => (
                <div key={id} className="imagine-gallery__placeholder">
                    <div className="imagine-gallery__placeholder-inner" />
                    <div className="imagine-gallery__placeholder-glow" />
                </div>
            ))}

            {/* Images */}
            {images.map((image) => (
                <div key={image.id} className="imagine-gallery__card">
                    {/* Delete button */}
                    <button
                        className="imagine-gallery__delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteImage(image.id);
                        }}
                        title="Delete"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Video indicator */}
                    {image.type === 'video' && (
                        <div className="imagine-gallery__video-badge">
                            <Play className="w-4 h-4" fill="white" />
                        </div>
                    )}

                    {/* Image */}
                    {image.thumbnailUrl ? (
                        <img
                            src={image.thumbnailUrl}
                            alt={image.prompt}
                            className="imagine-gallery__image"
                            onClick={() => onImageClick(image)}
                            loading="lazy"
                        />
                    ) : image.url && image.type === 'video' ? (
                        <video
                            src={image.url}
                            className="imagine-gallery__image"
                            onClick={() => onImageClick(image)}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => {
                                e.currentTarget.pause();
                                e.currentTarget.currentTime = 0;
                            }}
                        />
                    ) : (
                        <div className="imagine-gallery__missing" onClick={() => onImageClick(image)}>
                            No preview
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
