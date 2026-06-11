'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { getLoadingOverlayProgress, type LoadingType, type LoadingStage } from '@/lib/loading-overlay-progress';
import {
  getMissionLabel,
  getOperationTitle,
  getSearchLog,
  getStatusMessages,
  interpolateLogTemplate,
  OPERATION_CODENAMES,
  PHOTO_PIPELINE_STEPS,
} from '@/lib/loading-overlay-copy';

interface LoadingOverlayProps {
  type: LoadingType;
  stage?: LoadingStage;
  username?: string;
  username2?: string;
  /** Real activity lines streamed from the server; replaces the canned search log when non-empty. */
  liveLog?: string[];
}

function formatTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function ClassificationBanner({ label }: { label: string }) {
  return (
    <div className="intel-classification-banner flex items-center justify-between px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] sm:px-6 sm:text-[11px]">
      <span>{label}</span>
      <span className="hidden text-[#3dffa3]/70 sm:inline">UNAUTHORIZED PUBLIC SOURCE</span>
    </div>
  );
}

export function LoadingOverlay({ type, stage, username, username2, liveLog }: LoadingOverlayProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stageElapsedSeconds, setStageElapsedSeconds] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [activityIndex, setActivityIndex] = useState(0);
  const [caseId] = useState(() => `GRF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
  // Arrival time per live log line, so timestamps stay stable across re-renders
  const [liveLogTimes, setLiveLogTimes] = useState<number[]>([]);

  const statusMessages = useMemo(() => getStatusMessages(type, stage), [type, stage]);
  const searchLog = useMemo(() => getSearchLog(type, stage), [type, stage]);
  const progressState = useMemo(
    () => getLoadingOverlayProgress({ type, stage, elapsedSeconds: stageElapsedSeconds }),
    [stageElapsedSeconds, stage, type],
  );
  const progress = progressState.progress;

  const terminalLines = useMemo(() => {
    if (liveLog && liveLog.length > 0) {
      return liveLog.map((text, index) => ({
        time: formatTimestamp(liveLogTimes[index] ?? elapsedSeconds),
        text,
        active: index === liveLog.length - 1,
      }));
    }

    if (searchLog.length === 0) {
      return statusMessages.slice(0, Math.min(activityIndex + 2, statusMessages.length)).map((line, index) => ({
        time: formatTimestamp(Math.max(0, elapsedSeconds - (statusMessages.length - index) * 2)),
        text: line,
        active: index === Math.min(activityIndex, statusMessages.length - 1),
      }));
    }

    const visibleCount = Math.min(activityIndex + 1, searchLog.length);
    return searchLog.slice(0, visibleCount).map((entry, index) => ({
      time: formatTimestamp(Math.max(0, elapsedSeconds - (visibleCount - index) * 2)),
      text: interpolateLogTemplate(entry, username, username2),
      active: index === visibleCount - 1,
    }));
  }, [activityIndex, elapsedSeconds, liveLog, liveLogTimes, searchLog, statusMessages, username, username2]);

  useEffect(() => {
    if (!liveLog || liveLog.length === 0) return;
    setLiveLogTimes((prev) =>
      prev.length >= liveLog.length
        ? prev
        : [...prev, ...Array(liveLog.length - prev.length).fill(elapsedSeconds)],
    );
  }, [elapsedSeconds, liveLog]);

  const signalBars = useMemo(
    () => Array.from({ length: 16 }, (_, index) => 18 + ((index * 17 + progress) % 72)),
    [progress],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setStageElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setMessageIndex(0);
    setActivityIndex(0);
    setStageElapsedSeconds(0);
  }, [stage, type]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [statusMessages.length]);

  useEffect(() => {
    const maxIndex = searchLog.length > 0 ? searchLog.length - 1 : statusMessages.length - 1;
    const interval = setInterval(() => {
      setActivityIndex((prev) => Math.min(prev + 1, maxIndex));
    }, searchLog.length > 0 ? 2400 : 3200);
    return () => clearInterval(interval);
  }, [searchLog.length, statusMessages.length, stage, type]);

  const currentStatus = statusMessages[messageIndex] || statusMessages[0];
  const operationTitle = getOperationTitle(type, stage);
  const missionLabel = getMissionLabel(type);
  const codename = OPERATION_CODENAMES[type];
  const stepInfo =
    type === 'photo' || type === 'jointpic' || type === 'video'
      ? stage === 'analyze' || stage === undefined
        ? 'PHASE 01 / 02'
        : 'PHASE 02 / 02'
      : null;

  const subjectLine =
    type === 'jointpic' && username && username2
      ? `@${username} + @${username2}`
      : username
        ? `@${username}`
        : 'PUBLIC SUBJECT';

  return (
    <div className="intel-overlay fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#050806] text-[#3dffa3]">
      <div className="intel-scanlines pointer-events-none absolute inset-0" />
      <div className="intel-grid pointer-events-none absolute inset-0 opacity-30" />

      <ClassificationBanner label="TOP SECRET // GROKIFY OPS // NOFORN" />

      <div className="relative flex flex-1 items-center justify-center overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
        <div className="relative w-full max-w-5xl border border-[#3dffa3]/20 bg-[#07100b]/95 shadow-[0_0_80px_rgba(61,255,163,0.08)]">
          <div className="border-b border-[#3dffa3]/15 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#3dffa3]/70 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>OPERATION {codename}</span>
              <span className="flex items-center gap-2 text-[#c9a227]">
                <span className="intel-live-dot h-2 w-2 rounded-full bg-[#3dffa3]" />
                LIVE {formatTimestamp(elapsedSeconds)}
              </span>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <section className="border-b border-[#3dffa3]/15 p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="space-y-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#3dffa3]/55">
                    Case File {caseId}
                  </p>
                  <h2 className="mt-2 font-mono text-lg font-semibold uppercase tracking-[0.08em] text-[#d7ffe8] sm:text-xl">
                    {operationTitle}
                  </h2>
                  <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-[#3dffa3]/65">
                    Mission: {missionLabel}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="border border-[#3dffa3]/15 bg-black/30 px-3 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#3dffa3]/50">Subject</p>
                    <p className="mt-1 truncate font-mono text-sm text-[#d7ffe8]">{subjectLine}</p>
                  </div>
                  <div className="border border-[#3dffa3]/15 bg-black/30 px-3 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#3dffa3]/50">Clearance</p>
                    <p className="mt-1 font-mono text-sm text-[#c9a227]">PUBLIC OSINT ONLY</p>
                  </div>
                </div>

                {(type === 'photo' || type === 'jointpic') && (
                  <div className="relative overflow-hidden border border-[#3dffa3]/15 bg-black/40 p-4">
                    <div className="absolute inset-0 intel-radar-sweep opacity-20" />
                    <div className="relative flex items-end gap-1.5 h-14">
                      {signalBars.map((height, index) => (
                        <span
                          key={index}
                          className="flex-1 rounded-t-sm bg-[#3dffa3]/80"
                          style={{
                            height: `${height}%`,
                            animation: `intel-signal-bar 1.4s ease-in-out ${index * 40}ms infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                    <p className="relative mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#3dffa3]/55">
                      Signal throughput / timeline correlation
                    </p>
                  </div>
                )}

                <div>
                  <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#3dffa3]/55">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden border border-[#3dffa3]/20 bg-black/50">
                    <div
                      className="h-full bg-[#3dffa3] transition-all duration-700 ease-out shadow-[0_0_18px_rgba(61,255,163,0.45)]"
                      style={{ width: `${Math.max(progress, 4)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                  <div className="border border-[#3dffa3]/15 bg-black/25 px-2 py-2">
                    <p className="text-[#3dffa3]/50">Phase</p>
                    <p className="mt-1 text-[#d7ffe8]">{progressState.phaseLabel}</p>
                  </div>
                  <div className="border border-[#3dffa3]/15 bg-black/25 px-2 py-2">
                    <p className="text-[#3dffa3]/50">Status</p>
                    <p className="mt-1 text-[#d7ffe8]">{progressState.statusLabel}</p>
                  </div>
                  <div className="border border-[#3dffa3]/15 bg-black/25 px-2 py-2">
                    <p className="text-[#3dffa3]/50">Stage</p>
                    <p className="mt-1 text-[#d7ffe8]">{stepInfo ?? 'SINGLE PHASE'}</p>
                  </div>
                </div>

                {type === 'photo' && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {PHOTO_PIPELINE_STEPS.map((step) => {
                      const isActive = progress >= step.threshold;
                      return (
                        <div
                          key={step.label}
                          className={cn(
                            'border px-2 py-2 text-center font-mono text-[10px] uppercase tracking-[0.14em]',
                            isActive
                              ? 'border-[#3dffa3]/35 bg-[#3dffa3]/10 text-[#d7ffe8]'
                              : 'border-[#3dffa3]/10 bg-black/20 text-[#3dffa3]/35',
                          )}
                        >
                          {step.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="flex min-h-[280px] flex-col bg-black/50 p-4 sm:min-h-[320px] sm:p-6">
              <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-[#3dffa3]/60">
                <span>&gt;&gt; Terminal Feed</span>
                <span className="text-[#c9a227]">SECURE CHANNEL</span>
              </div>

              <div className="flex-1 overflow-y-auto border border-[#3dffa3]/15 bg-[#030705] p-3 font-mono text-xs leading-6 sm:text-sm">
                <div className="space-y-1">
                  {terminalLines.map((line, index) => (
                    <p
                      key={`${index}-${line.text}`}
                      className={cn(
                        'truncate',
                        line.active ? 'text-[#d7ffe8]' : 'text-[#3dffa3]/55',
                      )}
                    >
                      <span className="text-[#3dffa3]/40">[{line.time}]</span> {line.text}
                      {line.active && <span className="intel-cursor ml-1 inline-block h-4 w-2 bg-[#3dffa3]" />}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-4 border border-[#3dffa3]/15 bg-[#07100b] px-3 py-3 font-mono text-xs uppercase tracking-[0.12em] text-[#d7ffe8] sm:text-sm">
                <span className="text-[#c9a227]">STATUS:</span> {currentStatus}
              </div>
            </section>
          </div>
        </div>
      </div>

      <ClassificationBanner label="WARNING: SATIRICAL AI OUTPUT — NOT A GOVERNMENT SYSTEM" />
    </div>
  );
}
