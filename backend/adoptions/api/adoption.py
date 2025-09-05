from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
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
from centers.models import AdoptionContractTemplate
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
        
        # 센터의 입양 질문들 조회
        adoption_questions_data = await sync_to_async(list)(
            AdoptionQuestion.objects.filter(
                center=animal.center,
                is_active=True
            ).order_by('sequence').values('id', 'content', 'sequence')
        )
        
        adoption_questions = [
            AdoptionQuestionOut(
                id=str(q['id']),
                content=q['content'],
                sequence=q['sequence']
            ) for q in adoption_questions_data
        ]
        
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
                # AdoptionQuestion 객체 조회
                try:
                    question = await AdoptionQuestion.objects.aget(id=response.question_id)
                    question_response_values.append(
                        AdoptionQuestionResponse(
                            adoption=adoption,
                            question=question,
                            answer=response.answer,
                        )
                    )
                except AdoptionQuestion.DoesNotExist:
                    # 질문이 존재하지 않는 경우 건너뛰기
                    continue
            
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
    description="사용자가 입양 신청을 철회합니다",
    response={200: AdoptionWithdrawOut, 401: dict, 403: dict, 404: dict, 500: dict},
    auth=jwt_auth,
)
async def withdraw_adoption_application(request, adoption_id: str):
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
        
        # 입양 신청 상태를 철회로 변경
        adoption.status = "취소"
        await adoption.asave()
        
        return 200, AdoptionWithdrawOut(
            message="입양 신청이 성공적으로 철회되었습니다",
            adoption_id=adoption_id,
            status="취소"
        )
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"입양 신청 철회 중 오류가 발생했습니다: {str(e)}")
