/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "mpz.kr"],
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
    unoptimized: false,
    // 이미지 최적화를 위한 크기 설정
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 최소 품질 설정 (더 작은 파일 크기)
    minimumCacheTTL: 60,
    // 포맷 최적화 (WebP, AVIF 자동 변환)
    formats: ["image/avif", "image/webp"],
  },
};

module.exports = nextConfig;
