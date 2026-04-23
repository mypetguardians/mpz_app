# ---- Builder stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# 1. 의존성만 먼저 복사 → npm ci 레이어 캐시 (package.json 변경 시에만 무효화)
COPY package*.json ./
RUN npm ci

# 2. 환경변수 주입 (npm ci 이후에 선언 → 의존성 캐시에 영향 없음)
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_KAKAO_CLIENT_ID
ENV NEXT_PUBLIC_KAKAO_CLIENT_ID=$NEXT_PUBLIC_KAKAO_CLIENT_ID

# 3. 소스 복사 후 빌드 (CACHE_BUST로 캐시 무효화)
ARG CACHE_BUST=0
COPY . .
RUN npm run build

# ---- Runner stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# standalone 출력물만 복사 (node_modules 불필요, 이미지 크기 대폭 감소)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
