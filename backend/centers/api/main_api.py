from ninja import Router
from centers.api.contract_api import router as contract_router
from centers.api.procedure_api import router as procedure_router
from centers.api.center_api import router as center_router
from centers.api.center_auth_api import router as center_auth_router
from centers.api.question_api import router as question_router

# centers 앱의 메인 라우터
router = Router()

# 인증이 필요한 센터 API 라우터를 먼저 추가 (센터 경로)
# /me 경로가 UUID 패턴보다 먼저 매칭되도록 함
router.add_router("", center_auth_router)

# 센터 관련 라우터 추가 (센터 경로)
router.add_router("", center_router)

# 계약서 템플릿 관련 라우터 추가
router.add_router("/procedures/contract-template/", contract_router)

# 프로시저 설정 관련 라우터 추가
router.add_router("/procedures/settings/", procedure_router)

# 질문 폼 관련 라우터 추가
router.add_router("/procedures/questions/", question_router)
