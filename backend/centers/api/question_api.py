from ninja import Router
from ninja.errors import HttpError
from django.http import HttpRequest
from asgiref.sync import sync_to_async
from typing import List
from centers.models import Center, QuestionForm
from centers.schemas.inbound import (
    QuestionFormCreateIn,
    QuestionFormUpdateIn,
    QuestionSequenceUpdateIn,
)
from centers.schemas.outbound import (
    QuestionFormOut,
    QuestionFormListOut,
    QuestionFormDeleteOut,
    ErrorOut
)
from api.security import jwt_auth
from django.db.models import Q

router = Router(tags=["Question Forms"])


def _build_question_response(question):
    """질문 폼 응답 데이터를 구성합니다."""
    return QuestionFormOut(
        id=str(question.id),
        center_id=str(question.center.id),
        question=question.question,
        type=question.type,
        options=question.options,
        is_required=question.is_required,
        sequence=question.sequence,
        created_at=question.created_at.isoformat(),
        updated_at=question.updated_at.isoformat(),
    )


@router.get(
    "/",
    summary="[R] 센터 질문 폼 목록 조회",
    description="센터 관리자가 자신의 센터 질문 폼 목록을 조회합니다.",
    response={
        200: QuestionFormListOut,
        401: ErrorOut,
        403: ErrorOut,
        400: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def get_question_forms(request: HttpRequest):
    """센터 질문 폼 목록을 조회합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "인증이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def get_questions_list():
            # 센터 관리자 권한 확인
            if current_user.user_type not in ["센터관리자", "센터최고관리자"]:
                raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")

            # 사용자의 센터 조회 (owner 또는 center 필드로 연결된 센터)
            try:
                # 먼저 owner로 조회 시도
                user_center = Center.objects.get(owner=current_user)
            except Center.DoesNotExist:
                # owner가 아니면 center 필드로 조회
                try:
                    user_center = current_user.center
                    if not user_center:
                        raise HttpError(400, "등록된 센터가 없습니다")
                except AttributeError:
                    raise HttpError(400, "등록된 센터가 없습니다")

            # 센터의 질문 폼들을 순서대로 조회
            questions = QuestionForm.objects.filter(
                center=user_center
            ).order_by('sequence')

            # 응답 데이터 변환
            questions_response = [
                _build_question_response(question)
                for question in questions
            ]

            return {"questions": questions_response}

        return await get_questions_list()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"질문 폼 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/center/{center_id}",
    summary="[R] 특정 센터의 질문 폼 목록 조회",
    description="center_id를 받아서 해당 센터의 질문 폼 목록을 조회합니다. 인증이 필요하지 않은 공개 API입니다.",
    response={
        200: QuestionFormListOut,
        400: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
)
async def get_question_forms_by_center(request: HttpRequest, center_id: str):
    """특정 센터의 질문 폼 목록을 조회합니다."""
    try:
        @sync_to_async
        def get_center_questions():
            # center_id로 센터 조회
            try:
                center = Center.objects.get(id=center_id)
            except Center.DoesNotExist:
                raise HttpError(404, "센터를 찾을 수 없습니다")
            
            # 해당 센터의 모든 질문 폼 조회 (순서대로)
            questions = QuestionForm.objects.filter(
                center=center
            ).order_by('sequence')
            
            # 응답 데이터 변환
            questions_response = [
                _build_question_response(question)
                for question in questions
            ]
            
            return {"questions": questions_response}
        
        return await get_center_questions()
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"특정 센터의 질문 폼 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.post(
    "/",
    summary="[C] 센터 질문 폼 생성",
    description="센터 관리자가 새로운 질문 폼을 생성합니다.",
    response={
        201: QuestionFormOut,
        401: ErrorOut,
        403: ErrorOut,
        400: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def create_question_form(request: HttpRequest, data: QuestionFormCreateIn):
    """새로운 질문 폼을 생성합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "인증이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def create_question():
            # 센터 관리자 권한 확인
            if current_user.user_type not in ["센터관리자", "센터최고관리자"]:
                raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")

            # 사용자의 센터 조회 (owner 또는 center 필드로 연결된 센터)
            try:
                # 먼저 owner로 조회 시도
                user_center = Center.objects.get(owner=current_user)
            except Center.DoesNotExist:
                # owner가 아니면 center 필드로 조회
                try:
                    user_center = current_user.center
                    if not user_center:
                        raise HttpError(400, "등록된 센터가 없습니다")
                except AttributeError:
                    raise HttpError(400, "등록된 센터가 없습니다")

            # sequence가 제공되지 않은 경우 자동으로 마지막 순서 + 1로 설정
            sequence = data.sequence
            if not sequence:
                last_question = QuestionForm.objects.filter(
                    center=user_center
                ).order_by('-sequence').first()
                sequence = last_question.sequence + 1 if last_question else 1

            # 질문 폼 생성
            question = QuestionForm.objects.create(
                center=user_center,
                question=data.question,
                type=data.type,
                options=data.options,
                is_required=data.is_required,
                sequence=sequence,
            )

            return _build_question_response(question)

        result = await create_question()
        return 201, result

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"질문 폼 생성 중 오류가 발생했습니다: {str(e)}")


@router.put(
    "/{question_id}",
    summary="[U] 센터 질문 폼 수정",
    description="센터 관리자가 기존 질문 폼을 수정합니다.",
    response={
        200: QuestionFormOut,
        401: ErrorOut,
        403: ErrorOut,
        400: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def update_question_form(request: HttpRequest, question_id: str, data: QuestionFormUpdateIn):
    """질문 폼을 수정합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "인증이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def update_question():
            # 센터 관리자 권한 확인
            if current_user.user_type not in ["센터관리자", "센터최고관리자"]:
                raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")

            # 사용자의 센터 조회 (owner 또는 center 필드로 연결된 센터)
            try:
                # 먼저 owner로 조회 시도
                user_center = Center.objects.get(owner=current_user)
            except Center.DoesNotExist:
                # owner가 아니면 center 필드로 조회
                try:
                    user_center = current_user.center
                    if not user_center:
                        raise HttpError(400, "등록된 센터가 없습니다")
                except AttributeError:
                    raise HttpError(400, "등록된 센터가 없습니다")

            # 질문이 존재하고 사용자의 센터에 속하는지 확인
            try:
                question = QuestionForm.objects.get(
                    id=question_id,
                    center=user_center
                )
            except QuestionForm.DoesNotExist:
                raise HttpError(404, "질문을 찾을 수 없습니다")

            # 업데이트할 데이터 준비
            update_fields = {}
            if data.question is not None:
                update_fields['question'] = data.question
            if data.type is not None:
                update_fields['type'] = data.type
            if data.options is not None:
                update_fields['options'] = data.options
            if data.is_required is not None:
                update_fields['is_required'] = data.is_required
            if data.sequence is not None:
                update_fields['sequence'] = data.sequence

            # 질문 폼 업데이트
            QuestionForm.objects.filter(id=question_id).update(**update_fields)

            # 업데이트된 질문 폼 조회
            updated_question = QuestionForm.objects.get(id=question_id)
            return _build_question_response(updated_question)

        return await update_question()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"질문 폼 수정 중 오류가 발생했습니다: {str(e)}")


@router.patch(
    "/{question_id}/sequence",
    summary="[U] 센터 질문 폼 순서 변경",
    description="센터 관리자가 질문 폼의 순서를 변경합니다.",
    response={
        200: QuestionFormOut,
        401: ErrorOut,
        403: ErrorOut,
        400: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def update_question_sequence(request: HttpRequest, question_id: str, data: QuestionSequenceUpdateIn):
    """질문 폼의 순서를 변경합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "인증이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def update_sequence():
            # 센터 관리자 권한 확인
            if current_user.user_type not in ["센터관리자", "센터최고관리자"]:
                raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")

            # 사용자의 센터 조회 (owner 또는 center 필드로 연결된 센터)
            try:
                # 먼저 owner로 조회 시도
                user_center = Center.objects.get(owner=current_user)
            except Center.DoesNotExist:
                # owner가 아니면 center 필드로 조회
                try:
                    user_center = current_user.center
                    if not user_center:
                        raise HttpError(400, "등록된 센터가 없습니다")
                except AttributeError:
                    raise HttpError(400, "등록된 센터가 없습니다")

            # 질문이 존재하고 사용자의 센터에 속하는지 확인
            try:
                question = QuestionForm.objects.get(
                    id=question_id,
                    center=user_center
                )
            except QuestionForm.DoesNotExist:
                raise HttpError(404, "질문을 찾을 수 없습니다")

            current_sequence = question.sequence
            new_sequence = data.sequence

            # 같은 센터의 다른 질문들과 순서 조정
            all_questions = QuestionForm.objects.filter(
                center=user_center
            ).order_by('sequence')

            # 순서 재배치 로직
            if new_sequence > current_sequence:
                # 뒤로 이동: 중간에 있는 질문들을 앞으로 한 칸씩
                for q in all_questions:
                    if q.id == question_id:
                        continue
                    if current_sequence < q.sequence <= new_sequence:
                        q.sequence -= 1
                        q.save()
            elif new_sequence < current_sequence:
                # 앞으로 이동: 중간에 있는 질문들을 뒤로 한 칸씩
                for q in all_questions:
                    if q.id == question_id:
                        continue
                    if new_sequence <= q.sequence < current_sequence:
                        q.sequence += 1
                        q.save()

            # 대상 질문의 순서 업데이트
            question.sequence = new_sequence
            question.save()

            return _build_question_response(question)

        return await update_sequence()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"질문 폼 순서 변경 중 오류가 발생했습니다: {str(e)}")


@router.delete(
    "/{question_id}",
    summary="[D] 센터 질문 폼 삭제",
    description="센터 관리자가 질문 폼을 삭제합니다.",
    response={
        200: QuestionFormDeleteOut,
        401: ErrorOut,
        403: ErrorOut,
        400: ErrorOut,
        404: ErrorOut,
        500: ErrorOut,
    },
    auth=jwt_auth,
)
async def delete_question_form(request: HttpRequest, question_id: str):
    """질문 폼을 삭제합니다."""
    try:
        # JWT 토큰에서 사용자 정보 추출
        if not hasattr(request, 'auth') or not request.auth:
            raise HttpError(401, "인증이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def delete_question():
            # 센터 관리자 권한 확인
            if current_user.user_type not in ["센터관리자", "센터최고관리자"]:
                raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다")

            # 사용자의 센터 조회 (owner 또는 center 필드로 연결된 센터)
            try:
                # 먼저 owner로 조회 시도
                user_center = Center.objects.get(owner=current_user)
            except Center.DoesNotExist:
                # owner가 아니면 center 필드로 조회
                try:
                    user_center = current_user.center
                    if not user_center:
                        raise HttpError(400, "등록된 센터가 없습니다")
                except AttributeError:
                    raise HttpError(400, "등록된 센터가 없습니다")

            # 질문이 존재하고 사용자의 센터에 속하는지 확인
            try:
                question = QuestionForm.objects.get(
                    id=question_id,
                    center=user_center
                )
            except QuestionForm.DoesNotExist:
                raise HttpError(404, "질문을 찾을 수 없습니다")

            deleted_sequence = question.sequence

            # 질문 삭제
            question.delete()

            # 삭제된 질문 뒤의 순서들을 앞으로 한 칸씩 이동
            questions_to_reorder = QuestionForm.objects.filter(
                center=user_center,
                sequence__gt=deleted_sequence
            )

            for q in questions_to_reorder:
                q.sequence -= 1
                q.save()

            return {"message": "질문 폼이 성공적으로 삭제되었습니다"}

        return await delete_question()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"질문 폼 삭제 중 오류가 발생했습니다: {str(e)}")
