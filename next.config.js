/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Turbopack rooted to this app even when parent folders contain lockfiles.
  turbopack: {
    root: __dirname,
  },
  // Allow larger request bodies for image/video editing
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
