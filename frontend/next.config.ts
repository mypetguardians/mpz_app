/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pub-*.*.r2.dev" },
      { protocol: "https", hostname: "pub-*.r2.dev" },
      { protocol: "https", hostname: "openapi.animal.go.kr" },
      { protocol: "http", hostname: "openapi.animal.go.kr" },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      { protocol: "https", hostname: "encrypted-tbn3.gstatic.com" },
    ],
  },
};

module.exports = nextConfig;
