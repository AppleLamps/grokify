'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Send,
    X,
    Settings2,
    Image as ImageIcon,
    Video,
    Upload,
    ChevronDown,
    Palette,
    Layers3,
    Clapperboard,
} from 'lucide-react';
import type { GenerationType, AspectRatio, Folder, VideoResolution, VideoSize } from './types';
import { IMAGE_ASPECT_RATIOS, VIDEO_ASPECT_RATIOS } from './types';
import { StyleSelectorModal, ART_STYLES } from '@/components/StyleSelectorModal';
import { getDroppedFiles, hasFilesInTransfer } from '@/lib/drag-drop-utils';
import { consumeImagineHandoff, IMAGINE_HANDOFF_QUERY } from '@/lib/imagine-handoff';
import {
    getImagineImageUnavailableMessage,
    getImagineVideoUnavailableMessage,
    isGrokImageGenerationEnabled,
    isGrokVideoGenerationEnabled,
} from '@/lib/grok-image-availability';
import ImagineExtendDialog from './ImagineExtendDialog';

interface ImagineInputBarProps {
    isGenerating: boolean;
    folders: Folder[];
    selectedFolderId: string | null;
    onGenerate: (settings: {
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
    }) => void;
    onExtendVideo: (settings: {
        prompt: string;
        duration: number;
        sourceVideoBase64?: string | null;
        sourceVideoUrl?: string;
        aspectRatio: string;
    }) => void;
    onCancel: () => void;
    onSelectFolder: (id: string | null) => void;
    onOpenSettings: () => void;
}

export default function ImagineInputBar({
    isGenerating,
    folders,
    selectedFolderId,
    onGenerate,
    onExtendVideo,
    onCancel,
    onSelectFolder,
    onOpenSettings,
}: ImagineInputBarProps) {
    const searchParams = useSearchParams();
    const [prompt, setPrompt] = useState('');
    const grokImageGenerationEnabled = isGrokImageGenerationEnabled();
    const grokVideoGenerationEnabled = isGrokVideoGenerationEnabled();
    const [type, setType] = useState<GenerationType>(
        grokImageGenerationEnabled ? 'image' : grokVideoGenerationEnabled ? 'video' : 'image'
    );
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('auto');
    const [imageCount, setImageCount] = useState(2);
    const [videoDuration, setVideoDuration] = useState(8);
    const [videoResolution] = useState<VideoResolution>('720p');
    const [videoSize] = useState<VideoSize | null>(null);
    const [editImage, setEditImage] = useState<string | null>(null);
    const [editVideo, setEditVideo] = useState<string | null>(null);
    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    const [selectedStyle, setSelectedStyle] = useState('');
    const [styleModalOpen, setStyleModalOpen] = useState(false);
    const [extendDialogOpen, setExtendDialogOpen] = useState(false);
    const [isUploadDragActive, setIsUploadDragActive] = useState(false);

    const [showAspectDropdown, setShowAspectDropdown] = useState(false);
    const [showFolderDropdown, setShowFolderDropdown] = useState(false);
    const [showCountDropdown, setShowCountDropdown] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasConsumedHandoffRef = useRef(false);
    const uploadDropDepthRef = useRef(0);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [prompt]);

    useEffect(() => {
        if (type !== 'video') return;
        if (VIDEO_ASPECT_RATIOS.some((option) => option.value === aspectRatio)) return;
        setAspectRatio('16:9');
    }, [aspectRatio, type]);

    useEffect(() => {
        if (grokImageGenerationEnabled || type !== 'image') return;
        if (grokVideoGenerationEnabled) {
            setType('video');
        }
    }, [grokImageGenerationEnabled, grokVideoGenerationEnabled, type]);

    useEffect(() => {
        if (hasConsumedHandoffRef.current) return;
        if (searchParams.get('handoff') !== IMAGINE_HANDOFF_QUERY) return;

        const handoff = consumeImagineHandoff();
        hasConsumedHandoffRef.current = true;

        if (!handoff) return;

        setPrompt(handoff.prompt);

        if (handoff.autogenerate && grokImageGenerationEnabled) {
            requestAnimationFrame(() => {
                onGenerate({
                    prompt: handoff.prompt,
                    type: 'image',
                    aspectRatio: 'auto',
                    imageCount: 2,
                    videoDuration: 8,
                    editImageBase64: null,
                    editVideoBase64: null,
                    referenceImageBase64s: [],
                    videoResolution: '720p',
                    videoSize: null,
                    style: undefined,
                });
            });
        }
    }, [grokImageGenerationEnabled, onGenerate, searchParams]);

    const handleSubmit = () => {
        if (!prompt.trim() || isGenerating) return;
        if (type === 'image' && !grokImageGenerationEnabled) return;
        if (type === 'video' && !grokVideoGenerationEnabled) return;
        onGenerate({
            prompt: prompt.trim(),
            type,
            aspectRatio,
            imageCount: editImage ? 1 : imageCount,
            videoDuration,
            editImageBase64: editImage,
            editVideoBase64: editVideo,
            referenceImageBase64s: referenceImages,
            videoResolution,
            videoSize,
            style: selectedStyle || undefined,
        });
    };

    const handleExtendSubmit = useCallback(({ prompt: extendPrompt, duration }: { prompt: string; duration: number }) => {
        if (!editVideo || isGenerating) return;
        onExtendVideo({
            prompt: extendPrompt,
            duration,
            sourceVideoBase64: editVideo,
            aspectRatio,
        });
        setExtendDialogOpen(false);
    }, [aspectRatio, editVideo, isGenerating, onExtendVideo]);

    const processUploadFiles = useCallback((files: File[]) => {
        if (files.length === 0) return;

        const readFileAsDataUrl = (file: File) =>
            new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve((event.target?.result as string) || '');
                reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
                reader.readAsDataURL(file);
            });

        void (async () => {
            const videoFile = files.find((file) => file.type.startsWith('video/'));
            if (videoFile) {
                const result = await readFileAsDataUrl(videoFile);
                setEditVideo(result);
                setEditImage(null);
                setReferenceImages([]);
                return;
            }

            const imageFiles = files.filter((file) => file.type.startsWith('image/'));
            if (imageFiles.length === 0) return;

            if (type === 'video' && imageFiles.length > 1) {
                const results = await Promise.all(imageFiles.map(readFileAsDataUrl));
                setReferenceImages(results.filter(Boolean));
                setEditImage(null);
                setEditVideo(null);
                return;
            }

            const result = await readFileAsDataUrl(imageFiles[0]);
            setEditImage(result);
            setEditVideo(null);
            setReferenceImages([]);
        })().catch((error) => {
            console.error('Attachment upload failed:', error);
        });
    }, [type]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        processUploadFiles(Array.from(e.target.files ?? []));
    };

    const handleUploadDragEnter = useCallback((e: React.DragEvent<HTMLElement>) => {
        if (!hasFilesInTransfer(e.dataTransfer)) return;
        e.preventDefault();
        uploadDropDepthRef.current += 1;
        setIsUploadDragActive(true);
    }, []);

    const handleUploadDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
        if (!hasFilesInTransfer(e.dataTransfer)) return;
        e.preventDefault();
    }, []);

    const handleUploadDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
        if (!hasFilesInTransfer(e.dataTransfer)) return;
        e.preventDefault();
        uploadDropDepthRef.current = Math.max(0, uploadDropDepthRef.current - 1);
        if (uploadDropDepthRef.current === 0) {
            setIsUploadDragActive(false);
        }
    }, []);

    const handleUploadDrop = useCallback((e: React.DragEvent<HTMLElement>) => {
        if (!hasFilesInTransfer(e.dataTransfer)) return;
        e.preventDefault();
        uploadDropDepthRef.current = 0;
        setIsUploadDragActive(false);
        processUploadFiles(getDroppedFiles(e.dataTransfer));
    }, [processUploadFiles]);

    const clearAttachment = () => {
        setEditImage(null);
        setEditVideo(null);
        setReferenceImages([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const selectedFolder = folders.find((f) => f.id === selectedFolderId);
    const aspectRatioOptions = type === 'video' ? VIDEO_ASPECT_RATIOS : IMAGE_ASPECT_RATIOS;

    return (
        <div className="imagine-input-bar">
            <div className="imagine-input-bar__container">
                {/* Input Row */}
                <div className="imagine-input-bar__row">
                    {/* Attach file button - for image editing, image-to-video, or video editing */}
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={type === 'video' ? 'image/*,video/*' : 'image/*'}
                            multiple={type === 'video'}
                            className="hidden"
                            onChange={handleFileUpload}
                            aria-label={type === 'video' ? 'Upload image or video attachment' : 'Upload image attachment'}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`imagine-input-bar__icon-btn imagine-input-bar__icon-btn--attach ${isUploadDragActive ? 'imagine-input-bar__icon-btn--drag-active' : ''}`}
                            title={type === 'video' ? 'Add image/video (image-to-video or video edit)' : 'Attach image for editing'}
                            aria-label={type === 'video' ? 'Add image or video attachment' : 'Attach image for editing'}
                            disabled={isGenerating}
                            onDragEnter={handleUploadDragEnter}
                            onDragOver={handleUploadDragOver}
                            onDragLeave={handleUploadDragLeave}
                            onDrop={handleUploadDrop}
                        >
                            <Upload className="w-5 h-5" />
                        </button>
                    </>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe what you want to create..."
                        className="imagine-input-bar__input"
                        rows={1}
                        disabled={isGenerating}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />

                    {isGenerating ? (
                        <button
                            onClick={onCancel}
                            className="imagine-input-bar__cancel-btn imagine-input-bar__primary-action"
                            aria-label="Cancel generation"
                            title="Cancel generation"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!prompt.trim() || (type === 'image' && !grokImageGenerationEnabled) || (type === 'video' && !grokVideoGenerationEnabled)}
                            className="imagine-input-bar__generate-btn imagine-input-bar__primary-action"
                            title={
                                type === 'image' && !grokImageGenerationEnabled
                                    ? getImagineImageUnavailableMessage()
                                    : type === 'video' && !grokVideoGenerationEnabled
                                        ? getImagineVideoUnavailableMessage()
                                        : 'Generate'
                            }
                            aria-label={
                                type === 'image' && !grokImageGenerationEnabled
                                    ? getImagineImageUnavailableMessage()
                                    : type === 'video' && !grokVideoGenerationEnabled
                                        ? getImagineVideoUnavailableMessage()
                                        : 'Generate'
                            }
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Edit image/video preview */}
                {(editImage || editVideo || referenceImages.length > 0) && (
                    <div
                        className={`imagine-input-bar__attachment ${referenceImages.length > 0 ? 'imagine-input-bar__attachment--stack' : ''} ${isUploadDragActive ? 'imagine-input-bar__attachment--drag-active' : ''}`}
                        onDragEnter={handleUploadDragEnter}
                        onDragOver={handleUploadDragOver}
                        onDragLeave={handleUploadDragLeave}
                        onDrop={handleUploadDrop}
                    >
                        {referenceImages.length > 0 ? (
                            <div className="imagine-input-bar__attachment-stack">
                                <div className="imagine-input-bar__attachment-stack-icon">
                                    <Layers3 className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="imagine-input-bar__attachment-stack-title">{referenceImages.length} reference images</div>
                                    <div className="imagine-input-bar__attachment-stack-subtitle">
                                        {isUploadDragActive ? 'Drop files to replace references' : 'Used for video reference guidance'}
                                    </div>
                                </div>
                            </div>
                        ) : editImage ? (
                            <img src={editImage} alt="Edit" className="imagine-input-bar__attachment-img" />
                        ) : editVideo ? (
                            <video src={editVideo} className="imagine-input-bar__attachment-img" muted />
                        ) : null}
                        <button
                            onClick={clearAttachment}
                            className="imagine-input-bar__attachment-remove"
                            aria-label="Remove attachment"
                            title="Remove attachment"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {/* Actions Row */}
                <div className="imagine-input-bar__actions">
                    {/* Left: Settings, Type toggle */}
                    <div className="imagine-input-bar__left">
                        <div className="imagine-input-bar__control-cluster">
                            <button
                                onClick={onOpenSettings}
                                className="imagine-input-bar__icon-btn"
                                title="Settings"
                                aria-label="Open settings"
                            >
                                <Settings2 className="w-5 h-5" />
                            </button>

                            {/* Type toggle */}
                            <div className="imagine-input-bar__type-toggle">
                                <button
                                    onClick={() => {
                                        if (!grokImageGenerationEnabled) return;
                                        setType('image');
                                    }}
                                    disabled={!grokImageGenerationEnabled}
                                    className={`imagine-input-bar__type-btn ${type === 'image' ? 'active' : ''}`}
                                    title="Image mode"
                                    aria-label={grokImageGenerationEnabled ? 'Switch to image mode' : getImagineImageUnavailableMessage()}
                                >
                                    <ImageIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setType('video')}
                                    disabled={!grokVideoGenerationEnabled}
                                    className={`imagine-input-bar__type-btn ${type === 'video' ? 'active' : ''}`}
                                    title="Video mode"
                                    aria-label={grokVideoGenerationEnabled ? 'Switch to video mode' : getImagineVideoUnavailableMessage()}
                                >
                                    <Video className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setStyleModalOpen(true)}
                            className={`imagine-input-bar__icon-btn imagine-input-bar__style-icon ${selectedStyle ? 'imagine-input-bar__style-icon--active' : ''}`}
                            title="Choose style"
                            aria-label="Choose style"
                            disabled={isGenerating}
                        >
                            <Palette className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Center: Dropdowns */}
                    <div className="imagine-input-bar__center">
                        {(!grokImageGenerationEnabled || !grokVideoGenerationEnabled) && (
                            <div className="imagine-input-bar__hint" aria-live="polite">
                                {!grokImageGenerationEnabled && !grokVideoGenerationEnabled
                                    ? `${getImagineImageUnavailableMessage()} ${getImagineVideoUnavailableMessage()}`
                                    : !grokImageGenerationEnabled
                                        ? getImagineImageUnavailableMessage()
                                        : getImagineVideoUnavailableMessage()}
                            </div>
                        )}

                        {/* Folder selector */}
                        <div className="imagine-input-bar__dropdown">
                            <button
                                onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                                className="imagine-input-bar__dropdown-trigger"
                            >
                                <span>{selectedFolder?.name || 'All Photos'}</span>
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {showFolderDropdown && (
                                <div className="imagine-input-bar__dropdown-menu">
                                    <button
                                        onClick={() => {
                                            onSelectFolder(null);
                                            setShowFolderDropdown(false);
                                        }}
                                        className="imagine-input-bar__dropdown-item"
                                    >
                                        All Photos
                                    </button>
                                    {folders.map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => {
                                                onSelectFolder(f.id);
                                                setShowFolderDropdown(false);
                                            }}
                                            className="imagine-input-bar__dropdown-item"
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Aspect ratio */}
                        <div className="imagine-input-bar__dropdown">
                            <button
                                onClick={() => setShowAspectDropdown(!showAspectDropdown)}
                                className="imagine-input-bar__dropdown-trigger"
                            >
                                <span>{aspectRatio}</span>
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            {showAspectDropdown && (
                                <div className="imagine-input-bar__dropdown-menu">
                                    {aspectRatioOptions.map((ar) => (
                                        <button
                                            key={ar.value}
                                            onClick={() => {
                                                setAspectRatio(ar.value as AspectRatio);
                                                setShowAspectDropdown(false);
                                            }}
                                            className="imagine-input-bar__dropdown-item"
                                        >
                                            {ar.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Count / Duration */}
                        {type === 'image' ? (
                            <div className="imagine-input-bar__dropdown">
                                <button
                                    onClick={() => setShowCountDropdown(!showCountDropdown)}
                                    className="imagine-input-bar__dropdown-trigger imagine-input-bar__dropdown-trigger--compact"
                                >
                                    {editImage ? '1' : imageCount}
                                </button>
                                {showCountDropdown && !editImage && (
                                    <div className="imagine-input-bar__dropdown-menu">
                                        {[1, 2, 4].map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => {
                                                    setImageCount(n);
                                                    setShowCountDropdown(false);
                                                }}
                                                className="imagine-input-bar__dropdown-item"
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="imagine-input-bar__dropdown">
                                <button
                                    onClick={() => setShowCountDropdown(!showCountDropdown)}
                                    className="imagine-input-bar__dropdown-trigger"
                                >
                                {videoDuration}s
                            </button>
                                {showCountDropdown && (
                                    <div className="imagine-input-bar__dropdown-menu">
                                        {[4, 6, 8, 10, 12, 15].map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => {
                                                    setVideoDuration(d);
                                                    setShowCountDropdown(false);
                                                }}
                                                className="imagine-input-bar__dropdown-item"
                                            >
                                                {d}s
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    <div className="imagine-input-bar__right">
                        {type === 'video' && editVideo && (
                            <button
                                type="button"
                                onClick={() => setExtendDialogOpen(true)}
                                disabled={isGenerating}
                                className="imagine-input-bar__extend-btn"
                            >
                                <Clapperboard className="w-4 h-4" />
                                Extend
                            </button>
                        )}
                        <span className="imagine-input-bar__hint">Enter to generate</span>
                    </div>
                </div>
            </div>

            <StyleSelectorModal
                open={styleModalOpen}
                onOpenChange={setStyleModalOpen}
                selectedStyle={selectedStyle}
                onSelectStyle={setSelectedStyle}
                disabled={isGenerating}
            />

            <ImagineExtendDialog
                open={extendDialogOpen}
                onClose={() => setExtendDialogOpen(false)}
                title="Extend Attached Video"
                subtitle="Continue the uploaded clip with a new prompt."
                defaultPrompt={prompt}
                defaultDuration={6}
                isSubmitting={isGenerating}
                onSubmit={handleExtendSubmit}
            />
        </div>
    );
}
