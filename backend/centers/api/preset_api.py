from ninja import Router
from ninja.errors import HttpError
from django.http import HttpRequest
from asgiref.sync import sync_to_async
from centers.models import PresetQuestion
from centers.schemas.outbound import (
    PresetQuestionListOut,
    PresetQuestionOut,
    ErrorOut
)

router = Router(tags=["Preset Questions"])


def _build_preset_question_response(question):
    """기본 질문 응답 데이터를 구성합니다."""
    return PresetQuestionOut(
        id=str(question.id),
        category=question.category,
        question=question.question,
        sequence=question.sequence,
        is_active=question.is_active,
        created_at=question.created_at.isoformat(),
        updated_at=question.updated_at.isoformat(),
    )


@router.get(
    "/",
    summary="[R] 기본 질문 목록 조회",
    description="기본 질문 프리셋 목록을 카테고리별로 조회합니다. 인증이 필요하지 않은 공개 API입니다.",
    response={
        200: PresetQuestionListOut,
        500: ErrorOut,
    },
)
async def get_preset_questions(request: HttpRequest):
    """기본 질문 목록을 조회합니다."""
    try:
        @sync_to_async
        def get_preset_questions_list():
            # 활성화된 기본 질문들을 카테고리별, 순서대로 조회
            questions = PresetQuestion.objects.filter(
                is_active=True
            ).order_by('category', 'sequence')
            
            # 응답 데이터 변환
            questions_response = [
                _build_preset_question_response(question)
                for question in questions
            ]
            
            return {"questions": questions_response}
        
        return await get_preset_questions_list()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"기본 질문 목록 조회 중 오류가 발생했습니다: {str(e)}")

