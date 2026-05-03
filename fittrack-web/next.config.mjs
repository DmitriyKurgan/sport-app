import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Disable in dev to avoid stale SW caching of HMR assets.
  disable: process.env.NODE_ENV === 'development',
  // Don't precache build manifests (huge, change every deploy)
  buildExcludes: [/middleware-manifest\.json$/, /app-build-manifest\.json$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default withPWA(nextConfig);
