import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { Toaster } from '@/components/ui/sonner';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — X profile art, roasts & Grok AI tools`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Turn any public X (Twitter) timeline into AI artwork, comedy roasts, satirical profiles, caricatures, and more. Powered by Grok — no login required.',
  applicationName: SITE_NAME,
  authors: [{ name: 'Grokify', url: SITE_URL }],
  keywords: [
    'Grokify',
    'grokify.ai',
    'X art',
    'Twitter art',
    'Grok',
    'xAI',
    'AI image',
    'profile picture',
    'Xpressionist',
  ],
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — AI art from your X profile`,
    description:
      'Bespoke AI artwork, roasts, and creative tools from any public X account. Visit grokify.ai.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — AI art from your X profile`,
    description:
      'Bespoke AI artwork and roasts from any public X timeline. Powered by Grok at grokify.ai.',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
