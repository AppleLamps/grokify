import { Metadata } from 'next';
import { list } from '@vercel/blob';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Download } from 'lucide-react';
import { SITE_NAME, SITE_URL } from '@/lib/site';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Get image data from Vercel Blob
async function getImageData(imageId: string) {
  try {
    const { blobs } = await list({
      prefix: `xpressionist/${imageId}`,
      limit: 1,
    });

    if (blobs.length === 0) {
      return null;
    }

    const blob = blobs[0];

    // Extract username from filename if present (uses __ as separator)
    const filenameMatch = blob.pathname.match(/xpressionist\/[A-Za-z0-9]+__([^.]+)\./);
    const username = filenameMatch ? filenameMatch[1] : undefined;

    return {
      imageId,
      url: blob.url,
      username,
    };
  } catch (error) {
    console.error('Failed to get image:', error);
    return null;
  }
}

// Generate dynamic metadata for Twitter Cards and Open Graph
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const imageData = await getImageData(id);

  if (!imageData) {
    return {
      title: `Artwork not found | ${SITE_NAME}`,
      metadataBase: new URL(SITE_URL),
    };
  }

  const title = imageData.username
    ? `@${imageData.username}'s X Profile Artwork`
    : 'X Profile Artwork';

  const description = imageData.username
    ? `AI-generated satirical artwork of @${imageData.username}'s X profile — ${SITE_NAME} at grokify.ai`
    : `AI-generated satirical artwork — ${SITE_NAME} at grokify.ai`;

  const shareUrl = `${SITE_URL}/share/${id}`;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: `/share/${id}` },
    openGraph: {
      title,
      description,
      url: shareUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: imageData.url,
          width: 1024,
          height: 1024,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{
        url: imageData.url,
        width: 1024,
        height: 1024,
        alt: title,
      }],
    },
    other: {
      'twitter:image': imageData.url,
      'twitter:image:width': '1024',
      'twitter:image:height': '1024',
    },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { id } = await params;
  const imageData = await getImageData(id);

  if (!imageData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background gradient */}
      <div className="wrapped-background fixed inset-0" />

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold">
              <span className="text-white">X</span>
              <span className="gradient-text">pressionist</span>
            </h1>
            {imageData.username && (
              <p className="text-neutral-400">
                Artwork generated for{' '}
                <a
                  href={`https://x.com/${imageData.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:underline"
                >
                  @{imageData.username}
                </a>
              </p>
            )}
          </div>

          {/* Image */}
          <div className="flex justify-center">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageData.url}
                alt={imageData.username ? `Artwork for @${imageData.username}` : 'Generated artwork'}
                className="max-w-full h-auto"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Create Your Own
            </Link>

            <a
              href={imageData.url}
              download={imageData.username ? `xpressionist-${imageData.username}.png` : 'xpressionist-artwork.png'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
            >
              <Download className="w-5 h-5" />
              Download
            </a>

            {imageData.username && (
              <a
                href={`https://x.com/${imageData.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
              >
                View @{imageData.username} on X
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

