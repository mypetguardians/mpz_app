# 공공데이터 API 동기화 시스템

## 개요

이 시스템은 국가동물보호정보시스템의 공공데이터 API를 통해 유기동물 정보를 가져와서 우리 데이터베이스에 동기화하는 기능을 제공합니다.

## 주요 기능

- **자동 동기화**: QStash를 통한 자동 스케줄링
- **스마트 동기화 전략**: 증분/전체/상태체크 동기화 선택 가능
- **중복 방지**: 공고번호를 unique key로 사용하여 중복 데이터 방지
- **상태 추적**: 동물의 보호 상태 변화를 실시간으로 추적
- **이미지 관리**: 공공데이터의 동물 이미지를 자동으로 저장
- **기존 DB 구조 활용**: 공공데이터를 기존 Animal, Center 모델에 직접 매핑
- **연도별 조건부 필터링**: 2019-2022년은 보호중만, 2023년 이후는 모든 상태 허용
- **스마트 업데이트**: 중복된 동물은 상태만 업데이트, 새 동물만 생성
- **공고번호 표시**: announce_number가 없으면 public_notice_number를 표시
- **공공데이터 식별**: 공공데이터로 가져온 동물을 쉽게 구분

## 설정

### 환경 변수

`.env` 파일에 다음 변수들을 설정하세요:

```bash
# 공공데이터 서비스 키
PUBLIC_DATA_SERVICE_KEY=mkOdl5FsTuado+b3D/Lz0mmHV+lNCFxwXfrDQHk3n4wo6G5QcZ2VgpsBhEjiRzC8ywkIeK+eiwo4y7EjaUfKDQ==

# QStash 설정 (선택사항 - 노코드 대시보드에서 설정 가능)
QSTASH_TOKEN=your_qstash_token
QSTASH_URL=https://qstash.upstash.io

# API 기본 URL
API_BASE_URL=https://your-domain.com
```

### 2. 공공데이터 서비스 키 발급

1. [공공데이터포털](https://www.data.go.kr/)에 가입
2. "유기동물 조회 서비스" API 신청
3. 승인 후 서비스 키 발급

### 3. QStash 설정 (자동 스케줄링)

QStash를 사용하여 매일 새벽 2시에 자동으로 API를 호출할 수 있습니다:

```bash
# QStash 스케줄러 설정
python qstash_scheduler.py
```

## 사용법

### 1. API 엔드포인트

#### 증분 동기화 (최근 데이터만)

```
GET /v1/animals/public-data/sync
```

**파라미터:**

- `sync_strategy`: incremental (기본값)
- `bgnde`: 구조날짜 시작 (YYYYMMDD) - 미입력시 어제 날짜 자동 설정
- `endde`: 구조날짜 종료 (YYYYMMDD) - 미입력시 어제 날짜 자동 설정
- `upkind`: 축종코드 (개: 417000, 고양이: 422400, 기타: 429900)
- `state`: 상태 (notice: 공고중, protect: 보호중) - 미입력시 연도에 따라 자동 설정

**권한:** 관리자만 (최고관리자, 센터관리자)

**응답 예시:**

```json
{
  "message": "증분 동기화 완료: 5개 생성, 2개 업데이트",
  "result": {
    "created": 5,
    "updated": 2,
    "errors": 0,
    "total": 7
  }
}
```

#### 전체 동기화 (모든 데이터)

```
GET /v1/animals/public-data/sync?sync_strategy=full
```

#### 상태 체크 동기화 (전체 데이터 상태 업데이트)

```
GET /v1/animals/public-data/sync?sync_strategy=status_check
```

**권한:** 관리자만 (최고관리자, 센터관리자)

### 2. QStash 자동 스케줄링

QStash 대시보드에서 다음 스케줄을 등록하세요:

#### 증분 동기화 (매일 새벽 2시)

```
URL: GET /v1/animals/public-data/sync
Cron: 0 2 * * *
목적: 최근 데이터만 가져와서 새 동물 추가
```

#### 상태 체크 동기화 (주말 새벽 3시)

```
URL: GET /v1/animals/public-data/sync?sync_strategy=status_check
Cron: 0 3 * * 0
목적: 전체 데이터를 가져와서 상태 변경 확인
```

#### 전체 동기화 (매월 1일 새벽 4시)

```
URL: GET /v1/animals/public-data/sync?sync_strategy=full
Cron: 0 4 1 * *
목적: 모든 데이터를 새로 가져와서 완전 동기화
```

### 3. 수동 API 호출

#### 즉시 증분 동기화

```bash
curl -X GET "https://your-domain.com/v1/animals/public-data/sync" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 즉시 상태 체크

```bash
curl -X GET "https://your-domain.com/v1/animals/public-data/sync?sync_strategy=status_check" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 즉시 전체 동기화

```bash
curl -X GET "https://your-domain.com/v1/animals/public-data/sync?sync_strategy=full" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. 동기화 상태 조회

#### 현재 상태 확인

```bash
curl -X GET "https://your-domain.com/v1/animals/public-data/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**응답 예시:**

```json
{
  "total_public_animals": 150,
  "status_distribution": [
    { "status": "보호중", "count": 120 },
    { "status": "입양완료", "count": 25 },
    { "status": "안락사", "count": 5 }
  ],
  "latest_update": "2025-08-31T17:08:56"
}
```

### 3. 공고번호 표시 시스템

동물 조회 시 공고번호를 표시하는 스마트한 시스템을 제공합니다:

#### 공고번호 우선순위

1. **`announce_number`**: 일반 동물의 공고번호 (우선)
2. **`public_notice_number`**: 공공데이터 동물의 공고번호 (보조)
3. **"공고번호 없음"**: 둘 다 없는 경우 기본값

#### API 응답 필드

```python
# 동물 조회 API 응답에 포함되는 필드
{
    "announce_number": "ANNOUNCE001",        # 원본 공고번호 (있을 수 있음)
    "display_notice_number": "ANNOUNCE001",  # 표시용 공고번호 (항상 존재)
    "is_public_data": true,                 # 공공데이터 여부
    "public_notice_number": "PUBLIC001"     # 공공데이터 공고번호
}
```

#### 사용 예시

- **일반 동물**: `announce_number`가 있으면 해당 값 표시
- **공공데이터 동물**: `announce_number`가 없으면 `public_notice_number` 표시
- **공고번호 없는 동물**: "공고번호 없음" 표시

### 4. 공공데이터 동물 식별

공공데이터로 가져온 동물을 쉽게 구분할 수 있습니다:

#### 식별 조건

- `is_public_data = True`
- `public_notice_number`가 존재

#### 활용 방안

- 프론트엔드에서 공공데이터 동물 표시
- 공공데이터 출처 표시
- 데이터 신뢰성 정보 제공

### 5. 공공데이터 특이사항 코멘트

공공데이터의 `noticeComment`를 동물의 `comment` 필드에 저장합니다:

#### 필드 매핑

- **`noticeComment`** → **`comment`**: 공공데이터 공고 코멘트
- **`specialMark`** → **`description`**: 공공데이터 특이사항

#### API 응답

```python
{
    "comment": "공공데이터에서 가져온 특이사항 코멘트입니다.",
    "description": "공공데이터 특이사항",
    "is_public_data": true
}
```

### 6. 보호소 정보 자동 업데이트

공공데이터의 보호소 정보를 Center 모델에 자동으로 매핑하고 업데이트합니다:

#### 매핑 필드

- **`careNm`** → **`name`**: 보호소명
- **`careTel`** → **`phone_number`**: 보호소 전화번호
- **`careAddr`** → **`location`**: 보호소 주소
- **`orgNm`** → **`region`**: 기관명에서 지역 추출

#### 업데이트 로직

- 기존 센터가 있으면 정보 업데이트
- 새로운 센터가 없으면 자동 생성
- 보호소 정보 변경 시 실시간 업데이트

### 7. 이미지 처리 시스템

공공데이터의 이미지를 AnimalImage 모델에 자동으로 저장합니다:

#### 이미지 필드

- **`popfile1`**: 첫 번째 이미지 (대표 이미지)
- **`popfile2`**: 두 번째 이미지
- **`filename`**: 추가 이미지 (향후 확장 가능)

#### 처리 로직

- 기존 이미지 삭제 후 새 이미지 저장
- 첫 번째 이미지를 대표 이미지로 설정
- 이미지 순서 자동 관리
- URL 기반 이미지 저장

## 데이터 구조

### Animal 모델 (정리된 구조)

```python
# 공공데이터 관련 필드 (최소한만 유지)
is_public_data = models.BooleanField(default=False)           # 공공데이터 여부
public_notice_number = models.CharField(max_length=50)       # 공고번호 (unique, 중복 방지용)

# 기존 필드 활용
announce_number = models.CharField(max_length=50)            # 공고번호 (공공데이터와 동일)
breed = models.CharField(max_length=100)                     # 품종 (공공데이터 kindNm)
age = models.PositiveIntegerField()                          # 나이 (공공데이터 age 파싱)
is_female = models.BooleanField()                            # 성별 (공공데이터 sexCd)
weight = models.DecimalField()                               # 체중 (공공데이터 weight 파싱)
neutering = models.BooleanField()                            # 중성화 (공공데이터 neuterYn)
status = models.CharField()                                  # 상태 (공공데이터 processState 매핑)
description = models.TextField()                             # 설명 (공공데이터 specialMark)
found_location = models.CharField()                          # 발견장소 (공공데이터 happenPlace)
admission_date = models.DateField()                          # 입소일 (공공데이터 happenDt)
```

### Center 모델 (정리된 구조)

```python
# 공공데이터 관련 필드 (최소한만 유지)
public_reg_no = models.CharField(max_length=50, unique=True)  # 공공데이터 보호소번호

# 기존 필드 활용
name = models.CharField(max_length=100)                      # 보호소명 (공공데이터 careNm)
location = models.CharField(max_length=200)                  # 주소 (공공데이터 careAddr)
phone_number = models.CharField(max_length=20)               # 연락처 (공공데이터 careTel)
region = models.CharField(max_length=10)                     # 지역 (공공데이터 sido 매핑)
```

### 지역 정보 모델

```python
class Sido(BaseModel):
    code = models.CharField(max_length=10, unique=True)      # 시도 코드
    name = models.CharField(max_length=50)                   # 시도명

class Sigungu(BaseModel):
    code = models.CharField(max_length=10, unique=True)      # 시군구 코드
    name = models.CharField(max_length=50)                   # 시군구명
    sido = models.ForeignKey(Sido)                          # 상위 시도

class Shelter(BaseModel):
    care_reg_no = models.CharField(max_length=50, unique=True)  # 보호소 등록번호
    care_nm = models.CharField(max_length=200)                  # 보호소명
    care_tel = models.CharField(max_length=50)                  # 연락처
    care_addr = models.CharField(max_length=500)                # 주소
    care_owner_nm = models.CharField(max_length=100)            # 소유자명
    org_nm = models.CharField(max_length=200)                  # 기관명
    sido = models.ForeignKey(Sido)                             # 소재 시도
    sigungu = models.ForeignKey(Sigungu)                      # 소재 시군구
```

## 데이터 처리 로직

### 1. 중복 방지 및 업데이트

공공데이터 동기화 시 다음과 같은 로직으로 처리됩니다:

#### 중복 체크

- `public_notice_number`를 unique key로 사용
- 동일한 공고번호가 이미 존재하면 새로 생성하지 않음

#### 스마트 업데이트

- **상태 변경**: 보호중 → 입양완료, 입양완료 → 반환 등
- **정보 업데이트**: 발견장소, 입소일, 특이사항 등
- **센터 정보**: 보호소 정보가 변경된 경우 센터 정보도 업데이트

#### 업데이트 대상 필드

```python
# 주요 업데이트 필드
- status: 보호 상태 (가장 중요한 변경사항)
- description: 특이사항
- found_location: 발견장소
- admission_date: 입소일
- breed: 품종
- age: 나이
- weight: 체중
- is_female: 성별
- neutering: 중성화 여부
- center: 보호소 정보
```

### 2. 동기화 전략별 처리 방식

#### 증분 동기화 (incremental)

- **목적**: 최근 데이터만 가져와서 새 동물 추가
- **처리**: 중복 체크 후 새 동물만 생성, 기존 동물은 상태 업데이트
- **효율성**: 빠른 실행, 리소스 절약

#### 상태 체크 동기화 (status_check)

- **목적**: 전체 데이터를 가져와서 상태 변경 확인
- **처리**: 모든 동물의 상태를 공공데이터와 비교하여 업데이트
- **효율성**: 상태 업데이트에 집중

#### 전체 동기화 (full)

- **목적**: 모든 데이터를 새로 가져와서 완전 동기화
- **처리**: 전체 데이터를 처리하여 새 동물 생성 및 기존 동물 업데이트
- **효율성**: 데이터 무결성 보장

## 데이터 구조

### 1. 중복 방지

- `public_notice_number`를 unique key로 사용
- 기존 동물이 있으면 업데이트, 없으면 새로 생성

### 2. 상태 매핑

```python
status_mapping = {
    '보호중': '보호중',
    '공고중': '보호중',
    '입양완료': '입양완료',
    '안락사': '안락사',
    '자연사': '자연사',
    '반환': '반환'
}
```

### 3. 나이 변환

- "2021(년생)" → 48개월 (2025-2021 = 4년)
- "60일미만" → 1개월

### 4. 체중 변환

- "16(Kg)" → 16.0

## 오류 처리

### 일반적인 오류

1. **서비스 키 미설정**

   ```
   공공데이터 서비스 키가 설정되지 않았습니다.
   ```

2. **API 호출 실패**

   ```
   공공데이터 API 호출 중 오류가 발생했습니다
   ```

3. **권한 부족**
   ```
   관리자 권한이 필요합니다
   ```

### 로그 확인

```bash
# Django 로그 확인
tail -f /var/log/django/error.log

# 관리 명령어 실행 시 상세 로그
python manage.py sync_public_data --auto-date -v 3
```

## 모니터링

### 1. 동기화 상태 확인

```bash
python manage.py shell
```

```python
from animals.models import Animal
from django.db.models import Count

# 공공데이터 동물 수
Animal.objects.filter(is_public_data=True).count()

# 상태별 분포
Animal.objects.filter(is_public_data=True).values('status').annotate(count=Count('id'))
```

### 2. 최근 업데이트 확인

```python
# 최근 업데이트된 동물
Animal.objects.filter(is_public_data=True).order_by('-public_update_time')[:10]
```

## 성능 최적화

### 1. 인덱스

- `public_notice_number`

```

```
