'use client';

import { Pencil, Download } from 'lucide-react';

interface CaricatureResult {
  comment: string;
  prompt: string;
  imageUrl: string;
}

interface CaricatureSectionProps {
  result: CaricatureResult;
  onDownload: () => void | Promise<void>;
  onGenerateAnother: () => void;
}

export default function CaricatureSection({
  result,
  onDownload,
  onGenerateAnother,
}: CaricatureSectionProps) {
  return (
    <div className="space-y-8 animate-fade-in" id="caricature-results">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
          <Pencil className="w-5 h-5 text-purple-400" />
          <p className="text-lg text-purple-300 italic">&ldquo;{result.comment}&rdquo;</p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="relative inline-block rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl shadow-purple-900/30 bg-white">
          <img
            src={result.imageUrl}
            alt="Your caricature"
            className="max-w-[90vw] md:max-w-2xl h-auto"
          />

          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-black/50 backdrop-blur-md border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-black/70 transition-colors shadow-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onGenerateAnother}
          className="text-neutral-500 hover:text-white transition-colors text-sm"
        >
          Create another caricature →
        </button>
      </div>
    </div>
  );
}
