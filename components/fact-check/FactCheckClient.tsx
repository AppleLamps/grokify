'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { CheckCircle2, ExternalLink, FileSearch, Link2, Loader2, Search, ShieldCheck, Timer } from 'lucide-react';
import type {
  FactCheckXApiResponse,
  FactCheckXMode,
  FactCheckXVerdict,
} from '@/lib/fact-check-x-schema';

const MODE_OPTIONS: Array<{
  value: FactCheckXMode;
  label: string;
  description: string;
}> = [
  {
    value: 'quick',
    label: 'Quick',
    description: 'Lower latency research with the standard reasoning model.',
  },
  {
    value: 'deep',
    label: 'Deep',
    description: 'Multi-agent research with more scrutiny and higher latency.',
  },
];

const REPORT_PREVIEW = [
  {
    icon: CheckCircle2,
    title: 'Bottom line',
    description: 'A short read on whether the post holds up, needs context, or falls apart.',
  },
  {
    icon: FileSearch,
    title: 'Claim breakdown',
    description: 'Each factual claim gets its own verdict: supported, contradicted, unclear, or not checkable.',
  },
  {
    icon: Link2,
    title: 'Source trail',
    description: 'Open the references when you want to inspect the evidence yourself.',
  },
];

const modeLabels: Record<FactCheckXMode, string> = {
  quick: 'Quick',
  deep: 'Deep',
};

const verdictStyles: Record<FactCheckXVerdict, string> = {
  supported: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
  contradicted: 'border-rose-400/20 bg-rose-500/10 text-rose-200',
  unclear: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
  not_checkable: 'border-slate-400/20 bg-slate-500/10 text-slate-200',
};

const verdictLabels: Record<FactCheckXVerdict, string> = {
  supported: 'Supported',
  contradicted: 'Contradicted',
  unclear: 'Unclear',
  not_checkable: 'Not Checkable',
};

function renderSummary(summaryMd: string) {
  return summaryMd
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={`${paragraph.slice(0, 24)}-${index}`} className="text-sm leading-7 text-neutral-200 sm:text-[15px]">
        {paragraph}
      </p>
    ));
}

export default function FactCheckClient() {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<FactCheckXMode>('quick');
  const [result, setResult] = useState<FactCheckXApiResponse | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError('Paste an X post URL to begin.');
      return;
    }

    setError('');
    setResult(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/fact-check-x', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: trimmedUrl,
            mode,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Fact check failed.');
        }

        setResult(payload as FactCheckXApiResponse);
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : 'Fact check failed.',
        );
      }
    });
  };

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
        >
          Grokify
        </Link>
        <div className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100">
          Research assistance only
        </div>
      </div>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card rounded-[2rem] p-6 sm:p-8">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 text-black shadow-[0_18px_40px_rgba(251,146,60,0.28)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-neutral-500">
                X Post Fact Checker
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Check the post, not the vibe.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-neutral-300 sm:text-base">
                Paste an X or Twitter post URL and get a plain-English read on what is true,
                what needs context, and what cannot be verified.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <label className="block space-y-3">
              <span className="text-xs font-semibold uppercase tracking-[0.26em] text-neutral-500">
                Post URL
              </span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 shadow-inner shadow-black/20">
                <Search className="h-4 w-4 text-neutral-500" />
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://x.com/handle/status/1234567890"
                  className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </label>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-neutral-500">
                Research Mode
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {MODE_OPTIONS.map((option) => {
                  const selected = mode === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMode(option.value)}
                      className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                        selected
                          ? 'border-orange-300/40 bg-orange-500/12 shadow-[0_0_0_1px_rgba(251,146,60,0.25)]'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">{option.label}</span>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            selected ? 'bg-orange-300 shadow-[0_0_12px_rgba(253,186,116,0.75)]' : 'bg-neutral-600'
                          }`}
                        />
                      </div>
                      <p className="text-sm leading-6 text-neutral-400">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-xs leading-6 text-neutral-500">
                This is research assistance, not legal, medical, or financial advice. Model output can still be wrong.
              </p>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300 px-5 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {isPending ? 'Checking facts...' : 'Run Fact Check'}
              </button>
            </div>
          </form>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </div>

        <div className="glass-card overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
              Before You Share It
            </p>
            <h2 className="mt-3 max-w-sm text-3xl font-semibold tracking-tight text-white">
              Get a quick read on what the post actually claims.
            </h2>
            <p className="mt-4 text-sm leading-7 text-neutral-300">
              The report is built for skimming first, then digging deeper only when a claim deserves it.
            </p>
          </div>

          <div className="space-y-3">
            {REPORT_PREVIEW.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-4"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-amber-200">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-neutral-400">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-400/15 bg-amber-400/[0.07] px-4 py-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-100">
              <Timer className="h-4 w-4" />
              Quick or deep research
            </div>
            <p className="text-sm leading-6 text-neutral-300">
              Use Quick for everyday posts. Use Deep when the post is dense, statistical, or likely to be missing context.
            </p>
          </div>
        </div>
      </section>

      {result ? (
        <section className="mt-8 space-y-6">
          <div className="glass-card rounded-[2rem] p-6 sm:p-8">
            <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
                  Main Analysis
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Research Summary</h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-neutral-400">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  Mode: {modeLabels[result.mode]}
                </span>
                {result.handle ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                    @{result.handle}
                  </span>
                ) : null}
                {result.postId ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                    Post {result.postId}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">{renderSummary(result.summaryMd)}</div>
          </div>

          <div className="glass-card rounded-[2rem] p-6 sm:p-8">
            <div className="mb-6 flex items-end justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
                  Claims
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Claim-by-Claim Verdicts</h2>
              </div>
              <div className="text-xs text-neutral-500">
                {result.claims.length} item{result.claims.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="space-y-4">
              {result.claims.length > 0 ? (
                result.claims.map((claim, index) => (
                  <article
                    key={`${claim.claim}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5"
                  >
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="text-base font-medium leading-7 text-white">{claim.claim}</h3>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${verdictStyles[claim.verdict]}`}
                      >
                        {verdictLabels[claim.verdict]}
                      </span>
                    </div>
                    <p className="text-sm leading-7 text-neutral-300">{claim.rationale}</p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-neutral-400">
                  No checkable factual assertions were strong enough to separate into discrete claim cards.
                </div>
              )}
            </div>
          </div>

          {result.sourceAnalysis ? (
            <div className="glass-card rounded-[2rem] p-6 sm:p-8">
              <div className="mb-5 border-b border-white/10 pb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
                  Credibility
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Source Analysis</h2>
              </div>
              <div className="space-y-4">{renderSummary(result.sourceAnalysis)}</div>
            </div>
          ) : null}

          <div className="glass-card rounded-[2rem] p-6 sm:p-8">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
                    Sources
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">Sources (optional)</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-neutral-400 transition-colors group-open:text-white">
                  {result.sources.length} link{result.sources.length === 1 ? '' : 's'}
                </span>
              </summary>

              <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
                {result.sources.map((source, index) => (
                  <a
                    key={`${source.url}-${index}`}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-white">{source.title}</div>
                      {source.note ? <p className="text-sm leading-6 text-neutral-400">{source.note}</p> : null}
                      <p className="break-all text-xs text-neutral-500">{source.url}</p>
                    </div>
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                  </a>
                ))}
              </div>
            </details>
          </div>

          <div className="pb-6 text-sm text-neutral-500">{result.disclaimer}</div>
        </section>
      ) : null}
    </main>
  );
}
