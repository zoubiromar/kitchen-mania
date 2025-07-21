import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      },
      {
        protocol: 'https',
        hostname: 'dalleprodsec.blob.core.windows.net',
      },
      {
        protocol: 'https',
        hostname: 'openai-labs-public-images-prod.azureedge.net',
      },
    ],
  },
};

export default nextConfig;
