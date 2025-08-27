import uuid
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.errors import HttpError
from asgiref.sync import sync_to_async

from comments.models import Comment, Reply
from comments.schemas.inbound import (
    ReplyCreateIn, ReplyUpdateIn
)
from comments.schemas.outbound import (
    ReplyCreateOut, ReplyUpdateOut, ReplyDeleteOut
)
from api.security import jwt_auth
from user.models import User


router = Router(tags=["Replies"])


# === 대댓글 API ===

@router.post(
    "/{comment_id}/replies",
    summary="[C] 대댓글 생성",
    description="댓글에 대댓글을 작성합니다.",
    response={
        200: ReplyCreateOut,
        400: dict,
        401: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def create_reply(request: HttpRequest, comment_id: str, data: ReplyCreateIn):
    """댓글에 대댓글을 작성합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def create_reply_sync():
            # 댓글 존재 확인
            comment = get_object_or_404(Comment, id=comment_id)
            
            # 대댓글 생성
            reply = Reply.objects.create(
                comment=comment,
                user=current_user,
                content=data.content
            )
            
            return reply

        reply = await create_reply_sync()
        
        # 새로운 대댓글 알림 전송
        try:
            from notifications.utils import notify_new_reply
            await notify_new_reply(str(reply.id))
        except Exception as e:
            # 알림 전송 실패는 로그만 남기고 API 응답에는 영향 주지 않음
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"대댓글 알림 전송 실패: {e}")
        
        return {
            "message": "대댓글이 작성되었습니다",
            "reply_id": str(reply.id)
        }

    except Comment.DoesNotExist:
        raise HttpError(404, "댓글을 찾을 수 없습니다")
    except Exception as e:
        raise HttpError(500, f"대댓글 생성 중 오류가 발생했습니다: {str(e)}")


@router.put(
    "/{reply_id}",
    summary="[U] 대댓글 수정",
    description="대댓글을 수정합니다.",
    response={
        200: ReplyUpdateOut,
        400: dict,
        401: dict,
        403: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def update_reply(request: HttpRequest, reply_id: str, data: ReplyUpdateIn):
    """대댓글을 수정합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def update_reply_sync():
            reply = get_object_or_404(Reply, id=reply_id)
            
            # 권한 확인
            if reply.user != current_user:
                raise PermissionError("수정 권한이 없습니다")
            
            reply.content = data.content
            reply.save()
            return reply

        await update_reply_sync()
        
        return {"message": "대댓글이 수정되었습니다"}

    except Reply.DoesNotExist:
        raise HttpError(404, "대댓글을 찾을 수 없습니다")
    except PermissionError as e:
        raise HttpError(403, str(e))
    except Exception as e:
        raise HttpError(500, f"대댓글 수정 중 오류가 발생했습니다: {str(e)}")


@router.delete(
    "/{reply_id}",
    summary="[D] 대댓글 삭제",
    description="대댓글을 삭제합니다.",
    response={
        200: ReplyDeleteOut,
        401: dict,
        403: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def delete_reply(request: HttpRequest, reply_id: str):
    """대댓글을 삭제합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def delete_reply_sync():
            reply = get_object_or_404(Reply, id=reply_id)
            
            # 권한 확인 (작성자 또는 최고관리자)
            if reply.user != current_user and current_user.user_type != "최고관리자":
                raise PermissionError("삭제 권한이 없습니다")
            
            reply.delete()
            return True

        await delete_reply_sync()
        
        return {"message": "대댓글이 삭제되었습니다"}

    except Reply.DoesNotExist:
        raise HttpError(404, "대댓글을 찾을 수 없습니다")
    except PermissionError as e:
        raise HttpError(403, str(e))
    except Exception as e:
        raise HttpError(500, f"대댓글 삭제 중 오류가 발생했습니다: {str(e)}")
