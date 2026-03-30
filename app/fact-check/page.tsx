import type { Metadata } from 'next';

import FactCheckClient from '@/components/fact-check/FactCheckClient';

export const metadata: Metadata = {
  title: 'Fact Check X Post',
  description:
    'Paste an X post URL and get a structured fact check with a clean summary, claim-by-claim verdicts, and optional sources.',
  alternates: {
    canonical: '/fact-check',
  },
};

export default function FactCheckPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="wrapped-background fixed inset-0" />

      <FactCheckClient />
    </div>
  );
}
