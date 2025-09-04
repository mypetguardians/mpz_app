#!/bin/bash

# QStash 공공 데이터 API 스케줄 등록 스크립트
# 헤더 기반 인증 사용 (JWT 불필요)

echo "🚀 QStash 공공 데이터 API 스케줄 등록 시작..."

# 설정 변수 (실제 값으로 교체하세요)
QSTASH_TOKEN="your_qstash_token_here"
API_KEY="your_api_key_here"  # X-API-Key 헤더에 사용할 키
API_BASE_URL="https://mpzfullstack-production.up.railway.app"

echo "📋 설정 확인:"
echo "   QStash Token: ${QSTASH_TOKEN:0:10}..."
echo "   API Key: ${API_KEY:0:10}..."
echo "   API Base URL: $API_BASE_URL"
echo ""

# 1. 매일 증분 동기화 (새벽 2시)
echo "📅 매일 증분 동기화 스케줄 등록 중..."
curl -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Public Data Sync - Daily Incremental",
    "url": "'$API_BASE_URL'/v1/animals/public-data/sync",
    "cron": "0 2 * * *",
    "headers": {
      "X-API-Key": "'$API_KEY'",
      "Content-Type": "application/json"
    }
  }'

echo -e "\n✅ 매일 증분 동기화 스케줄 등록 완료"

# 2. 주간 상태 체크 (일요일 새벽 3시)
echo "📅 주간 상태 체크 동기화 스케줄 등록 중..."
curl -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Public Data Sync - Weekly Status Check",
    "url": "'$API_BASE_URL'/v1/animals/public-data/sync?sync_strategy=status_check",
    "cron": "0 3 * * 0",
    "headers": {
      "X-API-Key": "'$API_KEY'",
      "Content-Type": "application/json"
    }
  }'

echo -e "\n✅ 주간 상태 체크 동기화 스케줄 등록 완료"

# 3. 월간 전체 동기화 (매월 1일 새벽 4시)
echo "📅 월간 전체 동기화 스케줄 등록 중..."
curl -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Public Data Sync - Monthly Full",
    "url": "'$API_BASE_URL'/v1/animals/public-data/sync?sync_strategy=full",
    "cron": "0 4 1 * *",
    "headers": {
      "X-API-Key": "'$API_KEY'",
      "Content-Type": "application/json"
    }
  }'

echo -e "\n✅ 월간 전체 동기화 스케줄 등록 완료"

echo -e "\n🎉 모든 스케줄이 성공적으로 등록되었습니다!"
echo "📋 등록된 스케줄:"
echo "   • 매일 새벽 2시: 증분 동기화 (최근 데이터)"
echo "   • 매주 일요일 새벽 3시: 상태 체크 동기화"
echo "   • 매월 1일 새벽 4시: 전체 동기화"
echo ""
echo "🔧 환경 변수 설정:"
echo "   PUBLIC_DATA_API_KEY=$API_KEY"
echo ""
echo "📖 QStash 대시보드에서 스케줄 상태를 확인할 수 있습니다:"
echo "   https://console.upstash.com/"
