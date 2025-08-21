from ninja import Router

# 각 API 모듈에서 라우터 가져오기
from .phone_verification import router as phone_verification_router
from .adoption import router as adoption_router
from .contract import router as contract_router
from .center import router as center_router
from .user import router as user_router
from .monitoring import router as monitoring_router

# 메인 adoption 라우터
router = Router(tags=["Adoption"])

# 하위 라우터들을 메인 라우터에 포함
router.add_router("", phone_verification_router)
router.add_router("", adoption_router)
router.add_router("", contract_router)
router.add_router("", center_router)
router.add_router("", user_router)
router.add_router("/monitoring", monitoring_router)
