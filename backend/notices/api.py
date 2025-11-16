from ninja import Router, Query
from ninja.errors import HttpError
from django.http import HttpRequest
from asgiref.sync import sync_to_async
from django.db.models import Q
from notices.models import SuperadminNotice
from notices.schemas import (
    SuperadminNoticeOut,
    SuperadminNoticeListOut,
    SuperadminNoticeCreateIn,
    SuperadminNoticeUpdateIn,
    SuperadminNoticeAdminListQueryIn,
    MessageOut,
    ErrorOut,
)
from api.security import jwt_auth


router = Router(tags=["Superadmin Notices"])


def _build_notice_out(notice: SuperadminNotice) -> SuperadminNoticeOut:
    return SuperadminNoticeOut(
        id=str(notice.id),
        title=notice.title,
        content=notice.content,
        notice_type=notice.notice_type,
        is_published=notice.is_published,
        is_pinned=notice.is_pinned,
        target_users=notice.target_users,
        view_count=notice.view_count,
        created_at=notice.created_at.isoformat(),
        updated_at=notice.updated_at.isoformat(),
    )


@router.get(
    "/superadmin",
    summary="[R] 최고관리자 공지 목록",
    description="공개된 최고관리자 공지 목록을 최신순으로 조회합니다. (상단 고정 우선)",
    response={200: SuperadminNoticeListOut, 500: ErrorOut},
)
async def list_superadmin_notices(request: HttpRequest):
    try:
        @sync_to_async
        def get_list():
            qs = SuperadminNotice.objects.filter(is_published=True).order_by(
                "-is_pinned", "-created_at"
            )
            return {"notices": [_build_notice_out(n) for n in qs]}

        return await get_list()
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"공지 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/superadmin/admin",
    summary="[R][Admin] 최고관리자 공지 전체 목록",
    description="Django admin에 있는 최고관리자 공지 전부를 필터와 함께 조회합니다. (로그인 필요)",
    response={200: SuperadminNoticeListOut, 401: ErrorOut, 500: ErrorOut},
    auth=jwt_auth,
)
async def list_superadmin_notices_admin(request: HttpRequest, filters: SuperadminNoticeAdminListQueryIn = Query(SuperadminNoticeAdminListQueryIn())):
    try:
        if not hasattr(request, "auth") or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, "__await__"):
            current_user = await current_user

        @sync_to_async
        def get_list():
            qs = SuperadminNotice.objects.all().order_by("-is_pinned", "-created_at")
            if filters.is_published is not None:
                qs = qs.filter(is_published=filters.is_published)
            if filters.is_pinned is not None:
                qs = qs.filter(is_pinned=filters.is_pinned)
            if filters.notice_type:
                qs = qs.filter(notice_type=filters.notice_type)
            if filters.q:
                qs = qs.filter(Q(title__icontains=filters.q) | Q(content__icontains=filters.q))
            if filters.offset:
                qs = qs[filters.offset :]
            if filters.limit is not None:
                qs = qs[: filters.limit]
            return {"notices": [_build_notice_out(n) for n in qs]}

        return await get_list()
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"관리자 공지 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/superadmin/{notice_id}",
    summary="[R] 최고관리자 공지 상세",
    description="특정 최고관리자 공지의 상세를 조회합니다. (공개된 공지만 조회 가능)",
    response={200: SuperadminNoticeOut, 404: ErrorOut, 500: ErrorOut},
)
async def get_superadmin_notice(request: HttpRequest, notice_id: str):
    try:
        @sync_to_async
        def get_detail():
            try:
                notice = SuperadminNotice.objects.get(id=notice_id, is_published=True)
            except SuperadminNotice.DoesNotExist:
                raise HttpError(404, "공지를 찾을 수 없습니다")
            notice.view_count = (notice.view_count or 0) + 1
            notice.save(update_fields=["view_count"])
            return _build_notice_out(notice)

        return await get_detail()
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"공지 상세 조회 중 오류가 발생했습니다: {str(e)}")


@router.post(
    "/superadmin",
    summary="[C] 최고관리자 공지 생성",
    description="최고관리자 공지를 생성합니다. (관리자용)",
    response={201: SuperadminNoticeOut, 400: ErrorOut, 401: ErrorOut, 500: ErrorOut},
    auth=jwt_auth,
)
async def create_superadmin_notice(request: HttpRequest, data: SuperadminNoticeCreateIn):
    try:
        if not hasattr(request, "auth") or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, "__await__"):
            current_user = await current_user

        # 권한 체크가 필요하다면 여기서 추가합니다.
        # if current_user.user_type != "최고관리자":
        #     raise HttpError(403, "관리자 권한이 필요합니다")

        @sync_to_async
        def create():
            notice = SuperadminNotice.objects.create(
                title=data.title,
                content=data.content,
                notice_type=data.notice_type,
                is_published=data.is_published,
                is_pinned=data.is_pinned,
                target_users=data.target_users,
            )
            return _build_notice_out(notice)

        result = await create()
        return 201, result
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"공지 생성 중 오류가 발생했습니다: {str(e)}")


@router.patch(
    "/superadmin/{notice_id}",
    summary="[U] 최고관리자 공지 수정",
    description="최고관리자 공지를 수정합니다. (관리자용)",
    response={200: SuperadminNoticeOut, 400: ErrorOut, 401: ErrorOut, 404: ErrorOut, 500: ErrorOut},
    auth=jwt_auth,
)
async def update_superadmin_notice(request: HttpRequest, notice_id: str, data: SuperadminNoticeUpdateIn):
    try:
        if not hasattr(request, "auth") or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, "__await__"):
            current_user = await current_user

        @sync_to_async
        def update():
            try:
                notice = SuperadminNotice.objects.get(id=notice_id)
            except SuperadminNotice.DoesNotExist:
                raise HttpError(404, "공지를 찾을 수 없습니다")

            if data.title is not None:
                notice.title = data.title
            if data.content is not None:
                notice.content = data.content
            if data.notice_type is not None:
                notice.notice_type = data.notice_type
            if data.is_published is not None:
                notice.is_published = data.is_published
            if data.is_pinned is not None:
                notice.is_pinned = data.is_pinned
            if data.target_users is not None:
                notice.target_users = data.target_users

            notice.save()
            return _build_notice_out(notice)

        return await update()
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"공지 수정 중 오류가 발생했습니다: {str(e)}")


@router.delete(
    "/superadmin/{notice_id}",
    summary="[D] 최고관리자 공지 삭제",
    description="최고관리자 공지를 삭제합니다. (관리자용)",
    response={200: MessageOut, 401: ErrorOut, 404: ErrorOut, 500: ErrorOut},
    auth=jwt_auth,
)
async def delete_superadmin_notice(request: HttpRequest, notice_id: str):
    try:
        if not hasattr(request, "auth") or not request.auth:
            raise HttpError(401, "로그인이 필요합니다")

        current_user = request.auth
        if hasattr(current_user, "__await__"):
            current_user = await current_user

        @sync_to_async
        def delete():
            try:
                notice = SuperadminNotice.objects.get(id=notice_id)
            except SuperadminNotice.DoesNotExist:
                raise HttpError(404, "공지를 찾을 수 없습니다")

            notice.delete()
            return {"message": "삭제되었습니다"}

        return await delete()
    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"공지 삭제 중 오류가 발생했습니다: {str(e)}")


