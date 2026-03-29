'use client';

import { useEffect, useState } from 'react';
import { X, Clapperboard } from 'lucide-react';

interface ImagineExtendDialogProps {
    open: boolean;
    title: string;
    subtitle: string;
    defaultPrompt?: string;
    defaultDuration?: number;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (settings: { prompt: string; duration: number }) => void;
}

const DURATION_OPTIONS = [4, 6, 8, 10] as const;

export default function ImagineExtendDialog({
    open,
    title,
    subtitle,
    defaultPrompt = '',
    defaultDuration = 6,
    isSubmitting,
    onClose,
    onSubmit,
}: ImagineExtendDialogProps) {
    const [prompt, setPrompt] = useState(defaultPrompt);
    const [duration, setDuration] = useState(defaultDuration);

    useEffect(() => {
        if (!open) return;
        setPrompt(defaultPrompt);
        setDuration(defaultDuration);
    }, [defaultDuration, defaultPrompt, open]);

    if (!open) return null;

    const handleSubmit = () => {
        if (!prompt.trim() || isSubmitting) return;
        onSubmit({ prompt: prompt.trim(), duration });
    };

    return (
        <div className="imagine-extend-backdrop" onClick={onClose}>
            <div className="imagine-extend-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="imagine-extend-dialog__header">
                    <div>
                        <p className="imagine-extend-dialog__eyebrow">Video Extension</p>
                        <h3 className="imagine-extend-dialog__title">{title}</h3>
                        <p className="imagine-extend-dialog__subtitle">{subtitle}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="imagine-extend-dialog__close"
                        aria-label="Close extend dialog"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="imagine-extend-dialog__content">
                    <label className="imagine-extend-dialog__label" htmlFor="extend-video-prompt">
                        What happens next
                    </label>
                    <textarea
                        id="extend-video-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe how the scene should continue..."
                        className="imagine-extend-dialog__textarea"
                        rows={4}
                        disabled={isSubmitting}
                    />

                    <div className="imagine-extend-dialog__group">
                        <span className="imagine-extend-dialog__label">Extension duration</span>
                        <div className="imagine-extend-dialog__durations">
                            {DURATION_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setDuration(option)}
                                    disabled={isSubmitting}
                                    className={`imagine-extend-dialog__duration-btn ${duration === option ? 'is-active' : ''}`}
                                >
                                    {option}s
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="imagine-extend-dialog__actions">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="imagine-extend-dialog__btn"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!prompt.trim() || isSubmitting}
                        className="imagine-extend-dialog__btn imagine-extend-dialog__btn--primary"
                    >
                        <Clapperboard className="w-4 h-4" />
                        {isSubmitting ? 'Extending...' : 'Extend Video'}
                    </button>
                </div>
            </div>
        </div>
    );
}
