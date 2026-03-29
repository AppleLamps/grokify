'use client';

import { useState } from 'react';
import {
    FolderOpen,
    ChevronLeft,
    Plus,
    Trash2,
    LayoutGrid,
    PanelLeft,
    Edit2,
    Home,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { Folder, GalleryImage } from './types';

interface ImagineSidebarProps {
    folders: Folder[];
    images: GalleryImage[];
    selectedFolderId: string | null;
    onSelectFolder: (id: string | null) => void;
    onCreateFolder: (name: string) => Promise<Folder>;
    onDeleteFolder: (id: string) => Promise<void>;
    isOpen: boolean;
    onToggle: () => void;
}

export default function ImagineSidebar({
    folders,
    images,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onDeleteFolder,
    isOpen,
    onToggle,
}: ImagineSidebarProps) {
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const getImageCount = (folderId: string | null) => {
        if (folderId === null) return images.length;
        return images.filter((img) => img.folderId === folderId).length;
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        await onCreateFolder(newFolderName.trim());
        setNewFolderName('');
        setIsCreating(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="imagine-sidebar-toggle"
                title="Open sidebar"
            >
                <PanelLeft className="w-5 h-5" />
            </button>
        );
    }

    return (
        <aside className="imagine-sidebar">
            <div className="imagine-sidebar__header">
                <div className="imagine-sidebar__header-left">
                    <Link href="/" className="imagine-sidebar__home" title="Back to home">
                        <Home className="w-4 h-4" />
                    </Link>
                    <h2 className="imagine-sidebar__title">Folders</h2>
                </div>
                <button
                    onClick={onToggle}
                    className="imagine-sidebar__collapse"
                    title="Collapse sidebar"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>

            <div className="imagine-sidebar__content">
                <nav className="imagine-sidebar__nav">
                    {/* All Photos */}
                    <button
                        onClick={() => onSelectFolder(null)}
                        className={`imagine-sidebar__folder ${selectedFolderId === null ? 'imagine-sidebar__folder--active' : ''}`}
                    >
                        <span className="imagine-sidebar__folder-icon">
                            <LayoutGrid className="w-4 h-4" />
                        </span>
                        <span className="imagine-sidebar__folder-name">All Photos</span>
                        <span className="imagine-sidebar__folder-count">{getImageCount(null)}</span>
                    </button>

                    {/* Custom Folders */}
                    {folders.map((folder) => (
                        <div key={folder.id} className="imagine-sidebar__folder-item">
                            <button
                                onClick={() => onSelectFolder(folder.id)}
                                className={`imagine-sidebar__folder ${selectedFolderId === folder.id ? 'imagine-sidebar__folder--active' : ''}`}
                            >
                                <span className="imagine-sidebar__folder-icon">
                                    <FolderOpen className="w-4 h-4" />
                                </span>
                                <span className="imagine-sidebar__folder-name">{folder.name}</span>
                                <span className="imagine-sidebar__folder-count">
                                    {getImageCount(folder.id)}
                                </span>
                            </button>
                            {isEditMode && (
                                <button
                                    onClick={() => onDeleteFolder(folder.id)}
                                    className="imagine-sidebar__folder-delete"
                                    title="Delete folder"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="imagine-sidebar__actions">
                    {isCreating ? (
                        <div className="imagine-sidebar__create-form">
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Folder name"
                                className="imagine-sidebar__input"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateFolder();
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                            />
                            <button onClick={handleCreateFolder} className="imagine-sidebar__save-btn">
                                Save
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link href="/prompt" className="imagine-sidebar__add-btn imagine-sidebar__prompt-link">
                                <Sparkles className="w-4 h-4" />
                                <span>Grokify Prompt</span>
                            </Link>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="imagine-sidebar__add-btn"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New Folder</span>
                            </button>
                            {folders.length > 0 && (
                                <button
                                    onClick={() => setIsEditMode(!isEditMode)}
                                    className={`imagine-sidebar__add-btn ${isEditMode ? 'imagine-sidebar__add-btn--active' : ''}`}
                                >
                                    <Edit2 className="w-4 h-4" />
                                    <span>Edit Folders</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}
