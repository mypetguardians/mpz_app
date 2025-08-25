from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from django.http import HttpRequest
from django.db.models import Q
from asgiref.sync import sync_to_async
from typing import Dict, Any, List
from datetime import datetime

from api.security import jwt_auth
from .models import Feedback
from .schemas.inbound import (
    FeedbackSubmitIn
)
from .schemas.outbound import (
    FeedbackOut, 
    FeedbackSubmitOut
)

router = Router(tags=["Feedback"])


def _build_feedback_response(feedback: Feedback) -> FeedbackOut:
    """Feedback 모델을 FeedbackOut 스키마로 변환"""
    return FeedbackOut(
        id=str(feedback.id),
        user_id=str(feedback.user.id) if feedback.user else None,
        content=feedback.content,
        status=feedback.status,
        priority=feedback.priority,
        admin_response=feedback.admin_response,
        admin_id=str(feedback.admin.id) if feedback.admin else None,
        responded_at=feedback.responded_at.isoformat() if feedback.responded_at else None,
        created_at=feedback.created_at.isoformat(),
        updated_at=feedback.updated_at.isoformat(),
    )


@router.post(
    "/",
    summary="피드백 제출",
    description="사용자가 피드백을 제출합니다.",
    response={
        200: FeedbackSubmitOut,
        201: FeedbackSubmitOut,
        400: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def submit_feedback(request: HttpRequest, data: FeedbackSubmitIn):
    """피드백 제출 API"""
    try:
        current_user = request.auth
        
        @sync_to_async
        def save_feedback():
            """피드백을 데이터베이스에 저장"""
            feedback = Feedback.objects.create(
                user=current_user,
                content=data.content,
            )
            return feedback
        
        feedback = await save_feedback()
        
        response = FeedbackSubmitOut(
            message="피드백이 성공적으로 제출되었습니다",
            status="접수"
        )
        
        # 201 상태 코드로 응답
        from ninja.responses import Response
        return Response(response, status=201)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"피드백 제출 중 오류: {str(e)}")
        raise HttpError(500, f"피드백 제출 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/",
    summary="내 피드백 목록 조회",
    description="로그인한 사용자의 피드백 목록을 조회합니다.",
    response={
        200: List[FeedbackOut],
        401: dict,
        500: dict,
    },
    auth=jwt_auth,
)
@paginate
def get_my_feedback(request: HttpRequest):
    """내 피드백 목록 조회 API"""
    try:
        current_user = request.auth
        
        # 기본 쿼리셋 (paginate 데코레이터가 자동으로 페이지네이션 처리)
        queryset = Feedback.objects.filter(user=current_user).order_by('-created_at')
        
        # 응답 데이터 구성
        feedback_list = [_build_feedback_response(feedback) for feedback in queryset]
        
        return feedback_list
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"피드백 목록 조회 중 오류: {str(e)}")
        raise HttpError(500, f"피드백 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/{feedback_id}",
    summary="특정 피드백 상세 조회",
    description="로그인한 사용자의 특정 피드백을 상세 조회합니다.",
    response={
        200: FeedbackOut,
        401: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
def get_feedback_detail(request: HttpRequest, feedback_id: str):
    """피드백 상세 조회 API"""
    try:
        current_user = request.auth
        
        try:
            feedback = Feedback.objects.get(
                id=feedback_id, 
                user=current_user
            )
        except Feedback.DoesNotExist:
            raise HttpError(404, "피드백을 찾을 수 없습니다")
        except ValueError:
            # UUID 형식이 아닌 경우
            raise HttpError(404, "유효하지 않은 피드백 ID입니다")
        
        return _build_feedback_response(feedback)
        
    except HttpError:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"피드백 상세 조회 중 오류: {str(e)}")
        raise HttpError(500, f"피드백 상세 조회 중 오류가 발생했습니다: {str(e)}")



