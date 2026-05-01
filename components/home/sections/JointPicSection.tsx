'use client';

import { Users, Loader2, Download, ChevronDown } from 'lucide-react';

interface JointPicResult {
  imagePrompt: string;
  imageUrl: string;
  username1: string;
  username2: string;
}

interface JointPicSectionProps {
  result: JointPicResult;
  isImageLoading: boolean;
  showPrompt: boolean;
  onTogglePrompt: () => void;
  onImageLoad: () => void;
  onImageError: () => void;
  onDownload: () => void | Promise<void>;
  onGenerateAnother: () => void;
}

export default function JointPicSection({
  result,
  isImageLoading,
  showPrompt,
  onTogglePrompt,
  onImageLoad,
  onImageError,
  onDownload,
  onGenerateAnother,
}: JointPicSectionProps) {
  return (
    <div className="space-y-8 animate-fade-in" id="jointpic-results">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <Users className="w-5 h-5 text-amber-400" />
          <p className="text-lg text-amber-300">
            @{result.username1} <span className="text-amber-500">×</span> @{result.username2}
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="relative inline-block rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl shadow-amber-900/30 bg-[#0a0a0a]">
          {isImageLoading && (
            <div className="w-80 h-80 flex items-center justify-center bg-white/5">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
            </div>
          )}
          <img
            src={result.imageUrl}
            alt={`Joint artwork for @${result.username1} and @${result.username2}`}
            className={`max-w-[90vw] md:max-w-2xl h-auto ${isImageLoading ? 'hidden' : 'block'}`}
            onLoad={onImageLoad}
            onError={onImageError}
          />

          {!isImageLoading && (
            <div className="absolute bottom-4 right-4 flex gap-2">
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
            <p className="pr-8 whitespace-pre-wrap font-mono text-xs leading-relaxed">{result.imagePrompt}</p>
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={onGenerateAnother}
          className="text-neutral-500 hover:text-white transition-colors text-sm"
        >
          Create another joint picture →
        </button>
      </div>
    </div>
  );
}
