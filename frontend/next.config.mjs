/** @type {import('next').NextConfig} */
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig = {
  reactStrictMode: true,
  // Add headers configuration for favicon caching
  async headers() {
    return [
      {
        // Apply these headers to favicon and icon files
        source: '/(favicon.svg|favicon.ico|icons/.*\\.png|manifest.json)',
        headers: [
          {
            key: 'Cache-Control',
            // Set to a short cache time to prevent over-caching
            value: 'public, max-age=3600, must-revalidate', // 1 hour cache (shorter than before)
          },
        ],
      },
    ];
  },
  // Add any other configuration options here
};

export default withPWA(nextConfig);