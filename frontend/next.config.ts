import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pub-*.*.r2.dev" as unknown as string },
      { protocol: "https", hostname: "pub-*.r2.dev" as unknown as string },
      { protocol: "https", hostname: "openapi.animal.go.kr" },
      { protocol: "http", hostname: "openapi.animal.go.kr" },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com" as unknown as string,
      },
    ],
  },
};

export default nextConfig;
