// import ImagineClient from '@/components/imagine/ImagineClient';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function ImaginePage() {
    return (
        // Grok Imagine page temporarily unavailable — restore by un-commenting ImagineClient above and replacing this block
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
            <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 mb-6 inline-flex">
                <Zap className="w-10 h-10 text-violet-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Grok Imagine is Temporarily Unavailable</h1>
            <p className="text-neutral-400 max-w-md mb-8 leading-relaxed">
                This feature is currently down for maintenance. Check back soon!
            </p>
            <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all text-sm font-medium"
            >
                ← Back to Home
            </Link>
        </div>
    );
}
