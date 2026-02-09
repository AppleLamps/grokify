'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Send,
    X,
    Settings2,
    Sparkles,
    Image as ImageIcon,
    Video,
    Upload,
    Loader2,
    ChevronDown,
    Palette,
} from 'lucide-react';
import type { GenerationType, AspectRatio, Folder } from './types';
import { ASPECT_RATIOS } from './types';
import { StyleSelectorModal, ART_STYLES } from '@/components/StyleSelectorModal';

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
        style?: string;
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
    onCancel,
    onSelectFolder,
    onOpenSettings,
}: ImagineInputBarProps) {
    const [prompt, setPrompt] = useState('');
    const [type, setType] = useState<GenerationType>('image');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [imageCount, setImageCount] = useState(2);
    const [videoDuration, setVideoDuration] = useState(5);
    const [editImage, setEditImage] = useState<string | null>(null);
    const [editVideo, setEditVideo] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState('default');
    const [styleModalOpen, setStyleModalOpen] = useState(false);

    const [showAspectDropdown, setShowAspectDropdown] = useState(false);
    const [showFolderDropdown, setShowFolderDropdown] = useState(false);
    const [showCountDropdown, setShowCountDropdown] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [prompt]);

    const handleSubmit = () => {
        if (!prompt.trim() || isGenerating) return;
        onGenerate({
            prompt: prompt.trim(),
            type,
            aspectRatio,
            imageCount: editImage ? 1 : imageCount,
            videoDuration,
            editImageBase64: editImage,
            editVideoBase64: editVideo,
            style: selectedStyle,
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (file.type.startsWith('video/')) {
                setEditVideo(result);
                setEditImage(null);
            } else {
                setEditImage(result);
                setEditVideo(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const clearAttachment = () => {
        setEditImage(null);
        setEditVideo(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const selectedFolder = folders.find((f) => f.id === selectedFolderId);

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
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="imagine-input-bar__icon-btn"
                            title={type === 'video' ? 'Add image/video (image-to-video or video edit)' : 'Attach image for editing'}
                            disabled={isGenerating}
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
                </div>

                {/* Edit image/video preview */}
                {(editImage || editVideo) && (
                    <div className="imagine-input-bar__attachment">
                        {editImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={editImage} alt="Edit" className="imagine-input-bar__attachment-img" />
                        ) : editVideo ? (
                            <video src={editVideo} className="imagine-input-bar__attachment-img" muted />
                        ) : null}
                        <button onClick={clearAttachment} className="imagine-input-bar__attachment-remove">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {/* Actions Row */}
                <div className="imagine-input-bar__actions">
                    {/* Left: Settings, Type toggle */}
                    <div className="imagine-input-bar__left">
                        <button
                            onClick={onOpenSettings}
                            className="imagine-input-bar__icon-btn"
                            title="Settings"
                        >
                            <Settings2 className="w-5 h-5" />
                        </button>

                        {/* Type toggle */}
                        <div className="imagine-input-bar__type-toggle">
                            <button
                                onClick={() => setType('image')}
                                className={`imagine-input-bar__type-btn ${type === 'image' ? 'active' : ''}`}
                            >
                                <ImageIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setType('video')}
                                className={`imagine-input-bar__type-btn ${type === 'video' ? 'active' : ''}`}
                            >
                                <Video className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Style selector */}
                        <button
                            onClick={() => setStyleModalOpen(true)}
                            className="imagine-input-bar__icon-btn"
                            title={`Style: ${ART_STYLES.find((s) => s.id === selectedStyle)?.name || 'MAD Magazine'}`}
                            disabled={isGenerating}
                        >
                            <Palette className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Center: Dropdowns */}
                    <div className="imagine-input-bar__center">
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
                                    {ASPECT_RATIOS.map((ar) => (
                                        <button
                                            key={ar.value}
                                            onClick={() => {
                                                setAspectRatio(ar.value);
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
                                        {[5, 10, 15].map((d) => (
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

                    {/* Right: Generate/Cancel */}
                    <div className="imagine-input-bar__right">
                        {isGenerating ? (
                            <button onClick={onCancel} className="imagine-input-bar__cancel-btn">
                                <X className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!prompt.trim()}
                                className="imagine-input-bar__generate-btn"
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        )}
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
        </div>
    );
}
