import uuid
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async

from posts.models import Post, PostTag, PostImage
from comments.models import Comment, Reply
from posts.schemas.inbound import (
    PostCreateIn, PostUpdateIn, PostListQueryIn
)
from posts.schemas.outbound import (
    PostOut, PostDetailOut, PostCreateOut, PostUpdateOut, PostDeleteOut
)
from api.security import jwt_auth
from user.models import User


router = Router(tags=["Posts"])


def _build_post_response(post, tags=None, images=None, user_nickname=None, user_image=None):
    """포스트 응답 데이터 구성"""
    return {
        "id": str(post.id),
        "title": post.title,
        "content": post.content,
        "user_id": str(post.user.id),
        "animal_id": str(post.animal.id) if hasattr(post, 'animal') and post.animal else None,
        "adoption_id": str(post.adoption.id) if hasattr(post, 'adoption') and post.adoption else None,
        "content_tags": getattr(post, 'content_tags', None),
        "like_count": 0,  # TODO: 좋아요 기능 구현 시 업데이트
        "comment_count": getattr(post, 'comment_count', 0),
        "created_at": post.created_at,
        "updated_at": post.updated_at,
        "user_nickname": user_nickname or post.user.username,
        "user_image": user_image or getattr(post.user, 'image', None),
        "tags": tags or [],
        "images": images or []
    }


def _build_tag_response(tag):
    """태그 응답 데이터 구성"""
    return {
        "id": str(tag.id),
        "post_id": str(tag.post.id),
        "tag_name": tag.tag_name,
        "created_at": tag.created_at
    }


def _build_image_response(image):
    """이미지 응답 데이터 구성"""
    return {
        "id": str(image.id),
        "post_id": str(image.post.id),
        "image_url": image.image_url,
        "order_index": image.order_index,
        "created_at": image.created_at
    }


# === 게시글 API ===

@router.post(
    "/",
    summary="[C] 게시글 생성",
    description="새로운 게시글을 생성합니다.",
    response={
        201: PostCreateOut,
        400: dict,
        401: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def create_post(request: HttpRequest, data: PostCreateIn):
    """새로운 게시글을 생성합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def create_post_sync():
            # 게시글 생성
            post = Post.objects.create(
                user=current_user,
                title=data.title,
                content=data.content,
                adoption_id=data.adoption_id if data.adoption_id else None
            )

            # 태그 생성
            if data.tags:
                for tag_name in data.tags:
                    PostTag.objects.create(
                        post=post,
                        tag_name=tag_name
                    )

            # 이미지 생성
            if data.images:
                for order_index, image_url in enumerate(data.images):
                    PostImage.objects.create(
                        post=post,
                        image_url=image_url,
                        order_index=order_index
                    )

            return post

        post = await create_post_sync()

        # 응답 데이터 구성
        response_data = {
            "message": "게시글이 생성되었습니다.",
            "community": _build_post_response(post)
        }

        return 201, response_data

    except Exception as e:
        raise HttpError(500, f"게시글 생성 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/",
    summary="[R] 게시글 목록 조회",
    description="게시글 목록을 조회합니다. 시스템 태그로 필터링 시, 사용자 태그가 시스템 태그와 하나라도 매칭되는 글만 표시됩니다.",
    response={
        200: list[PostOut],
        500: dict,
    },
)
@paginate
def get_post_list(request: HttpRequest, query: Query[PostListQueryIn]):
    """게시글 목록을 조회합니다."""
    try:
        posts_query = Post.objects.select_related('user').prefetch_related('posttag_set', 'postimage_set')
        
        if query.user_id:
            posts_query = posts_query.filter(user_id=query.user_id)
        
        # 시스템 태그 필터링 적용 (쿼리 효율 최적화)
        if query.system_tags:
            try:
                from posts.models import SystemTag
                
                system_tag_names = [tag.strip().lower() for tag in query.system_tags if tag.strip()]
                
                if system_tag_names:
                    # 1. 시스템 태그와 매칭되는 활성 태그들을 한 번에 조회 (대소문자 무시)
                    matching_system_tags = SystemTag.objects.filter(
                        is_active=True,
                        name__iregex=r'^(' + '|'.join([tag.replace('(', r'\(').replace(')', r'\)') for tag in system_tag_names]) + ')$'
                    ).values_list('name', flat=True)
                    
                    if matching_system_tags:
                        # 2. 매칭되는 시스템 태그가 있는 포스트를 효율적으로 필터링
                        # 대소문자 구분 없이 매칭
                        posts_query = posts_query.filter(
                            posttag__tag_name__iregex=r'^(' + '|'.join([tag.replace('(', r'\(').replace(')', r'\)') for tag in matching_system_tags]) + ')$'
                        ).distinct()
                    else:
                        # 매칭되는 시스템 태그가 없으면 빈 결과 반환
                        return []
                        
            except Exception as e:
                # iregex가 지원되지 않는 경우 fallback to exact matching
                try:
                    matching_system_tags = SystemTag.objects.filter(
                        is_active=True,
                        name__in=system_tag_names
                    ).values_list('name', flat=True)
                    
                    if matching_system_tags:
                        posts_query = posts_query.filter(
                            posttag__tag_name__in=matching_system_tags
                        ).distinct()
                    else:
                        return []
                        
                except Exception as fallback_e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"시스템 태그 필터링 중 오류 발생: {str(fallback_e)}")
                    # 오류 발생 시 필터링 없이 진행
                    pass
        
        posts = posts_query.order_by('-created_at')
        
        # 대량 조회로 N+1 쿼리 문제 해결
        post_ids = [post.id for post in posts]
        
        # 모든 태그를 한 번에 조회 후 그룹핑
        all_tags = PostTag.objects.filter(post_id__in=post_ids).select_related('post')
        tags_by_post = {}
        for tag in all_tags:
            if tag.post_id not in tags_by_post:
                tags_by_post[tag.post_id] = []
            tags_by_post[tag.post_id].append(tag)
        
        # 모든 이미지를 한 번에 조회 후 그룹핑
        all_images = PostImage.objects.filter(post_id__in=post_ids).order_by('post_id', 'order_index')
        images_by_post = {}
        for image in all_images:
            if image.post_id not in images_by_post:
                images_by_post[image.post_id] = []
            images_by_post[image.post_id].append(image)
        
        # 댓글 수를 한 번에 조회
        from django.db.models import Count
        comment_counts = Comment.objects.filter(post_id__in=post_ids).values('post_id').annotate(count=Count('id'))
        comment_count_by_post = {item['post_id']: item['count'] for item in comment_counts}
        
        posts_with_data = []
        for post in posts:
            tags = tags_by_post.get(post.id, [])
            images = images_by_post.get(post.id, [])
            comment_count = comment_count_by_post.get(post.id, 0)
            
            post_data = _build_post_response(
                post,
                tags=[_build_tag_response(tag) for tag in tags],
                images=[_build_image_response(img) for img in images],
                user_nickname=getattr(post.user, 'nickname', post.user.username),
                user_image=getattr(post.user, 'image', None)
            )
            post_data['comment_count'] = comment_count
            posts_with_data.append(post_data)
        
        return posts_with_data

    except Exception as e:
        raise HttpError(500, f"게시글 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/tags/system",
    summary="[R] 시스템 태그 목록 조회",
    description="최고관리자가 등록한 시스템 태그 목록을 조회합니다.",
    response={
        200: list,
        500: dict,
    },
)
async def get_system_tags(request: HttpRequest):
    """시스템 태그 목록을 조회합니다."""
    try:
        from posts.models import SystemTag
        
        @sync_to_async
        def get_system_tags_sync():
            tags = SystemTag.objects.filter(is_active=True).order_by('name')
            
            tags_data = []
            for tag in tags:
                tags_data.append({
                    "id": str(tag.id),
                    "name": tag.name,
                    "description": tag.description,
                    "usage_count": tag.usage_count,
                    "is_active": tag.is_active,
                    "created_at": tag.created_at.isoformat(),
                    "updated_at": tag.updated_at.isoformat(),
                })
            
            return tags_data
        
        return await get_system_tags_sync()

    except Exception as e:
        raise HttpError(500, f"시스템 태그 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/{post_id}",
    summary="[R] 게시글 상세 조회",
    description="특정 게시글의 상세 정보를 조회합니다.",
    response={
        200: PostDetailOut,
        404: dict,
        500: dict,
    },
)
def get_post_detail(request: HttpRequest, post_id: str):
    """특정 게시글의 상세 정보를 조회합니다."""
    try:
        # 동기 ORM 사용
        try:
            post = Post.objects.select_related('user').get(id=post_id)
        except Post.DoesNotExist:
            raise HttpError(404, "게시글을 찾을 수 없습니다")
        
        # 태그와 이미지 조회
        tags = list(PostTag.objects.filter(post=post))
        images = list(PostImage.objects.filter(post=post).order_by('order_index'))
        
        # 응답 데이터 구성
        post_data = _build_post_response(
            post,
            tags=[_build_tag_response(tag) for tag in tags],
            images=[_build_image_response(img) for img in images],
            user_nickname=getattr(post.user, 'nickname', post.user.username),
            user_image=getattr(post.user, 'image', None)
        )
        
        return {
            "post": post_data,
            "tags": [_build_tag_response(tag) for tag in tags],
            "images": [_build_image_response(img) for img in images]
        }

    except HttpError:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Post detail error: {str(e)}")
        raise HttpError(500, f"게시글 상세 조회 중 오류가 발생했습니다: {str(e)}")


@router.put(
    "/{post_id}",
    summary="[U] 게시글 수정",
    description="게시글을 수정합니다.",
    response={
        200: PostUpdateOut,
        400: dict,
        401: dict,
        403: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def update_post(request: HttpRequest, post_id: str, data: PostUpdateIn):
    """게시글을 수정합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def update_post_sync():
            post = get_object_or_404(Post, id=post_id)
            
            # 권한 확인
            if post.user != current_user:
                raise PermissionError("수정 권한이 없습니다")
            
            # 게시글 업데이트
            if data.title is not None:
                post.title = data.title
            if data.content is not None:
                post.content = data.content
            if data.adoption_id is not None:
                post.adoption_id = data.adoption_id
            
            post.save()
            
            # 태그 업데이트
            if data.tags is not None:
                PostTag.objects.filter(post=post).delete()
                for tag_name in data.tags:
                    PostTag.objects.create(
                        post=post,
                        tag_name=tag_name
                    )
            
            # 이미지 업데이트
            if data.images is not None:
                PostImage.objects.filter(post=post).delete()
                for order_index, image_url in enumerate(data.images):
                    PostImage.objects.create(
                        post=post,
                        image_url=image_url,
                        order_index=order_index
                    )
            
            return post

        await update_post_sync()
        
        return {"message": "게시글이 수정되었습니다"}

    except Post.DoesNotExist:
        raise HttpError(404, "게시글을 찾을 수 없습니다")
    except PermissionError as e:
        raise HttpError(403, str(e))
    except Exception as e:
        raise HttpError(500, f"게시글 수정 중 오류가 발생했습니다: {str(e)}")


@router.delete(
    "/{post_id}",
    summary="[D] 게시글 삭제",
    description="게시글을 삭제합니다.",
    response={
        200: PostDeleteOut,
        401: dict,
        403: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def delete_post(request: HttpRequest, post_id: str):
    """게시글을 삭제합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def delete_post_sync():
            post = get_object_or_404(Post, id=post_id)
            
            # 권한 확인 (작성자 또는 최고관리자)
            if post.user != current_user and current_user.user_type != "최고관리자":
                raise PermissionError("삭제 권한이 없습니다")
            
            post.delete()
            return True

        await delete_post_sync()
        
        return {"message": "게시글이 삭제되었습니다"}

    except Post.DoesNotExist:
        raise HttpError(404, "게시글을 찾을 수 없습니다")
    except PermissionError as e:
        raise HttpError(403, str(e))
    except Exception as e:
        raise HttpError(500, f"게시글 삭제 중 오류가 발생했습니다: {str(e)}")



