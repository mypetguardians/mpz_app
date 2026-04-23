/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "pub-*.r2.dev" },
      { protocol: "https", hostname: "pub-*.*.r2.dev" },
      { protocol: "https", hostname: "openapi.animal.go.kr" },
      { protocol: "http", hostname: "openapi.animal.go.kr" },
      { protocol: "https", hostname: "encrypted-tbn3.gstatic.com" },
      { hostname: "*.kakaocdn.net" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

module.exports = nextConfig;
