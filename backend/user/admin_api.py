from ninja import Router, Schema
from ninja.errors import HttpError
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from user.schemas.outbound import UserMeOut, SuccessOut, UserListOut
from user.schemas.inbound import UserCreateIn, UserUpdateIn
from user.models import User
from centers.models import Center
from api.security import jwt_auth
from typing import List

class UserRoleChangeIn(Schema):
    user_type: str

User = get_user_model()
router = Router(tags=["Admin_API"])


@router.get(
    "/center-admins",
    summary="[C] 센터 관리자 목록 조회",
    description="센터 최고관리자가 자신의 센터 관리자들을 조회합니다.",
    response={200: List[UserListOut]},
    auth=jwt_auth,
)
async def get_center_admins(request):
    try:
        current_user = request.auth
        
        # 센터 최고관리자 권한 확인
        if current_user.user_type != User.UserTypeChoice.center_super_admin:
            raise HttpError(403, "센터 최고관리자만 접근할 수 있습니다.")

        # 현재 사용자의 센터 조회 (소유한 센터)
        try:
            center = await Center.objects.aget(owner_id=current_user.id)
        except Center.DoesNotExist:
            raise HttpError(400, "등록된 센터가 없습니다.")

        # 같은 센터의 모든 멤버 조회 (센터 최고관리자 제외)
        center_admins_data = await sync_to_async(list)(
            User.objects.filter(
                center=center,
                user_type__in=[User.UserTypeChoice.center_admin, User.UserTypeChoice.trainer, User.UserTypeChoice.normal]
            ).values(
                'id', 'username', 'email', 'nickname', 'user_type', 'status', 
                'created_at', 'updated_at'
            )
        )

        # 데이터 변환 (UUID, datetime을 문자열로, None을 빈 문자열로)
        result = []
        for admin in center_admins_data:
            result.append({
                'id': str(admin['id']),
                'username': admin['username'],
                'email': admin['email'] or '',
                'nickname': admin['nickname'] or '',
                'user_type': admin['user_type'],
                'status': admin['status'],
                'created_at': admin['created_at'].isoformat() if admin['created_at'] else '',
                'updated_at': admin['updated_at'].isoformat() if admin['updated_at'] else '',
            })

        return result
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, "센터 관리자 목록 조회 중 오류가 발생했습니다.")


@router.post(
    "/center-admin",
    summary="[C] 센터 관리자 생성",
    description="센터 최고관리자가 새 센터 관리자를 생성합니다.",
    response={200: UserMeOut},
    auth=jwt_auth,
)
async def create_center_admin(request, data: UserCreateIn):
    try:
        current_user = request.auth
        
        # 센터 관리자 이상 권한 확인
        if current_user.user_type not in [User.UserTypeChoice.center_admin, User.UserTypeChoice.center_super_admin]:
            raise HttpError(403, "센터 관리자 이상의 권한이 필요합니다.")

        # 현재 사용자의 센터 조회 (소유한 센터)
        try:
            center = await Center.objects.aget(owner_id=current_user.id)
        except Center.DoesNotExist:
            raise HttpError(400, "등록된 센터가 없습니다.")

        # 필수 필드 검증
        if not data.username or not data.password or not data.email:
            raise HttpError(400, "아이디, 비밀번호, 이메일은 필수입니다.")

        # 아이디 중복 체크
        if await User.objects.filter(username=data.username).aexists():
            raise HttpError(400, "이미 사용중인 아이디입니다.")

        # 이메일 중복 체크
        if await User.objects.filter(email=data.email).aexists():
            raise HttpError(400, "이미 사용중인 이메일입니다.")

        # 새 사용자 생성
        user = await sync_to_async(User.objects.create_user)(
            username=data.username,
            password=data.password,
            email=data.email,
            nickname=data.nickname or data.username,
            user_type=data.user_type,
            phone_number=data.phone_number,
        )

        # 센터와 연결
        user.center = center
        await user.asave()

        # 생성된 사용자 정보 반환
        created_user = await User.objects.aget(id=user.id)
        from user.schemas.outbound import UserMeOut
        return UserMeOut.from_user(created_user)
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, "센터 관리자 생성 중 오류가 발생했습니다.")


@router.put(
    "/center-admin/{admin_id}",
    summary="[C] 센터 관리자 정보 수정",
    description="센터 최고관리자가 센터 관리자 정보를 수정합니다.",
    response={200: UserMeOut},
    auth=jwt_auth,
)
async def update_center_admin(request, admin_id: str, data: UserUpdateIn):
    try:
        current_user = request.auth
        
        # 센터 최고관리자 권한 확인
        if current_user.user_type != User.UserTypeChoice.center_super_admin:
            raise HttpError(403, "센터 최고관리자만 접근할 수 있습니다.")

        # 현재 사용자의 센터 조회 (소유한 센터)
        try:
            center = await Center.objects.aget(owner_id=current_user.id)
        except Center.DoesNotExist:
            raise HttpError(400, "등록된 센터가 없습니다.")

        # 대상 사용자 조회 (같은 센터에 속하는지 확인)
        try:
            target_user = await User.objects.aget(id=admin_id, center=center)
        except User.DoesNotExist:
            raise HttpError(404, "수정할 사용자를 찾을 수 없습니다.")

        # 자기 자신 수정 방지
        if str(current_user.id) == admin_id:
            raise HttpError(400, "자기 자신의 정보는 이곳에서 수정할 수 없습니다.")

        # 업데이트할 필드들 (None이 아닌 값만)
        update_fields = {}
        for field, value in data.dict(exclude_unset=True).items():
            if value is not None:
                update_fields[field] = value

        # 사용자 정보 업데이트
        for field, value in update_fields.items():
            setattr(target_user, field, value)
        
        await target_user.asave()
        
        # 업데이트된 사용자 정보 반환
        updated_user = await User.objects.aget(id=admin_id)
        from user.schemas.outbound import UserMeOut
        return UserMeOut.from_user(updated_user)
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, "센터 관리자 정보 수정 중 오류가 발생했습니다.")


@router.delete(
    "/center-admin/{admin_id}",
    summary="[C] 센터 관리자 삭제",
    description="센터 최고관리자가 센터 관리자를 삭제합니다.",
    response={200: SuccessOut},
    auth=jwt_auth,
)
async def delete_center_admin(request, admin_id: str):
    try:
        current_user = request.auth
        
        # 센터 최고관리자 권한 확인
        if current_user.user_type != User.UserTypeChoice.center_super_admin:
            raise HttpError(403, "센터 최고관리자만 접근할 수 있습니다.")

        # 자기 자신 삭제 방지
        if str(current_user.id) == admin_id:
            raise HttpError(400, "자기 자신은 삭제할 수 없습니다.")

        # 현재 사용자의 센터 조회 (소유한 센터)
        try:
            center = await Center.objects.aget(owner_id=current_user.id)
        except Center.DoesNotExist:
            raise HttpError(400, "등록된 센터가 없습니다.")

        # 대상 사용자 조회 (같은 센터에 속하는지 확인)
        try:
            target_user = await User.objects.aget(id=admin_id, center=center)
        except User.DoesNotExist:
            raise HttpError(404, "삭제할 사용자를 찾을 수 없습니다.")

        # 사용자 삭제
        await target_user.adelete()
        
        return {"detail": f"사용자 '{target_user.username}'이(가) 성공적으로 삭제되었습니다."}
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, "센터 관리자 삭제 중 오류가 발생했습니다.")


@router.patch(
    "/center-admin/{admin_id}/change-role",
    summary="[C] 센터 관리자 권한 변경",
    description="센터 최고관리자가 센터 관리자의 권한을 변경합니다.",
    response={200: UserMeOut},
    auth=jwt_auth,
)
async def change_center_admin_role(request, admin_id: str, data: UserRoleChangeIn):
    try:
        current_user = request.auth
        
        # 센터 최고관리자 권한 확인
        if current_user.user_type != User.UserTypeChoice.center_super_admin:
            raise HttpError(403, "센터 최고관리자만 접근할 수 있습니다.")

        # 자기 자신 권한 변경 방지
        if str(current_user.id) == admin_id:
            raise HttpError(400, "자기 자신의 권한은 변경할 수 없습니다.")

        # 유효한 사용자 타입인지 확인
        valid_types = [User.UserTypeChoice.center_admin, User.UserTypeChoice.trainer, User.UserTypeChoice.normal]
        if data.user_type not in valid_types:
            raise HttpError(400, "유효하지 않은 사용자 타입입니다.")

        # 현재 사용자의 센터 조회 (소유한 센터)
        try:
            center = await Center.objects.aget(owner_id=current_user.id)
        except Center.DoesNotExist:
            raise HttpError(400, "등록된 센터가 없습니다.")

        # 대상 사용자 조회 (같은 센터에 속하는지 확인)
        try:
            target_user = await User.objects.aget(id=admin_id, center=center)
        except User.DoesNotExist:
            raise HttpError(404, "권한을 변경할 사용자를 찾을 수 없습니다.")

        # 권한 변경
        target_user.user_type = data.user_type
        await target_user.asave()
        
        # 변경된 사용자 정보 반환
        updated_user = await User.objects.aget(id=admin_id)
        from user.schemas.outbound import UserMeOut
        return UserMeOut.from_user(updated_user)
        
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, "사용자 권한 변경 중 오류가 발생했습니다.")
