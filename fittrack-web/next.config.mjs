/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // standalone output: Next.js собирает минимальный runtime с server.js + трассированными
  // node_modules. Идеально для Docker — итоговый образ на 80% меньше.
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
