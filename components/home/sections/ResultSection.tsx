'use client';

import { Loader2, Download, ZoomIn, X, ChevronDown, Check, Copy } from 'lucide-react';
import { ShareButton } from '@/components/ShareButton';

export interface ResultPayload {
  imagePrompt: string;
  imageUrl: string;
  username: string;
}

interface ResultSectionProps {
  result: ResultPayload;
  isImageLoading: boolean;
  isLightboxOpen: boolean;
  showPrompt: boolean;
  isCopied: boolean;
  onTogglePrompt: () => void;
  onCopyPrompt: () => void | Promise<void>;
  onDownload: () => void | Promise<void>;
  onGenerateAnother: () => void;
  onImageLoad: () => void;
  onImageError: () => void;
  onOpenLightbox: () => void;
  onCloseLightbox: () => void;
}

export default function ResultSection({
  result,
  isImageLoading,
  isLightboxOpen,
  showPrompt,
  isCopied,
  onTogglePrompt,
  onCopyPrompt,
  onDownload,
  onGenerateAnother,
  onImageLoad,
  onImageError,
  onOpenLightbox,
  onCloseLightbox,
}: ResultSectionProps) {
  return (
    <div className="space-y-8 animate-fade-in" id="results">
      <div className="flex justify-center">
        <div className="relative inline-block rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 bg-[#0a0a0a]">
          {isImageLoading && (
            <div className="w-[90vw] max-w-2xl aspect-video flex items-center justify-center bg-white/5">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
            </div>
          )}
          <img
            src={result.imageUrl}
            alt={`Generated artwork for @${result.username}`}
            className={`max-w-[90vw] md:max-w-2xl h-auto cursor-zoom-in ${isImageLoading ? 'hidden' : 'block'}`}
            onClick={onOpenLightbox}
            onLoad={onImageLoad}
            onError={onImageError}
          />

          {!isImageLoading && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={onOpenLightbox}
                className="p-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg text-white hover:bg-black/70 transition-colors shadow-lg"
                title="View larger"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <ShareButton
                imageUrl={result.imageUrl}
                username={result.username}
                className="bg-black/50 backdrop-blur-md border-white/10 hover:bg-black/70 shadow-lg text-sm py-2"
                variant="secondary"
              />
              <button
                onClick={onDownload}
                className="px-4 py-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-black/70 transition-colors shadow-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          )}
        </div>
      </div>

      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onCloseLightbox}
        >
          <button
            onClick={onCloseLightbox}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="absolute top-4 right-16 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-colors z-10 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <img
            src={result.imageUrl}
            alt={`Generated artwork for @${result.username}`}
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl cursor-zoom-out"
            onClick={(e) => {
              e.stopPropagation();
              onCloseLightbox();
            }}
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <button
          onClick={onTogglePrompt}
          className="text-neutral-500 hover:text-white transition-colors text-sm flex items-center gap-2 mx-auto"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showPrompt ? 'rotate-180' : ''}`} />
          {showPrompt ? 'Hide' : 'View'} creative brief
        </button>

        {showPrompt && (
          <div className="mt-4 p-6 bg-white/5 border border-white/10 rounded-xl text-sm text-neutral-300 relative">
            <button onClick={onCopyPrompt} className="absolute top-3 right-3 text-neutral-500 hover:text-white">
              {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <p className="pr-8 whitespace-pre-wrap font-mono text-xs leading-relaxed">{result.imagePrompt}</p>
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={onGenerateAnother}
          className="text-neutral-500 hover:text-white transition-colors text-sm"
        >
          Generate another →
        </button>
      </div>
    </div>
  );
}
