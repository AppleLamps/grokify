import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import PromptClient from '@/components/prompt/PromptClient';

export default function PromptPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      <header className="border-b border-amber-500/20 bg-black/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to X-pressionist</span>
            </Link>
            <Link
              href="/imagine"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-400 transition-all hover:border-amber-400/40 hover:bg-amber-500/15 hover:text-amber-300"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Imagine
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://bags.fm/8F2FvujRh6zqoR4wtasocKgw4oPcu3MWK4MG77NwBAGS"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm font-mono text-amber-500 hover:text-amber-400 transition-colors animate-pulse text-glow-amber"
            >
              <span className="hidden sm:inline">CA: 8F2FvujRh6zqoR4wtasocKgw4oPcu3MWK4MG77NwBAGS</span>
              <span className="sm:hidden">CA: 8F2F...BAGS</span>
            </a>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-yellow-400 text-glow-yellow">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse dot-glow-green" />
              ONLINE
            </div>
          </div>
        </div>
      </header>

      <PromptClient />

      <footer className="mt-12 text-center py-6 border-t border-amber-500/15">
        <p className="text-xs text-gray-600 font-mono uppercase tracking-wider">
          POWERED_BY: OpenRouter API | MODEL: x-ai/grok-4.1-fast
        </p>
        <p className="text-xs text-gray-600 font-mono mt-2">
          CREATED_BY: @lamps_apple |{' '}
          <a
            href="https://x.com/lamps_apple"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-500 transition-colors"
          >
            FOLLOW_ON_𝕏
          </a>
        </p>
      </footer>
    </div>
  );
}
