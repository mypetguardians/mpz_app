# 베이스 이미지: Node.js LTS (예: 20.x)
FROM node:20-alpine

# package.json과 package-lock.json 복사
COPY ./package*.json ./

# 의존성 설치
RUN npm install

# 나머지 소스 코드 복사
COPY ./ /app

# 작업 디렉토리 설정
WORKDIR /app

# 빌드
RUN npm run build

# 환경 변수나 기타 설정이 필요하다면 여기에 추가

# Next.js 앱 실행 (로컬 개발환경 모드)
CMD ["npm", "run", "dev"]
