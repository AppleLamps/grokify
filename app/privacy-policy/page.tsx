import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${SITE_NAME} (${SITE_URL}). Learn how we handle your data when you use our AI-powered tools.`,
  alternates: {
    canonical: '/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      <header className="border-b border-white/10 bg-black/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to {SITE_NAME}</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: April 3, 2025</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Overview</h2>
            <p>
              {SITE_NAME} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates{' '}
              <span className="text-white">grokify.ai</span>. This Privacy Policy explains what
              information we collect when you use our AI-powered tools, how we use it, and your
              rights regarding that information. By using our site you agree to the practices
              described here.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-white font-medium">User inputs.</span> When you use our
                tools (e.g., X/Twitter usernames, post URLs, or custom prompts) we transmit that
                input to third-party AI providers (xAI Grok, Google Gemini) solely to generate
                your requested output. We do not store these inputs on our servers beyond the
                lifetime of your request.
              </li>
              <li>
                <span className="text-white font-medium">Generated content.</span> When you create
                shareable images or results, we store the generated output and a unique share ID
                in our database so the share link can be resolved. No personal account information
                is attached to shared content.
              </li>
              <li>
                <span className="text-white font-medium">Usage data.</span> Like most websites we
                receive standard server log data (IP address, browser type, referring URL,
                timestamp) through our hosting provider (Vercel). This data is used for
                security and performance monitoring only.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide and improve our AI-powered tools and features.</li>
              <li>To generate and serve shareable content you explicitly request.</li>
              <li>To monitor for abuse, security incidents, and service reliability.</li>
              <li>We do not sell, rent, or trade your information to third parties.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-3">
              We rely on the following third-party services to operate {SITE_NAME}. Each has its
              own privacy policy and data practices:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-white font-medium">xAI (Grok API)</span> — processes
                prompts and generates text/image outputs.{' '}
                <a
                  href="https://x.ai/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  xAI Privacy Policy
                </a>
              </li>
              <li>
                <span className="text-white font-medium">Google (Gemini API)</span> — used for
                select AI features.{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Google Privacy Policy
                </a>
              </li>
              <li>
                <span className="text-white font-medium">Vercel</span> — our hosting and
                infrastructure provider.{' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Vercel Privacy Policy
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Cookies</h2>
            <p>
              {SITE_NAME} does not use tracking or advertising cookies. Our hosting provider
              (Vercel) may set essential cookies for infrastructure purposes (e.g., load
              balancing). No cookies are used to track you across other websites.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Data Retention</h2>
            <p>
              User inputs (usernames, prompts, URLs) are not persisted after your request is
              fulfilled. Shared results are stored indefinitely so share links continue to work;
              you can request deletion at any time by contacting us. Server logs are retained for
              up to 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Children&apos;s Privacy</h2>
            <p>
              {SITE_NAME} is not directed at children under 13. We do not knowingly collect
              personal information from children. If you believe a child has provided us with
              personal information, please contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Your Rights</h2>
            <p>
              Depending on your jurisdiction you may have rights to access, correct, or delete
              personal data we hold about you. Because we collect minimal personal data, most
              requests can be fulfilled quickly. To exercise any right, please contact us at the
              address below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will revise the
              &ldquo;Last updated&rdquo; date at the top of this page. Continued use of{' '}
              {SITE_NAME} after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Contact</h2>
            <p>
              For privacy-related questions or requests, reach us on X (Twitter) at{' '}
              <a
                href="https://x.com/lamps_apple"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 transition-colors"
              >
                @lamps_apple
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="mt-12 text-center py-6 border-t border-white/10">
        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} {SITE_NAME} · Built by{' '}
          <a
            href="https://x.com/lamps_apple"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            @lamps_apple
          </a>
        </p>
      </footer>
    </div>
  );
}
