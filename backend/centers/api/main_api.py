from ninja import Router
from centers.api.contract_api import router as contract_router
from centers.api.consent_api import router as consent_router
from centers.api.procedure_api import router as procedure_router
from centers.api.center_api import router as center_router
from centers.api.center_auth_api import router as center_auth_router
from centers.api.question_api import router as question_router
from centers.api.preset_api import router as preset_router

# centers 앱의 메인 라우터
router = Router()

# 인증이 필요한 센터 API 라우터를 먼저 추가 (센터 경로)
# /me 경로가 UUID 패턴보다 먼저 매칭되도록 함
router.add_router("", center_auth_router)

# 계약서 템플릿 관련 라우터 추가 (UUID 패턴보다 먼저)
router.add_router("/procedures/contract-template/", contract_router)

# 동의서 관련 라우터 추가 (UUID 패턴보다 먼저)
router.add_router("/procedures/consent/", consent_router)

# 프로시저 설정 관련 라우터 추가 (UUID 패턴보다 먼저)
router.add_router("/procedures/settings/", procedure_router)

# 질문 폼 관련 라우터 추가 (UUID 패턴보다 먼저)
router.add_router("/procedures/questions/", question_router)

# 기본 질문 라우터는 전역으로 마운트되므로 여기서는 제거

# 센터 관련 라우터 추가 (센터 경로) - UUID 패턴이 포함되어 마지막에 추가
router.add_router("", center_router)
