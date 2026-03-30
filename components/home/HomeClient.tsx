'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ChevronDown,
  History,
  Sparkles,
  FlaskConical,
  Check,
  Copy,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { usePromptHistory } from '@/hooks/usePromptHistory';
import type { ResultPayload } from '@/components/home/sections/ResultSection';
import HomeHeroColumn from '@/components/home/HomeHeroColumn';
import HomePhoneColumn from '@/components/home/HomePhoneColumn';

const PromptHistorySidebar = dynamic(
  () => import('@/components/PromptHistorySidebar').then((mod) => mod.PromptHistorySidebar),
  { ssr: false }
);
const LoadingOverlay = dynamic(
  () => import('@/components/LoadingOverlay').then((mod) => mod.LoadingOverlay),
  { ssr: false }
);
const ResultSection = dynamic(() => import('@/components/home/sections/ResultSection'), { ssr: false });
const RoastSection = dynamic(() => import('@/components/home/sections/RoastSection'), { ssr: false });
const FbiProfileSection = dynamic(() => import('@/components/home/sections/FbiProfileSection'), { ssr: false });
const OsintSection = dynamic(() => import('@/components/home/sections/OsintSection'), { ssr: false });
const CaricatureSection = dynamic(() => import('@/components/home/sections/CaricatureSection'), { ssr: false });
const JointPicSection = dynamic(() => import('@/components/home/sections/JointPicSection'), { ssr: false });

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
  const [clearUsernameSignal, setClearUsernameSignal] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<string>('default');
  const [selectedModel, setSelectedModel] = useState<'nano-banana' | 'grok-imagine'>('grok-imagine');
  const [isLoading, setIsLoading] = useState(false);
  const [isRoasting, setIsRoasting] = useState(false);
  const [isProfiling, setIsProfiling] = useState(false);
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

  const handleGenerate = useCallback(async (normalizedHandle: string) => {
    setIsLoading(true);
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
            style: selectedStyle,
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
  }, [addToHistory, selectedModel, selectedStyle]);

  const handleGenerateVideo = useCallback(async (normalizedHandle: string) => {
    setIsVideoGenerating(true);
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
  }, []);

  const handleDownload = async () => {
    if (!result?.imageUrl) return;

    try {
      const link = document.createElement('a');
      link.download = `xpressionist-${result.username}.png`;

      if (result.imageUrl.startsWith('data:')) {
        // Data URL — use directly without proxying
        link.href = result.imageUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // External URL — proxy to avoid CORS issues
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(result.imageUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Failed to fetch image');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast.success('Downloaded!');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleRoast = useCallback(async (normalizedHandle: string) => {
    setIsRoasting(true);
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
  }, []);

  const handleFbiProfile = useCallback(async (normalizedHandle: string) => {
    setIsProfiling(true);
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
  }, []);

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
    setClearUsernameSignal((n) => n + 1);
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

  const openStyleModal = useCallback(() => setIsStyleModalOpen(true), []);
  const openCaricatureModal = useCallback(() => setIsCaricatureModalOpen(true), []);
  const openJointPicModal = useCallback(() => setIsJointPicModalOpen(true), []);

  const onCaricatureModalOpenChange = useCallback((open: boolean) => {
    setIsCaricatureModalOpen(open);
    if (!open) setCaricaturePreview(null);
  }, []);

  const onJointPicModalOpenChange = useCallback((open: boolean) => {
    setIsJointPicModalOpen(open);
    if (!open) {
      setJointPicHandle1('');
      setJointPicHandle2('');
    }
  }, []);

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

      <main className="relative z-10 min-h-screen px-6 lg:px-12 py-10 lg:py-16 flex flex-col justify-start">
        <div className="max-w-6xl mx-auto w-full space-y-24">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <HomeHeroColumn
              isBusy={isBusy}
              isStyleModalOpen={isStyleModalOpen}
              onStyleModalOpenChange={setIsStyleModalOpen}
              selectedStyle={selectedStyle}
              onSelectStyle={setSelectedStyle}
              isCaricatureModalOpen={isCaricatureModalOpen}
              onCaricatureModalOpenChange={onCaricatureModalOpenChange}
              caricaturePreview={caricaturePreview}
              onCaricatureImageSelect={handleCaricatureImageSelect}
              onCaricatureGenerate={handleCaricatureGenerate}
              isJointPicModalOpen={isJointPicModalOpen}
              onJointPicModalOpenChange={onJointPicModalOpenChange}
              jointPicHandle1={jointPicHandle1}
              jointPicHandle2={jointPicHandle2}
              onJointPicHandle1Change={setJointPicHandle1}
              onJointPicHandle2Change={setJointPicHandle2}
              onJointPicGenerate={handleJointPicGenerate}
            />
            <HomePhoneColumn
              isBusy={isBusy}
              selectedStyle={selectedStyle}
              selectedModel={selectedModel}
              onSelectedModelChange={setSelectedModel}
              onOpenStyleModal={openStyleModal}
              clearUsernameSignal={clearUsernameSignal}
              onGeneratePhoto={handleGenerate}
              onGenerateVideo={handleGenerateVideo}
              onRoast={handleRoast}
              onFbiProfile={handleFbiProfile}
              onCaricatureOpen={openCaricatureModal}
              onJointPicOpen={openJointPicModal}
            />
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
