'use client';

import {
  AlertTriangle,
  Check,
  Copy,
  FileText,
  Fingerprint,
  LockKeyhole,
  Shield,
} from 'lucide-react';

interface FbiProfileSectionProps {
  profile: string;
  isCopied: boolean;
  onCopy: () => void | Promise<void>;
}

interface ParsedFbiReport {
  masthead: string[];
  metadata: Array<{ label: string; value: string }>;
  sections: Array<{ title: string; body: string }>;
  classification: string | null;
}

const REPORT_SECTIONS = new Set([
  'EXECUTIVE SUMMARY',
  'PSYCHOLOGICAL PROFILE',
  'BEHAVIORAL ANALYSIS',
  'THREAT ASSESSMENT',
  'PREDICTIVE ANALYSIS',
  'CONCLUSIONS AND RECOMMENDATIONS',
]);

function splitMetadata(line: string) {
  const delimiterIndex = line.indexOf(':');
  if (delimiterIndex === -1) return null;

  return {
    label: line.slice(0, delimiterIndex).trim(),
    value: line.slice(delimiterIndex + 1).trim(),
  };
}

function parseFbiReport(profile: string): ParsedFbiReport {
  const lines = profile
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const masthead: string[] = [];
  const metadata: Array<{ label: string; value: string }> = [];
  const sections: Array<{ title: string; body: string }> = [];
  let currentTitle: string | null = null;
  let currentBody: string[] = [];
  let classification: string | null = null;

  const pushCurrentSection = () => {
    if (!currentTitle) return;
    sections.push({
      title: currentTitle,
      body: currentBody.join('\n\n').trim(),
    });
    currentTitle = null;
    currentBody = [];
  };

  for (const line of lines) {
    const upperLine = line.toUpperCase();

    if (REPORT_SECTIONS.has(upperLine)) {
      pushCurrentSection();
      currentTitle = upperLine;
      currentBody = [];
      continue;
    }

    if (upperLine.startsWith('CLASSIFICATION:')) {
      classification = line.slice(line.indexOf(':') + 1).trim();
      continue;
    }

    if (currentTitle) {
      currentBody.push(line);
      continue;
    }

    const metadataLine = splitMetadata(line);
    if (metadataLine) {
      metadata.push(metadataLine);
    } else {
      masthead.push(line);
    }
  }

  pushCurrentSection();

  return { masthead, metadata, sections, classification };
}

function FbiSeal() {
  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-950/20 text-red-200 shadow-[0_0_40px_rgba(127,29,29,0.25)]">
      <div className="absolute inset-2 rounded-full border border-red-400/20" />
      <Shield className="h-7 w-7" />
      <span className="absolute -bottom-1 rounded-sm border border-red-500/30 bg-black px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.18em] text-red-300">
        BAU
      </span>
    </div>
  );
}

export default function FbiProfileSection({ profile, isCopied, onCopy }: FbiProfileSectionProps) {
  const { masthead, metadata, sections, classification } = parseFbiReport(profile);
  const caseFile = metadata.find((item) => item.label.toUpperCase().includes('CASE FILE'))?.value;
  const subject = metadata.find((item) => item.label.toUpperCase() === 'SUBJECT')?.value;

  return (
    <section className="mx-auto w-full max-w-xs min-w-0 select-text overflow-x-hidden sm:max-w-5xl">
      <div className="relative w-full max-w-full overflow-hidden border border-red-900/45 bg-[#070707] shadow-2xl shadow-red-950/30">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/50 to-transparent" />
        <div className="absolute right-6 top-28 hidden rotate-[-10deg] select-none rounded border border-red-500/20 px-6 py-2 font-mono text-sm font-bold tracking-[0.35em] text-red-500/10 md:block">
          CLASSIFIED
        </div>

        <div className="flex flex-col gap-3 border-b border-red-900/40 bg-gradient-to-r from-red-950/45 via-black to-red-950/35 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.22em] text-red-300">
              <LockKeyhole className="h-4 w-4" />
              Classified
            </span>
            <span className="hidden h-4 w-px bg-red-700/40 sm:block" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-red-300/50">
              Law Enforcement Sensitive
            </span>
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex w-full items-center justify-center gap-2 border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-neutral-200 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-white sm:w-auto"
          >
            {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{isCopied ? 'Copied' : 'Copy Report'}</span>
          </button>
        </div>

        <div className="relative min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
            <div className="min-w-0 space-y-6">
              <div className="flex min-w-0 flex-col gap-5 overflow-hidden border border-red-900/30 bg-black/35 p-5 sm:flex-row sm:items-start">
                <FbiSeal />
                <div className="min-w-0 flex-1">
                  <div className="space-y-1 break-all font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500 sm:break-words sm:text-[11px] sm:tracking-[0.18em]">
                    {masthead.slice(0, 3).map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                  <h2 className="mt-4 break-words text-xl font-black uppercase tracking-[0.06em] text-neutral-100 sm:text-3xl sm:tracking-[0.08em]">
                    Behavioral Profile
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-red-200/80">
                    {caseFile && (
                      <span className="border border-red-500/20 bg-red-950/20 px-2.5 py-1">
                        {caseFile}
                      </span>
                    )}
                    {classification && (
                      <span className="border border-amber-500/20 bg-amber-950/20 px-2.5 py-1 text-amber-200/80">
                        {classification}
                      </span>
                    )}
                  </div>
                  {subject && (
                    <p className="mt-4 break-words text-sm leading-6 text-neutral-300">
                      Subject record opened for <span className="font-semibold text-red-200">{subject}</span>.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {metadata.map((item) => (
                  <div key={`${item.label}-${item.value}`} className="min-w-0 border border-white/10 bg-white/[0.025] p-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      {item.label}
                    </div>
                    <div className="mt-1 break-words text-sm font-medium text-neutral-200">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {sections.length > 0 ? (
                  sections.map((section, index) => (
                    <article
                      key={section.title}
                      className="group min-w-0 border border-white/10 bg-gradient-to-br from-white/[0.045] to-transparent p-5 transition-colors hover:border-red-500/25"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-300/60">
                            Section {String(index + 1).padStart(2, '0')}
                          </div>
                          <h3 className="mt-1 text-base font-bold uppercase tracking-[0.12em] text-neutral-100">
                            {section.title}
                          </h3>
                        </div>
                        <FileText className="mt-1 h-4 w-4 shrink-0 text-red-300/50" />
                      </div>
                      <p className="whitespace-pre-line break-words text-[15px] leading-7 text-neutral-300">
                        {section.body}
                      </p>
                    </article>
                  ))
                ) : (
                  <pre className="whitespace-pre-wrap border border-white/10 bg-black/30 p-5 font-mono text-sm leading-7 text-neutral-300">
                    {profile}
                  </pre>
                )}
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-8">
              <div className="border border-red-900/35 bg-red-950/[0.08] p-4">
                <div className="flex items-center gap-3">
                  <Fingerprint className="h-5 w-5 text-red-300" />
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-300/60">
                      Evidence Index
                    </div>
                    <div className="text-sm font-semibold text-neutral-100">{sections.length} report sections</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {sections.map((section, index) => (
                    <div
                      key={section.title}
                      className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-500"
                    >
                      <span className="text-red-300/70">{String(index + 1).padStart(2, '0')}</span>
                      <span className="h-px flex-1 bg-white/10" />
                      <span className="max-w-[12rem] truncate">{section.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-amber-700/30 bg-amber-950/[0.08] p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300/80" />
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300/70">
                      Handling Notice
                    </div>
                    <p className="mt-2 text-sm leading-6 text-neutral-400">
                      Generated profile text remains unchanged for copy/export. This view only formats the report for
                      review.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="border-t border-red-900/40 bg-gradient-to-r from-red-950/45 via-black to-red-950/35 px-4 py-3 text-center sm:px-6">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-red-400/60">
            Secret // Noforn // Orcon
          </span>
        </div>
      </div>
    </section>
  );
}
