# Frontend — Next.js 15 + React 19 + TypeScript

## 스택
Next.js 15 (App Router), React 19, Capacitor 7 (iOS/Android/Web), Tailwind CSS, Zustand, TanStack Query, Axios

## 구조
- `src/app/` — App Router 페이지
- `src/components/` — UI 컴포넌트 (PetCard, Banner, AnimalImage 등)
- `src/hooks/` — Query/Mutation hooks (useGetAnimals, useUploadSingleImage 등)
- `src/lib/` — 유틸리티 (animal-utils, auth, filter, getProxyImageUrl 등)
- `src/types/` — 타입 정의 (animal.ts 등)
- `src/stores/` — Zustand 상태 관리

## 핵심 유틸
- `getDisplayBreedName(breed, name)` — 종+이름 조합 표시
- `getProxyImageUrl(url)` — 이미지 URL 정규화 (현재 passthrough)

## 이미지
- Supabase URL은 직접 서빙 (프록시 제거됨)
- `next.config.ts` remotePatterns: *.supabase.co, *.kakaocdn.net, openapi.animal.go.kr
- AnimalImage 컴포넌트가 에러 시 fallback 이미지 표시

## SEO 규칙
- **metadataBase**: `layout.tsx`에 `https://mpz.kr` 설정됨 — canonical 등 상대경로 자동 해석
- **canonical URL 필수**: 공개 페이지는 반드시 `alternates.canonical` 설정
- **페이지별 고유 메타데이터**: 공개 페이지마다 고유 title + description 필수
- **robots.txt**: `robots.ts`에서 prod/dev 분기. 비공개 페이지 Disallow. 네이버 Yeti 명시
- **sitemap**: `sitemap.ts`에서 동적 생성. 새 공개 페이지 추가 시 sitemap에도 반영
- **OG 이미지**: 150x150 이상, 5KB 이상, 가로:세로 3:1 이하
- **JSON-LD**: 상세 페이지에 구조화 데이터 포함. schema.org 기준
- **`<h1>` 1개**: 페이지당 h1 태그 1개만 사용
- **`<a href>`**: JS 호출 대신 실제 URL href 사용. 검색로봇 링크 추출용

## 서버/클라이언트 컴포넌트 패턴
- "use client" page.tsx에는 `export const metadata` 사용 불가
- 정적 메타데이터 필요 시: 같은 폴더에 서버 컴포넌트 layout.tsx를 만들어 metadata export
- 동적 메타데이터 필요 시: page.tsx를 서버 컴포넌트로, 클라이언트 로직은 `_components/`로 분리
- React hooks는 QueryClientProvider 등 해당 Provider 하위에서만 사용 가능. Provider 바깥이면 CustomEvent 등으로 우회

## 인증/상태 렌더링
- 인증 상태(`isAuthenticated`) 기반 조건부 렌더링 시 반드시 로딩 상태 체크 먼저
- 로딩 중에는 스켈레톤/placeholder 표시. 초기값(로그인 버튼 등) 노출 금지

## FCM 웹 푸시
- Capacitor 네이티브 vs 웹 브라우저 FCM 로직 완전 분리 (`detectPlatform()` 기반)
- 네이티브 앱에서 웹 푸시 로직 절대 안 탐
- Firebase 웹 config(apiKey 등)는 공개 키. GitHub secret alert은 false positive

## 빌드 주의
- NEXT_PUBLIC_* 변경 시 Dockerfile ARG, deploy.yml build-args, docker-compose env 3곳 동기화 필수
- ESLint strict — 미사용 import/변수 있으면 빌드 실패
- Dockerfile에 CACHE_BUST ARG로 캐시 무효화
