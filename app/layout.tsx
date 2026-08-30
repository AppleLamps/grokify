import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { Toaster } from '@/components/ui/sonner';
import { SITE_NAME, SITE_URL, SITE_DOMAIN } from '@/lib/site';
import './globals.css';

const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'google-site-verification';

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
    'grokify.com',
    'X art',
    'Twitter art',
    'Grok',
    'xAI',
    'AI image',
    'profile picture',
  ],
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
  verification: {
    google: googleSiteVerification,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — AI art from your X profile`,
    description:
      `Bespoke AI artwork, roasts, and creative tools from any public X account. Visit ${SITE_DOMAIN}.`,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — AI art from your X profile`,
    description:
      `Bespoke AI artwork and roasts from any public X timeline. Powered by Grok at ${SITE_DOMAIN}.`,
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
