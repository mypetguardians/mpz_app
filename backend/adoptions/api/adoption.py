from ninja import Router, Query
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from django.conf import settings
import json
import httpx
from adoptions.schemas.inbound import (
    AdoptionApplicationIn
)
from adoptions.schemas.outbound import (
    AdoptionPreCheckOut, AdoptionApplicationOut, 
    AnimalInfoOut, CenterInfoOut, ContractTemplateOut,
    UserSettingsOut, AdoptionQuestionOut, AdoptionWithdrawOut
)
from adoptions.models import (
    Adoption, AdoptionQuestion, AdoptionQuestionResponse
)
from user.models import User
from animals.models import Animal
from centers.models import AdoptionContractTemplate, QuestionForm
from api.security import jwt_auth

router = Router(tags=["Adoption"])


@router.get(
    "/pre-check/{animal_id}",
    summary="[C] 입양 신청 사전 확인",
    description="입양 신청 가능 여부 및 필요한 정보들을 확인합니다",
    response={200: AdoptionPreCheckOut, 401: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def get_adoption_pre_check(request, animal_id: str):
    try:
        current_user = request.auth
        
        # 일반사용자 권한 확인
        if current_user.user_type != User.UserTypeChoice.normal:
            raise HttpError(403, "일반사용자만 입양 신청이 가능합니다")
        
        # 동물 정보 조회 (센터 정보와 함께)
        try:
            animal = await Animal.objects.select_related('center').aget(id=animal_id)
        except Animal.DoesNotExist:
            raise HttpError(404, "동물을 찾을 수 없습니다")
        
        if not animal.center:
            raise HttpError(404, "센터 정보를 찾을 수 없습니다")
        
        # 입양 가능한 상태인지 확인 (보호중이고 입양가능한 동물만 입양 신청 가능)
        can_apply = animal.protection_status == "보호중" and animal.adoption_status == "입양가능"
        
        # 이미 입양 신청을 했는지 확인
        existing_application_count = await Adoption.objects.filter(
            user_id=current_user.id,
            animal_id=animal_id,
            status__in=["신청", "미팅", "계약서작성", "입양완료", "모니터링"]
        ).acount()
        
        existing_application = existing_application_count > 0
        
        # 현재 사용자 정보 조회 (전화번호 인증 상태 포함)
        is_phone_verified = current_user.is_phone_verified
        
        # 사용자 설정 정보 조회 (전화번호가 인증된 경우에만)
        user_settings_data = None
        needs_user_settings = True
        
        if is_phone_verified:
            # User 모델에 이미 필요한 필드들이 있으므로 직접 사용
            user_settings_data = UserSettingsOut(
                phone=current_user.phone_number or "",
                phone_verification=True,
                name=current_user.nickname or "",
                birth=getattr(current_user, 'birth', "") or "",
                address=getattr(current_user, 'address', "") or "",
                address_is_public=getattr(current_user, 'address_is_public', False),
            )
            
            # 필수 정보가 모두 있는지 확인
            needs_user_settings = not (
                user_settings_data.name and 
                user_settings_data.birth and 
                user_settings_data.address
            )
        
        # 센터의 입양 질문들 조회 (AdoptionQuestion과 QuestionForm 모두)
        adoption_questions = []
        
        # 1. AdoptionQuestion에서 조회
        adoption_questions_data = await sync_to_async(list)(
            AdoptionQuestion.objects.filter(
                center=animal.center,
                is_active=True
            ).order_by('sequence').values('id', 'content', 'sequence')
        )
        
        for q in adoption_questions_data:
            adoption_questions.append(
                AdoptionQuestionOut(
                    id=str(q['id']),
                    content=q['content'],
                    sequence=q['sequence']
                )
            )
        
        # 2. QuestionForm에서도 조회 (AdoptionQuestion에 없는 것들)
        question_forms_data = await sync_to_async(list)(
            QuestionForm.objects.filter(
                center=animal.center
            ).order_by('sequence').values('id', 'question', 'sequence')
        )
        
        # 이미 AdoptionQuestion으로 변환된 것들을 제외
        existing_contents = {q['content'] for q in adoption_questions_data}
        
        for q in question_forms_data:
            if q['question'] not in existing_contents:
                adoption_questions.append(
                    AdoptionQuestionOut(
                        id=str(q['id']),
                        content=q['question'],
                        sequence=q['sequence']
                    )
                )
        
        # 순서대로 정렬
        adoption_questions.sort(key=lambda x: x.sequence)
        
        # 센터의 계약서 템플릿 조회
        try:
            contract_template = await AdoptionContractTemplate.objects.filter(
                center=animal.center,
                is_active=True
            ).afirst()
        except:
            contract_template = None
        
        response_data = AdoptionPreCheckOut(
            can_apply=can_apply and not existing_application,
            is_phone_verified=is_phone_verified,
            needs_user_settings=needs_user_settings,
            animal=AnimalInfoOut(
                id=str(animal.id),
                name=animal.name,
                protection_status=animal.protection_status,
                adoption_status=animal.adoption_status,
                center_id=str(animal.center.id),
                center_name=animal.center.name,
            ),
            user_settings=user_settings_data,
            adoption_questions=adoption_questions,
            center_info=CenterInfoOut(
                has_monitoring=getattr(animal.center, 'has_monitoring', False),
                monitoring_description=getattr(animal.center, 'monitoring_description', None),
                adoption_guidelines=getattr(animal.center, 'adoption_guidelines', None),
                adoption_price=getattr(animal.center, 'adoption_price', 0),
            ),
            contract_template=ContractTemplateOut(
                id=str(contract_template.id),
                title=contract_template.title,
                content=contract_template.content,
            ) if contract_template else None,
            existing_application=existing_application,
        )
        
        return response_data
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Get adoption pre-check error: {e}")
        raise HttpError(500, "입양 신청 사전 확인 중 오류가 발생했습니다")


@router.post(
    "/apply",
    summary="[C] 입양 신청 제출",
    description="동물에 대한 입양 신청을 제출합니다",
    response={201: AdoptionApplicationOut, 400: dict, 401: dict, 403: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def submit_adoption_application(request, data: AdoptionApplicationIn):
    try:
        current_user = request.auth
        
        # 일반사용자 권한 확인
        if current_user.user_type != User.UserTypeChoice.normal:
            raise HttpError(403, "일반사용자만 입양 신청이 가능합니다")
        
        # 현재 사용자의 전화번호 인증 상태 확인 (임시 주석 처리)
        # if not current_user.is_phone_verified:
        #     raise HttpError(403, "전화번호 인증이 필요합니다")
        
        # 동물 정보 조회
        try:
            animal = await Animal.objects.select_related('center').aget(id=data.animal_id)
        except Animal.DoesNotExist:
            raise HttpError(404, "동물을 찾을 수 없습니다")
        
        if not animal.center:
            raise HttpError(404, "센터 정보를 찾을 수 없습니다")
        
        # 입양 가능한 상태인지 확인 (보호중이고 입양가능한 동물만 입양 신청 가능)
        if animal.protection_status != "보호중" or animal.adoption_status != "입양가능":
            raise HttpError(403, "현재 입양 신청이 불가능한 동물입니다")
        
        # 이미 입양 신청을 했는지 확인 (취소되지 않은 신청)
        existing_application_count = await Adoption.objects.filter(
            user_id=current_user.id,
            animal_id=data.animal_id,
            status__in=["신청", "미팅", "계약서작성", "입양완료", "모니터링"]
        ).acount()
        
        if existing_application_count > 0:
            raise HttpError(403, "이미 해당 동물에 대한 입양 신청을 하셨습니다")
        
        # 사용자 설정 저장 또는 업데이트 (필요한 경우만)
        if data.user_settings:
            # User 모델에 직접 업데이트
            update_fields = {}
            if data.user_settings.name:
                update_fields['nickname'] = data.user_settings.name
            if data.user_settings.birth:
                update_fields['birth'] = data.user_settings.birth
            if data.user_settings.address:
                update_fields['address'] = data.user_settings.address
            if hasattr(current_user, 'address_is_public'):
                update_fields['address_is_public'] = data.user_settings.address_is_public
            
            if update_fields:
                await User.objects.filter(id=current_user.id).aupdate(**update_fields)
        
        # 입양 신청 생성
        adoption = await Adoption.objects.acreate(
            user=current_user,
            animal=animal,
            notes=data.notes,
            monitoring_agreement=data.monitoring_agreement,
            guidelines_agreement=data.guidelines_agreement,
            is_temporary_protection=data.is_temporary_protection,
        )
        
        # 질문 응답 저장
        if data.question_responses:
            question_response_values = []
            for response in data.question_responses:
                # QuestionForm ID를 그대로 사용해서 질문 내용을 저장
                question_content = ""
                question_sequence = 0
                
                try:
                    # 1. AdoptionQuestion에서 찾기
                    adoption_question = await AdoptionQuestion.objects.aget(id=response.question_id)
                    question_content = adoption_question.content
                    question_sequence = adoption_question.sequence
                    
                except AdoptionQuestion.DoesNotExist:
                    try:
                        # 2. QuestionForm에서 찾기
                        question_form = await QuestionForm.objects.aget(id=response.question_id)
                        question_content = question_form.question
                        question_sequence = question_form.sequence
                        
                    except QuestionForm.DoesNotExist:
                        # 질문이 존재하지 않는 경우 건너뛰기
                        continue
                    except Exception as e:
                        # 기타 오류 발생 시 건너뛰기
                        print(f"QuestionForm 조회 오류: {e}")
                        continue
                except Exception as e:
                    # 기타 오류 발생 시 건너뛰기
                    print(f"AdoptionQuestion 조회 오류: {e}")
                    continue
                
                if question_content:
                    # QuestionForm ID를 원본 질문 ID로 저장할 수 있도록 질문 생성/조회
                    question, created = await AdoptionQuestion.objects.aget_or_create(
                        id=response.question_id,  # 원본 QuestionForm ID 사용
                        defaults={
                            'center': animal.center,
                            'content': question_content,
                            'sequence': question_sequence,
                            'is_active': True
                        }
                    )
                    
                    question_response_values.append(
                        AdoptionQuestionResponse(
                            adoption=adoption,
                            question=question,
                            answer=response.answer,
                        )
                    )
            
            if question_response_values:
                await AdoptionQuestionResponse.objects.abulk_create(question_response_values)
        
        # 입양 신청 완료 알림 전송 (사용자에게)
        try:
            from notifications.utils import send_adoption_update_notification
            await send_adoption_update_notification(
                user_id=str(current_user.id),
                adoption_status="신청완료",
                animal_name=animal.name,
                adoption_id=str(adoption.id)
            )
        except Exception as e:
            # 알림 전송 실패는 로그만 남기고 API 응답에는 영향 주지 않음
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"사용자 알림 전송 실패: {e}")
        
        # 센터 관리자들에게 새로운 입양 신청 알림 전송
        try:
            from notifications.utils import notify_new_adoption_application
            await notify_new_adoption_application(str(adoption.id))
        except Exception as e:
            # 알림 전송 실패는 로그만 남기고 API 응답에는 영향 주지 않음
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"센터 관리자 알림 전송 실패: {e}")
        
        return 201, AdoptionApplicationOut(
            id=str(adoption.id),
            animal_id=str(animal.id),
            animal_name=animal.name,
            center_name=animal.center.name,
            status="신청",
            notes=data.notes,
            created_at=adoption.created_at.isoformat(),
            updated_at=adoption.updated_at.isoformat()
        )
        
    except HttpError:
        raise
    except Exception as e:
        print(f"Submit adoption application error: {e}")
        raise HttpError(500, "입양 신청 제출 중 오류가 발생했습니다")


@router.delete(
    "/{adoption_id}/withdraw",
    summary="[D] 입양 신청 철회",
    description="사용자가 입양 신청을 철회합니다. reason 쿼리로 철회 사유를 전달할 수 있습니다.",
    response={200: AdoptionWithdrawOut, 401: dict, 403: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def withdraw_adoption_application(request, adoption_id: str, reason: str = Query(default=None, description="철회 사유")):
    """입양 신청을 철회합니다."""
    try:
        current_user = request.auth
        
        # 입양 신청 조회 (user와 animal, center 모두 함께 조회)
        try:
            adoption = await Adoption.objects.select_related('user', 'animal', 'animal__center').aget(id=adoption_id)
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")
        
        # 본인의 입양 신청인지 확인
        if str(adoption.user.id) != str(current_user.id):
            raise HttpError(403, "본인의 입양 신청만 철회할 수 있습니다")
        
        # 철회 가능한 상태인지 확인 (신청, 미팅, 계약서작성 상태만 철회 가능)
        if adoption.status not in ["신청", "미팅", "계약서작성"]:
            raise HttpError(400, f"현재 상태({adoption.status})에서는 철회할 수 없습니다")
        
        # 철회 사유 저장 (선택)
        try:
            if reason:
                adoption.user_memo = reason
                await adoption.asave(update_fields=['user_memo'])
        except Exception:
            # 사유 저장 실패는 철회 자체에는 영향 주지 않음
            pass
        
        # 입양 신청 상태를 철회로 변경
        adoption.status = "취소"
        await adoption.asave(update_fields=['status'])
        
        return 200, AdoptionWithdrawOut(
            message="입양 신청이 성공적으로 철회되었습니다",
            adoption_id=adoption_id,
            status="취소"
        )
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"입양 신청 철회 중 오류가 발생했습니다: {str(e)}")


# -------------------- 왙싸인 연동 (기본 골격) --------------------
@router.post(
    "/contracts/wattsign/send",
    summary="[C] 왙싸인 문서 생성 및 참여자 링크 발급",
    description="adoptionId 기반으로 계약 정보를 구성해 왙싸인 문서를 생성하고 참여자 서명 URL을 반환합니다.",
    response={200: dict, 400: dict, 500: dict},
    auth=jwt_auth,
)
async def send_wattsign_contract(request, payload: dict):
    """
    프론트에서 adoptionId를 받아 우리 DB로 계약 정보를 조회/구성한 뒤
    왙싸인 API를 호출해 문서를 생성하고 참여자 서명 URL을 반환합니다.
    """
    try:
        adoption_id = payload.get("adoptionId")
        if not adoption_id:
            raise HttpError(400, "adoptionId is required")

        # 필수 설정 확인
        api_key = getattr(settings, "WATTSIGN_API_KEY", None)
        if not api_key:
            raise HttpError(500, "WATTSIGN_API_KEY가 서버 환경에 설정되어 있지 않습니다.")

        try:
            adoption = await (Adoption.objects
                              .select_related('user', 'animal', 'animal__center')
                              .aget(id=adoption_id))
        except Adoption.DoesNotExist:
            raise HttpError(404, "입양 신청을 찾을 수 없습니다")

        adopter = adoption.user
        animal = adoption.animal
        center = getattr(animal, "center", None)

        if not adopter or not adopter.email:
            raise HttpError(400, "입양 신청자의 이메일이 없습니다. 이메일이 필요합니다.")
        if not center:
            raise HttpError(400, "센터 정보를 찾을 수 없습니다.")

        # 센터 이메일 확보 (모델에 없다면 환경변수의 기본 이메일 사용)
        center_email = getattr(center, "email", None) or getattr(settings, "DEFAULT_CENTER_EMAIL", None)
        if not center_email:
            raise HttpError(400, "센터 이메일이 없습니다. DEFAULT_CENTER_EMAIL 설정이 필요합니다.")

        # 활성 템플릿 조회 (없으면 간단 본문 사용)
        template = await AdoptionContractTemplate.objects.filter(center=center, is_active=True).afirst()
        contract_title = getattr(template, "title", None) or f"입양 계약서 - {animal.name}"
        contract_content = getattr(template, "content", None) or f"{animal.name} 입양 계약서입니다."

        # 프론트에서 넘어온 템플릿 ID 우선 사용, 없으면 서버 기본값 사용
        provided_template_id = payload.get("templateId")
        template_id_to_use = provided_template_id or getattr(settings, "WATTSIGN_TEMPLATE_ID", None)

        # 2) 왙싸인 API 호출 - 문서 생성
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        base_participants = [
            {
                "role": "signer",
                "name": getattr(adopter, "nickname", None) or getattr(adopter, "username", "") or "입양자",
                "email": adopter.email,
            },
            {
                "role": "counterparty",
                "name": getattr(center, "name", "센터"),
                "email": center_email,
            },
        ]
        if template_id_to_use:
            body = {
                "title": contract_title,
                "templateId": template_id_to_use,
                "participants": base_participants,
                # "variables": {"animalName": animal.name},
                # "webhookUrl": getattr(settings, "WATTSIGN_WEBHOOK_URL", None),
            }
        else:
            body = {
                "title": contract_title,
                "content": contract_content,
                "participants": base_participants,
                # "webhookUrl": getattr(settings, "WATTSIGN_WEBHOOK_URL", None),
            }

        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(
                "https://api.wattsign.com/v1/documents",
                headers=headers,
                json=body,
            )
        try:
            res.raise_for_status()
        except httpx.HTTPStatusError as e:
            # 왙싸인 측 에러 메시지 전달
            try:
                err_json = res.json()
            except Exception:
                err_json = {"message": res.text}
            raise HttpError(res.status_code, f"왙싸인 문서 생성 실패: {err_json}")

        data = res.json()

        # 3) 응답에서 참여자 서명 URL 추출
        participants = data.get("participants") or []
        redirect_url = None
        for p in participants:
            if p.get("role") in ("signer", "adopter", "user"):
                redirect_url = p.get("signUrl") or p.get("sign_url") or None
                if redirect_url:
                    break
        if not redirect_url and participants:
            redirect_url = participants[0].get("signUrl") or participants[0].get("sign_url") or None
        if not redirect_url:
            raise HttpError(502, "왙싸인 서명 링크 생성 실패")

        return {"redirectUrl": redirect_url}
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"왙싸인 문서 생성 중 오류가 발생했습니다: {str(e)}")


@router.post(
    "/contracts/wattsign/webhook",
    summary="[S] 왙싸인 웹훅 수신",
    description="서명/체결 이벤트를 수신하여 우리 시스템 상태를 갱신합니다.",
    response={200: dict},
)
async def wattsign_webhook(request):
    try:
        # TODO: 필요 시 시그니처 검증
        # 이벤트 페이로드 파싱
        try:
            body_unicode = request.body.decode("utf-8")
            event = json.loads(body_unicode) if body_unicode else {}
        except Exception:
            event = {}

        # TODO: event['type'] 등에 따라 Adoption 상태 갱신
        # 예: 서명 완료 시 "계약서작성" -> "입양완료" 혹은 다음 단계
        return {"ok": True}
    except Exception:
        # 웹훅은 200 응답이 중요하므로 에러를 삼키지 않음
        return {"ok": False}
