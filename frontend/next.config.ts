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
    // 모바일 앱 전용: 불필요한 대형 이미지 생성 방지
    deviceSizes: [384, 420, 640, 750, 1080],
    imageSizes: [64, 128, 200, 256],
    // AVIF 우선 (WebP 대비 20~30% 작음), 미지원 브라우저는 WebP 폴백
    formats: ["image/avif", "image/webp"],
    // 최적화된 이미지 24시간 캐시 (동물 이미지는 거의 변경 안 됨)
    minimumCacheTTL: 86400,
  },
};

module.exports = nextConfig;
