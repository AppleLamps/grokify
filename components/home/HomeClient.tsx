'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ChevronDown,
  ChevronRight,
  History,
  DollarSign,
  Sparkles,
  Search,
  Upload,
  Wand2,
  FlaskConical,
  Flame,
  Pencil,
  Users,
  Zap,
  Video,
  Check,
  Copy,
  Download,
  RefreshCw,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { usePromptHistory } from '@/hooks/usePromptHistory';
import type { ResultPayload } from '@/components/home/sections/ResultSection';

const PromptHistorySidebar = dynamic(
  () => import('@/components/PromptHistorySidebar').then((mod) => mod.PromptHistorySidebar),
  { ssr: false }
);
const LoadingOverlay = dynamic(
  () => import('@/components/LoadingOverlay').then((mod) => mod.LoadingOverlay),
  { ssr: false }
);
const StyleSelectorModal = dynamic(
  () => import('@/components/StyleSelectorModal').then((mod) => mod.StyleSelectorModal),
  { ssr: false }
);
const StyleSelectorTrigger = dynamic(
  () => import('@/components/StyleSelectorModal').then((mod) => mod.StyleSelectorTrigger),
  { ssr: false }
);
const ResultSection = dynamic(() => import('@/components/home/sections/ResultSection'), { ssr: false });
const RoastSection = dynamic(() => import('@/components/home/sections/RoastSection'), { ssr: false });
const FbiProfileSection = dynamic(() => import('@/components/home/sections/FbiProfileSection'), { ssr: false });
const OsintSection = dynamic(() => import('@/components/home/sections/OsintSection'), { ssr: false });
const CaricatureSection = dynamic(() => import('@/components/home/sections/CaricatureSection'), { ssr: false });
const JointPicSection = dynamic(() => import('@/components/home/sections/JointPicSection'), { ssr: false });

const SUGGESTION_HANDLES = ['levelsio', 'pmarca', 'OfficialLoganK'];

// History trigger that moves when sidebar opens
function HistoryTrigger() {
  const { open, openMobile, isMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  return (
    <div
      className={`fixed top-6 z-50 transition-all duration-300 ease-in-out ${isOpen ? 'left-[calc(16rem+1.5rem)]' : 'left-6'}`}
    >
      <SidebarTrigger className="p-3 bg-black/20 backdrop-blur-md rounded-xl border border-white/10 shadow-lg hover:bg-white/10 transition-all text-white">
        <History className="h-5 w-5" />
      </SidebarTrigger>
    </div>
  );
}


export default function Home() {
  const [handle, setHandle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('default');
  const [selectedModel, setSelectedModel] = useState<'nano-banana' | 'grok-imagine'>('grok-imagine');
  const [isLoading, setIsLoading] = useState(false);
  const [isRoasting, setIsRoasting] = useState(false);
  const [isProfiling, setIsProfiling] = useState(false);
  const [inputError, setInputError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [loadingStage, setLoadingStage] = useState<'analyze' | 'image' | null>(null);
  const [loadingUsername, setLoadingUsername] = useState<string | null>(null);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [roast, setRoast] = useState<string | null>(null);
  const [fbiProfile, setFbiProfile] = useState<string | null>(null);
  const [osintReport, setOsintReport] = useState<string | null>(null);
  const [isOsintProfiling, setIsOsintProfiling] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRoastCopied, setIsRoastCopied] = useState(false);
  const [isProfileCopied, setIsProfileCopied] = useState(false);
  const [isOsintCopied, setIsOsintCopied] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);

  // Caricature feature state
  const [isCaricatureModalOpen, setIsCaricatureModalOpen] = useState(false);
  const [isCaricatureLoading, setIsCaricatureLoading] = useState(false);
  const [caricatureResult, setCaricatureResult] = useState<{
    comment: string;
    prompt: string;
    imageUrl: string;
  } | null>(null);
  const [caricaturePreview, setCaricaturePreview] = useState<string | null>(null);

  // Joint Pic feature state
  const [isJointPicModalOpen, setIsJointPicModalOpen] = useState(false);
  const [isJointPicLoading, setIsJointPicLoading] = useState(false);
  const [jointPicHandle1, setJointPicHandle1] = useState('');
  const [jointPicHandle2, setJointPicHandle2] = useState('');
  const [jointPicStage, setJointPicStage] = useState<'analyze' | 'image' | null>(null);
  const [jointPicResult, setJointPicResult] = useState<{
    imagePrompt: string;
    imageUrl: string;
    username1: string;
    username2: string;
  } | null>(null);
  const [isJointPicImageLoading, setIsJointPicImageLoading] = useState(true);
  const [showJointPicPrompt, setShowJointPicPrompt] = useState(false);

  // Video generation feature state (Beta)
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoLoadingStage, setVideoLoadingStage] = useState<'analyze' | 'video' | null>(null);
  const [videoResult, setVideoResult] = useState<{
    videoPrompt: string;
    videoUrl: string;
    username: string;
  } | null>(null);
  const [showVideoPrompt, setShowVideoPrompt] = useState(false);
  const [isVideoPromptCopied, setIsVideoPromptCopied] = useState(false);

  const { history, addToHistory, deleteFromHistory, clearHistory } = usePromptHistory();

  const handleGenerate = async () => {
    const normalizedHandle = handle.trim().replace('@', '');

    if (!normalizedHandle) {
      setInputError('Enter a username');
      return;
    }

    setIsLoading(true);
    setInputError('');
    setGlobalError('');
    setResult(null);
    setRoast(null);
    setFbiProfile(null);
    setOsintReport(null);
    setLoadingStage('analyze');
    setLoadingUsername(normalizedHandle);

    try {
      const analysisResponse = await fetch('/api/analyze-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: normalizedHandle }),
      });

      const analysisData = await analysisResponse.json();
      if (!analysisResponse.ok) throw new Error(analysisData.error || 'Failed to analyze account');
      if (!analysisData?.imagePrompt) throw new Error('Failed to generate image prompt');

      setLoadingStage('image');

      let imageResponse;
      if (selectedModel === 'grok-imagine') {
        // Use Grok Imagine API
        imageResponse = await fetch('/api/imagine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: analysisData.imagePrompt,
            n: 1,
            aspect_ratio: '16:9',
            response_format: 'url',
          }),
        });
      } else {
        // Use Nano Banana Pro (default)
        imageResponse = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: analysisData.imagePrompt,
            handle: normalizedHandle,
            style: selectedStyle,
          }),
        });
      }

      const imageData = await imageResponse.json();
      if (!imageResponse.ok) throw new Error(imageData.error || 'Failed to generate image');

      // Handle different response formats
      let imageUrl: string;
      if (selectedModel === 'grok-imagine') {
        // Grok Imagine returns { data: [{ url: '...' }] }
        imageUrl = imageData.data?.[0]?.url;
      } else {
        imageUrl = imageData.imageUrl;
      }
      if (!imageUrl) throw new Error('Failed to generate image');

      setIsImageLoading(true);
      setResult({
        imagePrompt: analysisData.imagePrompt,
        imageUrl: imageUrl,
        username: normalizedHandle,
      });

      addToHistory({
        username: normalizedHandle,
        prompt: analysisData.imagePrompt,
        imageUrl: imageUrl,
      });

      toast.success('Artwork generated!');
    } catch (err: unknown) {
      console.error('Generation error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setGlobalError(message);
      toast.error(message);
    } finally {
      setLoadingStage(null);
      setLoadingUsername(null);
      setIsLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    const normalizedHandle = handle.trim().replace('@', '');

    if (!normalizedHandle) {
      setInputError('Enter a username');
      return;
    }

    setIsVideoGenerating(true);
    setInputError('');
    setGlobalError('');
    setVideoResult(null);
    setVideoLoadingStage('analyze');
    setLoadingUsername(normalizedHandle);

    try {
      // Step 1: Analyze account and generate video prompt
      const analysisResponse = await fetch('/api/analyze-account-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: normalizedHandle }),
      });

      const analysisData = await analysisResponse.json();
      if (!analysisResponse.ok) throw new Error(analysisData.error || 'Failed to analyze account');
      if (!analysisData?.videoPrompt) throw new Error('Failed to generate video prompt');

      setVideoLoadingStage('video');

      // Step 2: Generate video using Grok Imagine Video
      const videoResponse = await fetch('/api/imagine-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: analysisData.videoPrompt,
          duration: 10,
          aspectRatio: '16:9',
          resolution: '720p',
        }),
      });

      const videoData = await videoResponse.json();
      if (!videoResponse.ok) throw new Error(videoData.error || 'Failed to generate video');

      const videoUrl = videoData.video?.url;
      if (!videoUrl) throw new Error('Failed to generate video');

      setVideoResult({
        videoPrompt: analysisData.videoPrompt,
        videoUrl: videoUrl,
        username: normalizedHandle,
      });

      toast.success('Video generated!');
    } catch (err: unknown) {
      console.error('Video generation error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setGlobalError(message);
      toast.error(message);
    } finally {
      setVideoLoadingStage(null);
      setLoadingUsername(null);
      setIsVideoGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.imageUrl) return;

    try {
      // Use proxy to avoid CORS issues with external image URLs
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(result.imageUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `xpressionist-${result.username}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded!');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleRoast = async () => {
    const normalizedHandle = handle.trim().replace('@', '');

    if (!normalizedHandle) {
      setInputError('Enter a username');
      return;
    }

    setIsRoasting(true);
    setInputError('');
    setGlobalError('');
    setRoast(null);
    setLoadingUsername(normalizedHandle);

    try {
      const response = await fetch('/api/roast-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: normalizedHandle }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate roast');
      if (!data?.roastLetter) throw new Error('Failed to generate roast letter');

      setRoast(data.roastLetter);
      toast.success('Roast ready!');
    } catch (err: unknown) {
      console.error('Roast error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setGlobalError(message);
      toast.error(message);
    } finally {
      setLoadingUsername(null);
      setIsRoasting(false);
    }
  };

  const handleFbiProfile = async () => {
    const normalizedHandle = handle.trim().replace('@', '');

    if (!normalizedHandle) {
      setInputError('Enter a username');
      return;
    }

    setIsProfiling(true);
    setInputError('');
    setGlobalError('');
    setFbiProfile(null);
    setLoadingUsername(normalizedHandle);

    try {
      const response = await fetch('/api/fbi-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: normalizedHandle }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate profile');
      if (!data?.profileReport) throw new Error('Failed to generate profile');

      setFbiProfile(data.profileReport);
      toast.success('Profile ready!');
    } catch (err: unknown) {
      console.error('Profile error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setGlobalError(message);
      toast.error(message);
    } finally {
      setLoadingUsername(null);
      setIsProfiling(false);
    }
  };

  const handleOsintProfile = async () => {
    const normalizedHandle = handle.trim().replace('@', '');

    if (!normalizedHandle) {
      setInputError('Enter a username');
      return;
    }

    setIsOsintProfiling(true);
    setInputError('');
    setGlobalError('');
    setOsintReport(null);
    setLoadingUsername(normalizedHandle);

    try {
      const response = await fetch('/api/osint-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: normalizedHandle, timeRange: '90' }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate OSINT report');
      if (!data?.osintReport) throw new Error('Failed to generate OSINT report');

      setOsintReport(data.osintReport);
      toast.success('OSINT dossier ready!');
    } catch (err: unknown) {
      console.error('OSINT error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setGlobalError(message);
      toast.error(message);
    } finally {
      setLoadingUsername(null);
      setIsOsintProfiling(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (!result?.imagePrompt) return;
    try {
      await navigator.clipboard.writeText(result.imagePrompt);
      setIsCopied(true);
      toast.success('Copied!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleCopyRoast = async () => {
    if (!roast) return;
    try {
      await navigator.clipboard.writeText(roast);
      setIsRoastCopied(true);
      toast.success('Copied!');
      setTimeout(() => setIsRoastCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleCopyProfile = async () => {
    if (!fbiProfile) return;
    try {
      await navigator.clipboard.writeText(fbiProfile);
      setIsProfileCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsProfileCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Copy failed - try selecting manually');
    }
  };

  const handleCopyOsint = async () => {
    if (!osintReport) return;
    try {
      await navigator.clipboard.writeText(osintReport);
      setIsOsintCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsOsintCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error('Copy failed - try selecting manually');
    }
  };

  const handleGenerateAnother = () => {
    setResult(null);
    setHandle('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCaricatureAnother = () => {
    setCaricatureResult(null);
    setIsCaricatureModalOpen(true);
  };

  const handleJointPicAnother = () => {
    setJointPicResult(null);
    setIsJointPicModalOpen(true);
  };

  // Caricature feature handlers
  const handleCaricatureImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCaricaturePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleCaricatureGenerate = async () => {
    if (!caricaturePreview) {
      toast.error('Please select an image first');
      return;
    }

    setIsCaricatureLoading(true);
    setIsCaricatureModalOpen(false);
    setGlobalError('');

    try {
      const response = await fetch('/api/caricature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: caricaturePreview }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate caricature');
      if (!data?.imageUrl) throw new Error('Failed to generate caricature image');

      setCaricatureResult({
        comment: data.comment,
        prompt: data.prompt,
        imageUrl: data.imageUrl,
      });
      setCaricaturePreview(null);
      toast.success('Caricature ready!');
    } catch (err: unknown) {
      console.error('Caricature error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setGlobalError(message);
      toast.error(message);
    } finally {
      setIsCaricatureLoading(false);
    }
  };

  const handleCaricatureDownload = async () => {
    if (!caricatureResult?.imageUrl) return;

    try {
      const response = await fetch(caricatureResult.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `xpressionist-caricature.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded!');
    } catch {
      toast.error('Download failed');
    }
  };

  // Joint Pic handlers
  const handleJointPicGenerate = async () => {
    const normalized1 = jointPicHandle1.trim().replace('@', '');
    const normalized2 = jointPicHandle2.trim().replace('@', '');

    if (!normalized1 || !normalized2) {
      toast.error('Please enter both usernames');
      return;
    }

    if (normalized1.toLowerCase() === normalized2.toLowerCase()) {
      toast.error('Please enter two different usernames');
      return;
    }

    setIsJointPicLoading(true);
    setIsJointPicModalOpen(false);
    setGlobalError('');
    setJointPicResult(null);
    setJointPicStage('analyze');

    try {
      // Step 1: Analyze both accounts
      const analysisResponse = await fetch('/api/joint-pic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle1: normalized1, handle2: normalized2 }),
      });

      const analysisData = await analysisResponse.json();
      if (!analysisResponse.ok) throw new Error(analysisData.error || 'Failed to analyze accounts');
      if (!analysisData?.imagePrompt) throw new Error('Failed to generate image prompt');

      // Step 2: Generate image
      setJointPicStage('image');
      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: analysisData.imagePrompt,
          handle: `${normalized1}_${normalized2}`, // Combined handle for the API
          style: selectedStyle,
        }),
      });

      const imageData = await imageResponse.json();
      if (!imageResponse.ok) throw new Error(imageData.error || 'Failed to generate image');
      if (!imageData?.imageUrl) throw new Error('Failed to generate image');

      setIsJointPicImageLoading(true);
      setJointPicResult({
        imagePrompt: analysisData.imagePrompt,
        imageUrl: imageData.imageUrl,
        username1: normalized1,
        username2: normalized2,
      });

      // Clear the form
      setJointPicHandle1('');
      setJointPicHandle2('');

      toast.success('Joint artwork generated!');
    } catch (err: unknown) {
      console.error('Joint pic error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setGlobalError(message);
      toast.error(message);
    } finally {
      setJointPicStage(null);
      setIsJointPicLoading(false);
    }
  };

  const handleJointPicDownload = async () => {
    if (!jointPicResult?.imageUrl) return;

    try {
      const response = await fetch(jointPicResult.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `xpressionist-${jointPicResult.username1}-${jointPicResult.username2}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded!');
    } catch {
      toast.error('Download failed');
    }
  };

  const isBusy = isLoading || isRoasting || isProfiling || isOsintProfiling || isCaricatureLoading || isJointPicLoading || isVideoGenerating;

  return (
    <SidebarProvider defaultOpen={false}>
      <PromptHistorySidebar history={history} onDelete={deleteFromHistory} onClearAll={clearHistory} />

      <HistoryTrigger />

      {isLoading && (
        <LoadingOverlay
          type="photo"
          stage={loadingStage || 'analyze'}
          username={loadingUsername || undefined}
        />
      )}
      {isRoasting && (
        <LoadingOverlay type="roast" username={loadingUsername || undefined} />
      )}
      {isProfiling && (
        <LoadingOverlay type="fbi" username={loadingUsername || undefined} />
      )}
      {isOsintProfiling && (
        <LoadingOverlay type="osint" username={loadingUsername || undefined} />
      )}
      {isCaricatureLoading && (
        <LoadingOverlay type="caricature" />
      )}
      {isJointPicLoading && (
        <LoadingOverlay
          type="jointpic"
          stage={jointPicStage || 'analyze'}
          username={jointPicHandle1.trim().replace('@', '') || jointPicResult?.username1}
          username2={jointPicHandle2.trim().replace('@', '') || jointPicResult?.username2}
        />
      )}
      {isVideoGenerating && (
        <LoadingOverlay
          type="video"
          stage={videoLoadingStage || 'analyze'}
          username={loadingUsername || undefined}
        />
      )}

      <main className="relative z-10 min-h-screen px-6 lg:px-12 py-16 lg:py-24 flex flex-col justify-center">
        <div className="max-w-6xl mx-auto w-full space-y-24">

          {/* Hero Section - Asymmetrical */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Left: Title & Description */}
            <div className="space-y-6 text-center lg:text-left">
              {/* Title - centered on mobile */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[0.95] flex items-center justify-center lg:justify-start gap-2 sm:gap-3">
                <svg viewBox="0 0 24 24" className="h-[0.8em] w-[0.8em] shrink-0 fill-white">
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                </svg>
                <span className="gradient-text">pressionist</span>
              </h1>

              {/* Description - centered on mobile */}
              <p className="text-base sm:text-lg md:text-xl text-neutral-300 max-w-md mx-auto lg:mx-0 leading-relaxed tracking-tight">
                Turn any X timeline into bespoke AI artwork.<br />
                No login. No API keys. Just a username.
              </p>

              {/* Funded by $GROKIFY - centered on mobile */}
              <a
                href="https://bags.fm/8F2FvujRh6zqoR4wtasocKgw4oPcu3MWK4MG77NwBAGS"
                target="_blank"
                rel="noopener noreferrer"
                className="text-base sm:text-lg text-neutral-400 hover:text-emerald-400 transition-colors inline-flex items-center justify-center lg:justify-start gap-2 group w-full lg:w-auto"
              >
                <DollarSign className="w-5 h-5 group-hover:text-emerald-400 transition-colors" />
                Funded by fees from <span className="font-bold text-emerald-400 group-hover:text-emerald-300">$GROKIFY</span>
              </a>

              {/* Badges - centered on mobile */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-amber-400/90 backdrop-blur-sm">
                  <Flame className="w-3 h-3" />
                  Powered by Grok AI
                </div>
                <a
                  href="https://bags.fm/8F2FvujRh6zqoR4wtasocKgw4oPcu3MWK4MG77NwBAGS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/40 text-sm font-semibold text-emerald-400 backdrop-blur-sm hover:from-emerald-500/25 hover:to-teal-500/25 hover:border-emerald-400/60 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="font-mono tracking-wide">8F2Fvu...BAGs</span>
                </a>
              </div>

              {/* Grokify Prompt Feature Card - centered on mobile */}
              <div className="flex justify-center lg:justify-start">
                <Link
                  href="/prompt"
                  className="group block w-[280px] sm:w-auto sm:max-w-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 border border-amber-500/30 backdrop-blur-sm hover:from-amber-500/20 hover:via-orange-500/10 hover:to-rose-500/20 hover:border-amber-500/50 transition-all shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                        <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <span className="text-sm sm:text-lg font-bold text-amber-400 group-hover:text-amber-300 transition-colors">Grokify Prompt</span>
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="hidden sm:block text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors leading-relaxed text-left mt-2">
                    Transform any idea into a polished AI prompt. Just describe what you want and let Grok craft the perfect prompt for you.
                  </p>
                </Link>
              </div>

              {/* Grok Imagine Feature Card - centered on mobile */}
              <div className="flex justify-center lg:justify-start">
                <Link
                  href="/imagine"
                  className="group block w-[280px] sm:w-auto sm:max-w-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-pink-500/10 border border-violet-500/30 backdrop-blur-sm hover:from-violet-500/20 hover:via-fuchsia-500/10 hover:to-pink-500/20 hover:border-violet-500/50 transition-all shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <span className="text-sm sm:text-lg font-bold text-violet-400 group-hover:text-violet-300 transition-colors">Grok Imagine</span>
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500/50 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="hidden sm:block text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors leading-relaxed text-left mt-2">
                    Generate stunning images and videos with xAI&apos;s latest Grok Imagine model. Just describe what you want!
                  </p>
                </Link>
              </div>

              {/* Caricature Upload Modal */}
              <Dialog open={isCaricatureModalOpen} onOpenChange={(open) => {
                setIsCaricatureModalOpen(open);
                if (!open) setCaricaturePreview(null);
              }}>
                <DialogContent className="sm:max-w-md bg-neutral-900 border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      <Pencil className="w-5 h-5 text-purple-500" />
                      Create Caricature
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                      Upload a photo and our Times Square artist will draw your caricature!
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    {/* Upload area */}
                    <label className="block">
                      <div className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${caricaturePreview
                        ? 'border-purple-500/50 bg-purple-500/5'
                        : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5'
                        }`}>
                        {caricaturePreview ? (
                          <div className="space-y-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={caricaturePreview}
                              alt="Preview"
                              className="max-h-48 mx-auto rounded-lg"
                            />
                            <p className="text-sm text-neutral-400">Click to change photo</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-10 h-10 mx-auto text-neutral-500" />
                            <p className="text-neutral-300 font-medium">Drop your photo here</p>
                            <p className="text-sm text-neutral-500">or click to browse</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCaricatureImageSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </label>

                    {/* Generate button */}
                    <Button
                      onClick={handleCaricatureGenerate}
                      disabled={!caricaturePreview}
                      className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                    >
                      <Pencil className="w-5 h-5 mr-2" />
                      Draw My Caricature
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Joint Picture Modal */}
              <Dialog open={isJointPicModalOpen} onOpenChange={(open) => {
                setIsJointPicModalOpen(open);
                if (!open) {
                  setJointPicHandle1('');
                  setJointPicHandle2('');
                }
              }}>
                <DialogContent className="sm:max-w-md bg-neutral-900 border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      <Users className="w-5 h-5 text-amber-500" />
                      Joint Picture
                      <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30 flex items-center gap-1">
                        <FlaskConical className="w-3 h-3" />
                        TEST
                      </span>
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                      Enter two X usernames and we&apos;ll create one artwork that creatively represents both accounts together!
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    {/* First username */}
                    <div className="space-y-2">
                      <label className="text-sm text-neutral-400">First Account</label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-base font-semibold group-focus-within:text-amber-400 transition-colors">@</span>
                        <input
                          type="text"
                          value={jointPicHandle1}
                          onChange={(e) => setJointPicHandle1(e.target.value)}
                          placeholder="first_username"
                          className="w-full pl-9 pr-4 py-3 text-sm bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-colors duration-200"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </div>
                    </div>

                    {/* Second username */}
                    <div className="space-y-2">
                      <label className="text-sm text-neutral-400">Second Account</label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-base font-semibold group-focus-within:text-amber-400 transition-colors">@</span>
                        <input
                          type="text"
                          value={jointPicHandle2}
                          onChange={(e) => setJointPicHandle2(e.target.value)}
                          placeholder="second_username"
                          className="w-full pl-9 pr-4 py-3 text-sm bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-colors duration-200"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </div>
                    </div>

                    {/* Generate button */}
                    <Button
                      onClick={handleJointPicGenerate}
                      disabled={!jointPicHandle1.trim() || !jointPicHandle2.trim()}
                      className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Generate Joint Picture
                    </Button>

                    {/* Info note */}
                    <p className="text-xs text-neutral-500 text-center">
                      This is an experimental feature. Results may vary!
                    </p>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Style Selector Modal */}
              <StyleSelectorModal
                open={isStyleModalOpen}
                onOpenChange={setIsStyleModalOpen}
                selectedStyle={selectedStyle}
                onSelectStyle={setSelectedStyle}
                disabled={isBusy}
              />
            </div>

            {/* Right: Input Form - iPhone 16 Pro Style */}
            <div className="iphone-container relative mx-auto">
              {/* Ambient glow */}
              <div className="phone-glow" />

              {/* iPhone Frame */}
              <div className="iphone-frame">
                {/* Side Buttons */}
                <div className="action-button" />
                <div className="volume-up" />
                <div className="volume-down" />
                <div className="power-button" />

                {/* Screen */}
                <div className="iphone-screen">
                  {/* Dynamic Island */}
                  <div className="dynamic-island" />

                  {/* Screen Content */}
                  <div className="iphone-screen-content justify-center">
                    {/* Inner glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/20 rounded-full blur-[100px] pointer-events-none" />

                    <div className="space-y-5 relative">
                      <div className="text-center pb-1">
                        <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
                          <svg viewBox="0 0 24 24" className="h-[0.85em] w-[0.85em] shrink-0 fill-white">
                            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                          </svg>
                          <span className="gradient-text">pressionist</span>
                        </h2>
                      </div>

                      <div className="space-y-3">
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-base font-semibold group-focus-within:text-rose-400 transition-colors">@</span>
                          <input
                            type="text"
                            value={handle}
                            onChange={(e) => {
                              setHandle(e.target.value);
                              if (inputError) setInputError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && !isBusy && handleGenerate()}
                            disabled={isBusy}
                            placeholder="username"
                            className="w-full pl-9 pr-12 py-3.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 focus:bg-white/[0.08] transition-colors duration-200"
                            autoComplete="off"
                            spellCheck={false}
                          />
                          <button
                            onClick={handleGenerate}
                            disabled={isBusy || !handle}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 disabled:opacity-0 transition-all"
                            aria-label="Generate"
                          >
                            <ChevronDown className="-rotate-90 w-4 h-4" />
                          </button>
                        </div>

                        {/* Style Selector */}
                        <StyleSelectorTrigger
                          selectedStyle={selectedStyle}
                          onClick={() => setIsStyleModalOpen(true)}
                          disabled={isBusy}
                        />

                        {/* Model Selector */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedModel('nano-banana')}
                            disabled={isBusy}
                            className={`flex-1 px-3 py-2.5 text-xs font-medium rounded-xl border transition-all duration-200 ${selectedModel === 'nano-banana'
                              ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 text-yellow-400'
                              : 'bg-white/[0.05] border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/[0.08]'
                              }`}
                          >
                            🍌 Nano Banana Pro
                          </button>
                          <button
                            onClick={() => setSelectedModel('grok-imagine')}
                            disabled={isBusy}
                            className={`flex-1 px-3 py-2.5 text-xs font-medium rounded-xl border transition-all duration-200 ${selectedModel === 'grok-imagine'
                              ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border-violet-500/50 text-violet-400'
                              : 'bg-white/[0.05] border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/[0.08]'
                              }`}
                          >
                            ⚡ Grok Imagine
                          </button>
                        </div>

                        <div className="space-y-3">
                          <button
                            onClick={handleGenerate}
                            disabled={isBusy}
                            className="w-full px-4 py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-medium rounded-xl shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-rose-500/20 hover:brightness-110 transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Generate Photo
                          </button>
                          {/* Generate Video Beta Button */}
                          <button
                            onClick={handleGenerateVideo}
                            disabled={isBusy}
                            className="w-full px-4 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-cyan-500/20 hover:brightness-110 transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2 relative"
                          >
                            <Video className="w-4 h-4" />
                            Generate Video
                            <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-white/20 text-white/90 rounded-full border border-white/30 flex items-center gap-0.5">
                              <FlaskConical className="w-2.5 h-2.5" />
                              BETA
                            </span>
                          </button>
                          {/* FBI Profile Button */}
                          <button
                            onClick={handleFbiProfile}
                            disabled={isBusy}
                            className="w-full px-4 py-3.5 bg-gradient-to-r from-red-700 to-red-900 text-white font-medium rounded-xl shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-red-500/20 hover:brightness-110 transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            FBI Profile
                          </button>
                          {/* Caricature Button */}
                          <button
                            onClick={() => setIsCaricatureModalOpen(true)}
                            disabled={isBusy}
                            className="w-full px-4 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-purple-500/20 hover:brightness-110 transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Caricature
                          </button>
                          {/* Joint Picture Button - Test Feature */}
                          <button
                            onClick={() => setIsJointPicModalOpen(true)}
                            disabled={isBusy}
                            className="w-full px-4 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-medium rounded-xl shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-amber-500/20 hover:brightness-110 transition-all duration-200 disabled:opacity-50 text-sm flex items-center justify-center gap-2 relative"
                          >
                            <Users className="w-4 h-4" />
                            Joint Picture
                            <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-black/20 text-black/70 rounded-full border border-black/20 flex items-center gap-0.5">
                              <FlaskConical className="w-2.5 h-2.5" />
                              TEST
                            </span>
                          </button>
                        </div>
                      </div>

                      {inputError && (
                        <p className="text-sm text-red-500 text-center bg-red-500/10 py-2 rounded-lg">{inputError}</p>
                      )}

                      {/* Quick suggestions */}
                      <div className="flex flex-wrap justify-center gap-2 pt-3">
                        {SUGGESTION_HANDLES.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setHandle(s);
                              setInputError('');
                            }}
                            disabled={isBusy}
                            className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/[0.06] border border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.12] hover:border-white/[0.15] transition-all"
                          >
                            @{s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Home Indicator */}
                  <div className="home-indicator" />
                </div>
              </div>

              {/* Floor shadow */}
              <div className="phone-shadow" />
            </div>
          </div>

          {/* Error */}
          {globalError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-center max-w-2xl mx-auto">
              {globalError}
            </div>
          )}

          {result && (
            <ResultSection
              result={result}
              isImageLoading={isImageLoading}
              isLightboxOpen={isLightboxOpen}
              showPrompt={showPrompt}
              isCopied={isCopied}
              onTogglePrompt={() => setShowPrompt(!showPrompt)}
              onCopyPrompt={handleCopyPrompt}
              onDownload={handleDownload}
              onGenerateAnother={handleGenerateAnother}
              onImageLoad={() => setIsImageLoading(false)}
              onImageError={() => setIsImageLoading(false)}
              onOpenLightbox={() => setIsLightboxOpen(true)}
              onCloseLightbox={() => setIsLightboxOpen(false)}
            />
          )}

          {roast && (
            <RoastSection
              roast={roast}
              isCopied={isRoastCopied}
              onCopy={handleCopyRoast}
            />
          )}

          {fbiProfile && (
            <FbiProfileSection
              profile={fbiProfile}
              isCopied={isProfileCopied}
              onCopy={handleCopyProfile}
            />
          )}

          {osintReport && (
            <OsintSection
              report={osintReport}
              isCopied={isOsintCopied}
              onCopy={handleCopyOsint}
            />
          )}

          {caricatureResult && (
            <CaricatureSection
              result={caricatureResult}
              onDownload={handleCaricatureDownload}
              onGenerateAnother={handleCaricatureAnother}
            />
          )}

          {jointPicResult && (
            <JointPicSection
              result={jointPicResult}
              isImageLoading={isJointPicImageLoading}
              showPrompt={showJointPicPrompt}
              onTogglePrompt={() => setShowJointPicPrompt(!showJointPicPrompt)}
              onImageLoad={() => setIsJointPicImageLoading(false)}
              onImageError={() => setIsJointPicImageLoading(false)}
              onDownload={handleJointPicDownload}
              onGenerateAnother={handleJointPicAnother}
            />
          )}

          {/* Video Result Section */}
          {videoResult && (
            <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
              <div className="relative group rounded-3xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-2xl shadow-cyan-900/10 ring-1 ring-white/5">
                {/* Header Overlay */}
                <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-20 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                  <div className="flex items-center gap-3 pointer-events-auto">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-medium text-white/90">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                      @{videoResult.username}
                    </div>
                  </div>
                  <div className="pointer-events-auto">
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      AI VIDEO BETA
                    </span>
                  </div>
                </div>

                {/* Video Player Container */}
                <div className="relative aspect-video bg-neutral-900">
                  <video
                    src={videoResult.videoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Bottom Actions Overlay - Always visible on mobile, nicer on desktop */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-20 flex items-end justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
                  <div className="pointer-events-auto flex items-center gap-2">
                    {/* Left side actions if needed */}
                  </div>
                  <div className="pointer-events-auto flex items-center gap-3">
                    <button
                      onClick={() => setShowVideoPrompt(!showVideoPrompt)}
                      className={`p-2.5 rounded-xl backdrop-blur-md border transition-all duration-200 ${showVideoPrompt
                          ? 'bg-white/20 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                          : 'bg-black/40 border-white/10 text-neutral-200 hover:bg-black/60 hover:text-white'
                        }`}
                      title={showVideoPrompt ? 'Hide Prompt' : 'Show Prompt'}
                    >
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-300 ${showVideoPrompt ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <a
                      href={videoResult.videoUrl}
                      download={`xpic-video-${videoResult.username}.mp4`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-cyan-900/20 hover:shadow-cyan-500/20 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Prompt Section - Clean Slide Down */}
              {showVideoPrompt && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-300 px-1">
                  <div className="relative p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.04] transition-colors group/prompt">
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Video Prompt</h3>
                          <div className="h-px flex-1 bg-white/[0.06]" />
                        </div>
                        <p className="text-sm text-neutral-300 leading-relaxed font-light font-mono selection:bg-cyan-500/30 selection:text-cyan-100">
                          {videoResult.videoPrompt}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(videoResult.videoPrompt);
                          setIsVideoPromptCopied(true);
                          toast.success('Prompt copied!');
                          setTimeout(() => setIsVideoPromptCopied(false), 2000);
                        }}
                        className="p-2.5 rounded-xl bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 text-neutral-400 hover:text-white transition-all shrink-0"
                        title="Copy Prompt"
                      >
                        {isVideoPromptCopied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Action */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    setVideoResult(null);
                    setShowVideoPrompt(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group flex items-center gap-2 px-6 py-2.5 rounded-full text-neutral-500 hover:text-neutral-300 transition-colors text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500 opacity-50 group-hover:opacity-100" />
                  Generate New Video
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </SidebarProvider>
  );
}
