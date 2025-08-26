import uuid
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async

from comments.models import Comment, Reply
from posts.models import Post
from comments.schemas.inbound import (
    CommentCreateIn, CommentUpdateIn
)
from comments.schemas.outbound import (
    CommentOut, CommentCreateOut, CommentUpdateOut, CommentDeleteOut
)
from api.security import jwt_auth


router = Router(tags=["Comments"])


def _build_comment_response(comment, replies=None, user_info=None):
    """댓글 응답 데이터 구성"""
    return {
        "id": str(comment.id),
        "post_id": str(comment.post.id),
        "user_id": str(comment.user.id),
        "content": comment.content,
        "like_count": 0,  # TODO: 좋아요 기능 구현 시 업데이트
        "replies": replies or [],
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "user": user_info
    }


def _build_reply_response(reply):
    """대댓글 응답 데이터 구성"""
    return {
        "id": str(reply.id),
        "comment_id": str(reply.comment.id),
        "user_id": str(reply.user.id),
        "content": reply.content,
        "created_at": reply.created_at,
        "updated_at": reply.updated_at
    }


def _build_user_info(user):
    """사용자 정보 구성"""
    if not user:
        return None
    return {
        "id": str(user.id),
        "nickname": getattr(user, 'nickname', None),
        "image": getattr(user, 'image', None)
    }


# === 댓글 API ===

@router.post(
    "/{post_id}/comments",
    summary="[C] 댓글 생성",
    description="게시글에 댓글을 작성합니다.",
    response={
        200: CommentCreateOut,
        400: dict,
        401: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def create_comment(request: HttpRequest, post_id: str, data: CommentCreateIn):
    """게시글에 댓글을 작성합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def create_comment_sync():
            # 게시글 존재 확인
            post = get_object_or_404(Post, id=post_id)
            
            # 댓글 생성
            comment = Comment.objects.create(
                post=post,
                user=current_user,
                content=data.content
            )
            
            return comment

        comment = await create_comment_sync()
        
        # 새로운 댓글 알림 전송
        try:
            from notifications.utils import notify_new_comment
            await notify_new_comment(str(comment.id))
        except Exception as e:
            # 알림 전송 실패는 로그만 남기고 API 응답에는 영향 주지 않음
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"댓글 알림 전송 실패: {e}")
        
        return {
            "message": "댓글이 작성되었습니다",
            "comment_id": str(comment.id)
        }

    except Post.DoesNotExist:
        raise HttpError(404, "게시글을 찾을 수 없습니다")
    except Exception as e:
        raise HttpError(500, f"댓글 생성 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/{post_id}/comments",
    summary="[R] 댓글 목록 조회",
    description="게시글의 댓글 목록을 조회합니다.",
    response={
        200: list[CommentOut],
        404: dict,
        500: dict,
    },
)
@paginate
def get_comments(request: HttpRequest, post_id: str):
    """게시글의 댓글 목록을 조회합니다."""
    try:
        # 게시글 존재 확인
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            raise HttpError(404, "게시글을 찾을 수 없습니다")
        
        # 댓글 조회
        comments = Comment.objects.filter(post=post).select_related('user').prefetch_related('reply_set').order_by('-created_at')
        
        comments_with_replies = []
        for comment in comments:
            # 대댓글 조회
            replies = Reply.objects.filter(comment=comment).select_related('user').order_by('created_at')
            
            comment_data = _build_comment_response(
                comment,
                replies=[_build_reply_response(reply) for reply in replies],
                user_info=_build_user_info(comment.user)
            )
            comments_with_replies.append(comment_data)
        
        return comments_with_replies

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"댓글 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.put(
    "/{comment_id}",
    summary="[U] 댓글 수정",
    description="댓글을 수정합니다.",
    response={
        200: CommentUpdateOut,
        400: dict,
        401: dict,
        403: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def update_comment(request: HttpRequest, comment_id: str, data: CommentUpdateIn):
    """댓글을 수정합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def update_comment_sync():
            comment = get_object_or_404(Comment, id=comment_id)
            
            # 권한 확인
            if comment.user != current_user:
                raise PermissionError("수정 권한이 없습니다")
            
            comment.content = data.content
            comment.save()
            return comment

        await update_comment_sync()
        
        return {"message": "댓글이 수정되었습니다"}

    except Comment.DoesNotExist:
        raise HttpError(404, "댓글을 찾을 수 없습니다")
    except PermissionError as e:
        raise HttpError(403, str(e))
    except Exception as e:
        raise HttpError(500, f"댓글 수정 중 오류가 발생했습니다: {str(e)}")


@router.delete(
    "/{comment_id}",
    summary="[D] 댓글 삭제",
    description="댓글을 삭제합니다.",
    response={
        200: CommentDeleteOut,
        401: dict,
        403: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def delete_comment(request: HttpRequest, comment_id: str):
    """댓글을 삭제합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def delete_comment_sync():
            comment = get_object_or_404(Comment, id=comment_id)
            
            # 권한 확인 (작성자 또는 최고관리자)
            if comment.user != current_user and current_user.user_type != "최고관리자":
                raise PermissionError("삭제 권한이 없습니다")
            
            comment.delete()
            return True

        await delete_comment_sync()
        
        return {"message": "댓글이 삭제되었습니다"}

    except Comment.DoesNotExist:
        raise HttpError(404, "댓글을 찾을 수 없습니다")
    except PermissionError as e:
        raise HttpError(403, str(e))
    except Exception as e:
        raise HttpError(500, f"댓글 삭제 중 오류가 발생했습니다: {str(e)}")
