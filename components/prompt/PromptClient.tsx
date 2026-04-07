'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Trash2,
  Shuffle,
  Zap,
  Copy,
  Check,
  ChevronDown,
  HelpCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  STYLE_PRESETS,
  PROMPT_CONFIG,
  LIGHTING_MODES,
  IMAGE_INTENTS,
  type JsonPromptPayload,
  type ImageIntent,
  type LightingMode,
} from '@/lib/prompt-config-client';
import {
  cleanupPreviewUrl,
  compressImageDataUrl,
  replacePreviewUrl,
} from '@/lib/prompt-client-utils';
import { getDroppedFiles, hasFilesInTransfer } from '@/lib/drag-drop-utils';
import { IMAGINE_HANDOFF_QUERY, saveImagineHandoff } from '@/lib/imagine-handoff';

// Types
type CopyTarget = 'default' | 'json' | 'scene' | '';

const RANDOM_IDEAS = [
  'A cyberpunk samurai standing on a neon-lit rooftop in Tokyo',
  'An ancient library floating in the clouds at sunset',
  'A mechanical dragon made of brass and clockwork parts',
  'A lone astronaut discovering an alien garden on Mars',
  'A steampunk airship navigating through a storm',
  'A mystical forest with bioluminescent trees and floating spirits',
  'A futuristic city built inside a giant crystal cave',
  'An underwater kingdom with merpeople and ancient ruins',
  'A phoenix rising from volcanic ashes at dawn',
  'A time traveler in Victorian London meeting their past self',
] as const;

const STYLE_PRESET_NAMES = Object.keys(STYLE_PRESETS);

export default function PromptClient() {
  const router = useRouter();

  // Form state
  const [idea, setIdea] = useState('');
  const [directions, setDirections] = useState('');
  const [activeStyles, setActiveStyles] = useState<Set<string>>(new Set());
  const [showStylePresets, setShowStylePresets] = useState(false);

  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isImageDropActive, setIsImageDropActive] = useState(false);

  // Config flags
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isVideoPrompt, setIsVideoPrompt] = useState(false);
  const [detailBoost, setDetailBoost] = useState(false);
  const [realismBias, setRealismBias] = useState(false);
  const [lightingMode, setLightingMode] = useState<LightingMode>('AUTO');
  const [imageIntent, setImageIntent] = useState<ImageIntent>('RECREATE_CLOSELY');

  // Output state
  const [generatedPrompt, setGeneratedPrompt] = useState<string | JsonPromptPayload | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedType, setCopiedType] = useState<CopyTarget>('');

  // Help modal state
  const [showHelp, setShowHelp] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const imageDropDepthRef = useRef(0);

  useEffect(() => {
    return () => {
      cleanupPreviewUrl(imagePreview, (url) => URL.revokeObjectURL(url));
    };
  }, [imagePreview]);

  // Computed directions with styles
  const directionsWithStyles = useMemo(() => {
    const base = (directions || '').trim();
    const styleText = Array.from(activeStyles)
      .map((name) => STYLE_PRESETS[name])
      .filter(Boolean)
      .join(', ');
    if (base && styleText) return `${base}, ${styleText}`;
    return base || styleText || '';
  }, [directions, activeStyles]);

  const imaginePrompt = useMemo(() => {
    if (!generatedPrompt) return null;
    if (typeof generatedPrompt === 'string') {
      const prompt = generatedPrompt.trim();
      return prompt || null;
    }

    const prompt = generatedPrompt.scene.trim();
    return prompt || null;
  }, [generatedPrompt]);

  // Toggle style preset
  const toggleStyle = useCallback((styleName: string) => {
    if (!STYLE_PRESETS[styleName]) return;
    setActiveStyles((prev) => {
      const next = new Set(prev);
      if (next.has(styleName)) {
        next.delete(styleName);
      } else {
        next.add(styleName);
      }
      return next;
    });
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    if (file.size > PROMPT_CONFIG.IMAGE_MAX_SIZE) {
      setError('Image file size must be less than 10MB.');
      return;
    }

    setError('');
    setIsCompressing(true);

    try {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview((current) => replacePreviewUrl(current, previewUrl, (url) => URL.revokeObjectURL(url)));

      const compressed = await compressImageDataUrl(file, {
        maxDimension: PROMPT_CONFIG.IMAGE_MAX_DIMENSION,
        targetSizeBytes: PROMPT_CONFIG.IMAGE_TARGET_SIZE,
      });

      setImageMimeType(compressed.mimeType);
      setImageBase64(compressed.base64);
      setIsCompressing(false);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Error processing image.');
      setIsCompressing(false);
    }
  }, []);

  // Remove image
  const handleImageRemove = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType('image/png');
  }, []);

  const handleDroppedPromptFiles = useCallback((files: File[]) => {
    const imageFile = files.find((file) => file.type.startsWith('image/'));
    if (imageFile) {
      void handleImageUpload(imageFile);
      return;
    }

    setError('Please upload a valid image file.');
  }, [handleImageUpload]);

  const handleImageDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!hasFilesInTransfer(e.dataTransfer)) return;
    e.preventDefault();
    imageDropDepthRef.current += 1;
    setIsImageDropActive(true);
  }, []);

  const handleImageDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!hasFilesInTransfer(e.dataTransfer)) return;
    e.preventDefault();
  }, []);

  const handleImageDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!hasFilesInTransfer(e.dataTransfer)) return;
    e.preventDefault();
    imageDropDepthRef.current = Math.max(0, imageDropDepthRef.current - 1);
    if (imageDropDepthRef.current === 0) {
      setIsImageDropActive(false);
    }
  }, []);

  const handleImageDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!hasFilesInTransfer(e.dataTransfer)) return;
    e.preventDefault();
    imageDropDepthRef.current = 0;
    setIsImageDropActive(false);
    handleDroppedPromptFiles(getDroppedFiles(e.dataTransfer));
  }, [handleDroppedPromptFiles]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idea.trim() && !imageBase64) {
      setError('Please enter an idea or upload an image.');
      return;
    }

    setIsLoading(true);
    setError('');
    setShowOutput(false);

    try {
      const response = await fetch('/api/prompt-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: idea.trim(),
          directions: directionsWithStyles,
          isJsonMode,
          isTestMode,
          isVideoPrompt,
          detailBoost,
          realismBias,
          lightingMode,
          imageIntent,
          imageBase64,
          imageMimeType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate prompt');
      }

      setGeneratedPrompt(data.prompt);
      setShowOutput(true);
      toast.success('Prompt generated!');

      // Scroll to output
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (err) {
      console.error('Generation error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle surprise/random
  const handleSurpriseMe = async () => {
    setIsSurpriseLoading(true);
    setError('');
    setShowOutput(false);

    const randomIdea = RANDOM_IDEAS[Math.floor(Math.random() * RANDOM_IDEAS.length)];

    try {
      const response = await fetch('/api/prompt-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: randomIdea,
          directions: '',
          isJsonMode: false,
          isTestMode: false,
          isVideoPrompt: false,
          detailBoost: false,
          realismBias: false,
          lightingMode: 'AUTO',
          imageIntent: 'RECREATE_CLOSELY',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate surprise prompt');
      }

      setIdea(randomIdea);
      setGeneratedPrompt(data.prompt);
      setShowOutput(true);
      toast.success('Surprise prompt generated!');

      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (err) {
      console.error('Surprise error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      toast.error(message);
    } finally {
      setIsSurpriseLoading(false);
    }
  };

  // Clear all
  const handleClearAll = () => {
    setIdea('');
    setDirections('');
    setActiveStyles(new Set());
    setGeneratedPrompt(null);
    setError('');
    setShowOutput(false);
    setDetailBoost(false);
    setRealismBias(false);
    setLightingMode('AUTO');
    setImageIntent('RECREATE_CLOSELY');
    handleImageRemove();
  };

  // Copy functions
  const copyToClipboard = async (text: string, type: CopyTarget) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedType(''), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleCopyDefault = () => {
    if (!generatedPrompt) return;
    const text = typeof generatedPrompt === 'string'
      ? generatedPrompt
      : JSON.stringify(generatedPrompt, null, 2);
    copyToClipboard(text, 'default');
  };

  const handleCopyJson = () => {
    if (!generatedPrompt) return;
    copyToClipboard(JSON.stringify(generatedPrompt, null, 2), 'json');
  };

  const handleCopyScene = () => {
    if (!generatedPrompt || typeof generatedPrompt === 'string') return;
    copyToClipboard(generatedPrompt.scene, 'scene');
  };

  const handleGenerateWithImagine = useCallback(() => {
    if (!imaginePrompt) return;

    saveImagineHandoff({
      prompt: imaginePrompt,
      autogenerate: true,
      createdAt: Date.now(),
    });

    router.push(`/imagine?handoff=${IMAGINE_HANDOFF_QUERY}`);
  }, [imaginePrompt, router]);

  const isAnyLoading = isLoading || isSurpriseLoading;

  return (
    <>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-amber-500 mb-2 text-glow-amber-lg">
            <span className="text-gray-500">// </span>GROKIFY_PROMPT
            <span className="text-amber-400"> v2.0</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-mono uppercase tracking-wider">
            GROK IMAGINE PROMPTS
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Primary Inputs */}
            <div className="lg:col-span-2 space-y-4">
              {/* Section 01: Primary Input */}
              <div className="p-5 bg-black/20 border border-amber-500/15">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">
                  01 // PRIMARY_INPUT_DATA
                </h2>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-black/40 border border-white/10 text-gray-200 font-mono resize-none min-h-[180px] focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder:text-gray-600 selection:bg-amber-400/85 selection:text-neutral-950"
                  placeholder="ENTER_CONCEPT_DESCRIPTION..."
                  maxLength={1000}
                  disabled={isAnyLoading}
                />
                <div className="mt-2 text-xs text-gray-600 font-mono">
                  {idea.length}/1000 CHARS
                </div>
              </div>

              {/* Section 02: Modifiers */}
              <div className="p-5 bg-black/20 border border-amber-500/15">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">
                  02 // MODIFIERS
                </h2>
                <textarea
                  value={directions}
                  onChange={(e) => setDirections(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-black/40 border border-white/10 text-gray-200 font-mono resize-none min-h-[80px] focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder:text-gray-600 selection:bg-amber-400/85 selection:text-neutral-950"
                  placeholder="STYLE_PARAMS: cinematic, cyberpunk | MOOD: mysterious..."
                  maxLength={500}
                  disabled={isAnyLoading}
                />
                <div className="mt-2 text-xs text-gray-600 font-mono">
                  ACTIVE_PARAMS: {directionsWithStyles || 'NULL'}
                </div>
              </div>

              {/* Section 03: Style Matrix */}
              <div className="p-5 bg-black/20 border border-amber-500/15">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">
                  03 // STYLE_MATRIX
                </h2>
                <button
                  type="button"
                  onClick={() => setShowStylePresets(!showStylePresets)}
                  className="w-full px-4 py-3 text-sm text-left bg-black/40 border border-white/10 text-gray-400 font-mono cursor-pointer hover:border-amber-500/30 transition-all flex items-center justify-between"
                >
                  <span>SELECT_PRESETS ({activeStyles.size} ACTIVE)</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showStylePresets ? 'rotate-180' : ''}`} />
                </button>

                {showStylePresets && (
                  <div className="mt-3 p-4 border border-amber-500/10 bg-black/30">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {STYLE_PRESET_NAMES.map((styleName) => (
                        <button
                          key={styleName}
                          type="button"
                          onClick={() => toggleStyle(styleName)}
                          className={`px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all text-center ${
                            activeStyles.has(styleName)
                              ? 'bg-amber-500 text-black border border-amber-500'
                              : 'bg-transparent border border-white/10 text-gray-500 hover:border-amber-500/40 hover:text-amber-500'
                          }`}
                        >
                          {styleName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Image & Config */}
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="p-5 bg-black/20 border border-amber-500/15">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">
                  04 // IMG_REFERENCE
                </h2>

                {isCompressing ? (
                  <div className="relative flex flex-col items-center justify-center min-h-[140px] border border-dashed border-white/15 bg-black/30">
                    <div className="w-5 h-5 border-2 border-gray-600 border-t-amber-500 rounded-full animate-spin mb-3" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">
                      PROCESSING...
                    </p>
                  </div>
                ) : imagePreview ? (
                  <div
                    className="space-y-2"
                    onDragEnter={handleImageDragEnter}
                    onDragOver={handleImageDragOver}
                    onDragLeave={handleImageDragLeave}
                    onDrop={handleImageDrop}
                  >
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Upload preview"
                        className={`w-full h-36 object-cover border transition-all ${
                          isImageDropActive
                            ? 'border-amber-400/80 shadow-[0_0_0_1px_rgba(251,191,36,0.3),0_0_28px_rgba(245,158,11,0.22)]'
                            : 'border-white/10'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleImageRemove}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all"
                        aria-label="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`relative flex flex-col items-center justify-center min-h-[140px] border border-dashed bg-black/30 cursor-pointer transition-all ${
                      isImageDropActive
                        ? 'border-amber-400/80 bg-amber-500/[0.08] shadow-[0_0_0_1px_rgba(251,191,36,0.3),0_0_30px_rgba(245,158,11,0.2)]'
                        : 'border-white/15 hover:border-amber-500/40'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleImageDragEnter}
                    onDragOver={handleImageDragOver}
                    onDragLeave={handleImageDragLeave}
                    onDrop={handleImageDrop}
                  >
                    {/* Corner brackets */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-white/30" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-white/30" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-white/30" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-white/30" />

                    <Upload className="w-8 h-8 text-gray-500 mb-3" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-300 mb-1">
                      IMG_REF_UPLOAD
                    </p>
                    <p className={`text-xs ${isImageDropActive ? 'text-amber-300' : 'text-gray-600'}`}>
                      {isImageDropActive ? 'DROP_IMAGE_HERE' : 'DRAG_DROP_TARGET'}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      className="hidden"
                      aria-label="Upload reference image"
                    />
                  </div>
                )}
              </div>

              {/* Config Flags */}
              <div className="p-5 bg-black/20 border border-amber-500/15">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">
                  05 // CONFIG_FLAGS
                </h2>
                <div className="space-y-4">
                  {/* Emily's JSON Mode */}
                  <div className="flex items-center justify-between group">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400 group-hover:text-amber-500/80 transition-colors">
                        EMILY_JSON_MODE
                      </span>
                      <a
                        href="https://x.com/IamEmily2050"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[10px] text-gray-600 hover:text-amber-500 mt-0.5 font-mono"
                      >
                        @IamEmily2050
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsJsonMode((v) => !v)}
                      className={`min-w-[80px] px-3 py-1.5 text-xs font-mono border transition-all ${
                        isJsonMode
                          ? 'bg-amber-500 border-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : 'bg-black/40 border-white/10 text-gray-500 hover:border-amber-500/50 hover:text-amber-500'
                      }`}
                    >
                      {isJsonMode ? '[ACTIVE]' : '[INACTIVE]'}
                    </button>
                  </div>

                  {/* Test Mode */}
                  <div className="flex items-center justify-between group">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400 group-hover:text-amber-500/80 transition-colors">
                        TEST_ELYSIAN
                      </span>
                      <span className="block text-[10px] text-gray-600 mt-0.5 font-mono">Elysian Visions</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTestMode((v) => !v)}
                      className={`min-w-[80px] px-3 py-1.5 text-xs font-mono border transition-all ${
                        isTestMode
                          ? 'bg-amber-500 border-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : 'bg-black/40 border-white/10 text-gray-500 hover:border-amber-500/50 hover:text-amber-500'
                      }`}
                    >
                      {isTestMode ? '[ACTIVE]' : '[INACTIVE]'}
                    </button>
                  </div>

                  {/* Video Prompt */}
                  <div className="flex items-center justify-between group">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400 group-hover:text-amber-500/80 transition-colors">
                        VIDEO_SEQ
                      </span>
                      <span className="block text-[10px] text-gray-600 mt-0.5 font-mono">Text-to-video</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVideoPrompt((v) => !v)}
                      className={`min-w-[80px] px-3 py-1.5 text-xs font-mono border transition-all ${
                        isVideoPrompt
                          ? 'bg-amber-500 border-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : 'bg-black/40 border-white/10 text-gray-500 hover:border-amber-500/50 hover:text-amber-500'
                      }`}
                    >
                      {isVideoPrompt ? '[ACTIVE]' : '[INACTIVE]'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400 group-hover:text-amber-500/80 transition-colors">
                        DETAIL_BOOST
                      </span>
                      <span className="block text-[10px] text-gray-600 mt-0.5 font-mono">Higher scene density</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailBoost((v) => !v)}
                      className={`min-w-[80px] px-3 py-1.5 text-xs font-mono border transition-all ${
                        detailBoost
                          ? 'bg-amber-500 border-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : 'bg-black/40 border-white/10 text-gray-500 hover:border-amber-500/50 hover:text-amber-500'
                      }`}
                    >
                      {detailBoost ? '[ACTIVE]' : '[INACTIVE]'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400 group-hover:text-amber-500/80 transition-colors">
                        REALISM_BIAS
                      </span>
                      <span className="block text-[10px] text-gray-600 mt-0.5 font-mono">Grounded materials</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRealismBias((v) => !v)}
                      className={`min-w-[80px] px-3 py-1.5 text-xs font-mono border transition-all ${
                        realismBias
                          ? 'bg-amber-500 border-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : 'bg-black/40 border-white/10 text-gray-500 hover:border-amber-500/50 hover:text-amber-500'
                      }`}
                    >
                      {realismBias ? '[ACTIVE]' : '[INACTIVE]'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        LIGHTING_MODE
                      </span>
                      <span className="block text-[10px] text-gray-600 mt-0.5 font-mono">Force a lighting identity</span>
                    </div>
                    <div className="relative">
                      <select
                        value={lightingMode}
                        onChange={(e) => setLightingMode(e.target.value as LightingMode)}
                        className="w-full appearance-none bg-black/40 border border-white/10 text-gray-300 font-mono text-xs tracking-wider px-3 py-2.5 pr-9 focus:outline-none focus:border-amber-500/50 hover:border-amber-500/30 transition-all"
                        disabled={isAnyLoading}
                        aria-label="Select lighting mode"
                      >
                        {LIGHTING_MODES.map((mode) => (
                          <option key={mode} value={mode} className="bg-[#0d0d0d]">
                            {mode}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-500" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        IMAGE_INTENT
                      </span>
                      <span className="block text-[10px] text-gray-600 mt-0.5 font-mono">How uploaded images should be interpreted</span>
                    </div>
                    <div className="relative">
                      <select
                        value={imageIntent}
                        onChange={(e) => setImageIntent(e.target.value as ImageIntent)}
                        className="w-full appearance-none bg-black/40 border border-white/10 text-gray-300 font-mono text-xs tracking-wider px-3 py-2.5 pr-9 focus:outline-none focus:border-amber-500/50 hover:border-amber-500/30 transition-all"
                        disabled={isAnyLoading}
                        aria-label="Select image intent"
                      >
                        {IMAGE_INTENTS.map((intent) => (
                          <option key={intent} value={intent} className="bg-[#0d0d0d]">
                            {intent}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 border border-amber-500/10 bg-black/20">
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isAnyLoading}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-transparent border border-white/10 text-gray-400 hover:border-amber-500/40 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                PURGE_DATA
              </button>
              <button
                type="button"
                onClick={handleSurpriseMe}
                disabled={isAnyLoading}
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-transparent border border-white/10 text-gray-400 hover:border-amber-500/40 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSurpriseLoading ? 'animate-pulse' : ''
                }`}
              >
                {isSurpriseLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-amber-500 rounded-full animate-spin" />
                ) : (
                  <>
                    <Shuffle className="w-4 h-4" />
                    RANDOMIZE_SEED
                  </>
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={isAnyLoading || (!idea.trim() && !imageBase64)}
              className={`px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isLoading
                  ? 'prompt-execute-loading text-neutral-950 border border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.45)]'
                  : 'bg-amber-500 hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] text-black'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-neutral-900/25 border-t-neutral-900 rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  EXECUTE
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-900/30 border-l-2 border-red-500 text-red-400 font-mono text-sm">
            {error}
          </div>
        )}

        {/* Output Section */}
        {showOutput && generatedPrompt && (
          <div ref={outputRef} className="mt-6 bg-black/30 border border-amber-500/20">
            {/* Output Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/15">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-500">
                06 // OUTPUT_STREAM
              </span>
              <div className="flex items-center gap-2">
                {/* GENERATE with Imagine button — temporarily hidden */}
                {/* {imaginePrompt && (
                  <button
                    type="button"
                    onClick={handleGenerateWithImagine}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-xs uppercase tracking-wider whitespace-nowrap bg-amber-500 text-black border border-amber-500 hover:bg-amber-400 hover:shadow-[0_0_18px_rgba(245,158,11,0.25)] transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    GENERATE
                  </button>
                )} */}
                <button
                  type="button"
                  onClick={handleCopyDefault}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                    copiedType === 'default'
                      ? 'bg-amber-500 text-black border-amber-500'
                      : 'bg-transparent border border-white/10 text-gray-400 hover:border-amber-500/40 hover:text-gray-200'
                  }`}
                >
                  {copiedType === 'default' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  COPY
                </button>
                {isJsonMode && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      className={`flex items-center justify-center gap-2 px-3 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                        copiedType === 'json'
                          ? 'bg-amber-500 text-black border-amber-500'
                          : 'bg-transparent border border-white/10 text-gray-400 hover:border-amber-500/40 hover:text-gray-200'
                      }`}
                    >
                      {copiedType === 'json' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyScene}
                      className={`flex items-center justify-center gap-2 px-3 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                        copiedType === 'scene'
                          ? 'bg-amber-500 text-black border-amber-500'
                          : 'bg-transparent border border-white/10 text-gray-400 hover:border-amber-500/40 hover:text-gray-200'
                      }`}
                    >
                      {copiedType === 'scene' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      SCENE
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Output Content */}
            <div className="p-5">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-gray-200">
                {typeof generatedPrompt === 'string'
                  ? generatedPrompt
                  : JSON.stringify(generatedPrompt, null, 2)}
              </pre>
            </div>
          </div>
        )}

      </main>

      {/* Help Button */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 w-12 h-12 flex items-center justify-center bg-[#111] border border-white/10 text-gray-400 hover:border-amber-500/40 hover:text-amber-500 transition-all z-50"
        aria-label="Open help"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fade-in"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="relative w-full max-w-lg p-6 bg-[#0d0d0d] border border-amber-500/20 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              aria-label="Close help"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-amber-500 mb-4 font-mono">
              // HELP_DOCUMENTATION
            </h2>
            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <h3 className="text-amber-500 font-mono mb-1">PRIMARY_INPUT_DATA</h3>
                <p className="text-gray-400">Enter your main idea or concept for the image you want to generate.</p>
              </div>
              <div>
                <h3 className="text-amber-500 font-mono mb-1">MODIFIERS</h3>
                <p className="text-gray-400">Add style directions, mood, or additional parameters to refine your prompt.</p>
              </div>
              <div>
                <h3 className="text-amber-500 font-mono mb-1">STYLE_MATRIX</h3>
                <p className="text-gray-400">Quick-select visual style presets like Cinematic, Cyberpunk, Fantasy, etc.</p>
              </div>
              <div>
                <h3 className="text-amber-500 font-mono mb-1">IMG_REFERENCE</h3>
                <p className="text-gray-400">Upload a reference image to analyze and incorporate into your prompt.</p>
              </div>
              <div>
                <h3 className="text-amber-500 font-mono mb-1">CONFIG_FLAGS</h3>
                <p className="text-gray-400">
                  <strong>EMILY_JSON_MODE:</strong> Structured JSON output for advanced workflows<br />
                  <strong>TEST_ELYSIAN:</strong> Alternative poetic prompt style<br />
                  <strong>VIDEO_SEQ:</strong> Generate text-to-video scene descriptions<br />
                  <strong>DETAIL_BOOST:</strong> Adds richer texture, props, and environment density<br />
                  <strong>REALISM_BIAS:</strong> Pushes believable materials and physical image behavior<br />
                  <strong>LIGHTING_MODE:</strong> Forces a stronger lighting identity like noir, neon, or golden hour<br />
                  <strong>IMAGE_INTENT:</strong> Tells the model whether an uploaded image should be recreated closely or handled in another future mode
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom animations (EXECUTE gold shimmer lives in globals.css as .prompt-execute-loading) */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
