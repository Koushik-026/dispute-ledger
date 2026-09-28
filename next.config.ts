import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server components properly
  reactStrictMode: true,
  // Silence certain Hindsight/Groq SDK warnings in Next.js bundler
  serverExternalPackages: ['@vectorize-io/hindsight-client', 'groq-sdk'],
};

export default nextConfig;
