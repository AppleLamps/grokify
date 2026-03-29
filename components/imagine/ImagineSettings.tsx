'use client';

import { X, Trash2 } from 'lucide-react';
import { formatBytes } from '@/lib/imagine-storage';

interface ImagineSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    imageCount: number;
    storageInfo: { used: number; quota: number };
    onClearAll: () => void;
}

export default function ImagineSettings({
    isOpen,
    onClose,
    imageCount,
    storageInfo,
    onClearAll,
}: ImagineSettingsProps) {
    if (!isOpen) return null;

    const storagePercent = storageInfo.quota > 0
        ? Math.min((storageInfo.used / storageInfo.quota) * 100, 100)
        : 0;

    return (
        <div className="imagine-settings-backdrop" onClick={onClose}>
            <div className="imagine-settings imagine-settings--active" onClick={(e) => e.stopPropagation()}>
                <div className="imagine-settings__header">
                    <div>
                        <p className="imagine-settings__eyebrow">Workspace</p>
                        <h3 className="imagine-settings__title">Imagine Settings</h3>
                    </div>
                    <button onClick={onClose} className="imagine-settings__close">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="imagine-settings__content">
                    {/* Storage */}
                    <div className="imagine-settings__group">
                        <label className="imagine-settings__label">Storage</label>
                        <div className="imagine-settings__storage">
                            <div className="imagine-settings__storage-bar">
                                <div
                                    className="imagine-settings__storage-used"
                                    style={{ width: `${storagePercent}%` }}
                                />
                            </div>
                            <div className="imagine-settings__storage-info">
                                <span>{imageCount} images</span>
                                <span>
                                    {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Clear All */}
                    <div className="imagine-settings__group">
                        <button
                            onClick={() => {
                                if (confirm(`Are you sure you want to delete all ${imageCount} images?`)) {
                                    onClearAll();
                                    onClose();
                                }
                            }}
                            className="imagine-settings__danger-btn"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear All Images
                        </button>
                    </div>

                    {/* Info */}
                    <p className="imagine-settings__hint">
                        Images are stored locally in your browser using IndexedDB.
                    </p>
                </div>
            </div>
        </div>
    );
}
