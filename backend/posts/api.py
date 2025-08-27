import uuid
import jwt
from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from django.conf import settings
from ninja import Router, Query
from ninja.errors import HttpError
from ninja.pagination import paginate
from asgiref.sync import sync_to_async

from posts.models import Post, PostTag, PostImage, PostLike
from comments.models import Comment, Reply
from posts.schemas.inbound import (
    PostCreateIn, PostUpdateIn, PostListQueryIn
)
from posts.schemas.outbound import (
    PostOut, PostDetailOut, PostCreateOut, PostUpdateOut, PostDeleteOut
)
from api.security import jwt_auth
from user.models import User
from posts.models import SystemTag
from django.db import models


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
        "like_count": getattr(post, 'like_count', 0),
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
        "tag_name": tag.tag_name,
        "created_at": tag.created_at
    }


def _build_image_response(image):
    """이미지 응답 데이터 구성"""
    return {
        "id": str(image.id),
        "image_url": image.image_url,
        "order_index": image.order_index,
        "created_at": image.created_at
    }


# === 전체 공개 게시글 API (인증 불필요) ===

@router.get(
    "/all/",
    summary="[R] 전체 공개 게시글 목록 조회",
    description="전체 공개 게시글 목록을 조회합니다. 인증이 필요하지 않습니다.",
    response={
        200: list[PostOut],
        500: dict,
    },
)
@paginate
async def get_all_public_posts(request: HttpRequest, query: Query[PostListQueryIn]):
    """전체 공개 게시글 목록을 조회합니다."""
    try:
        @sync_to_async
        def get_public_posts():
            posts_query = Post.objects.filter(is_all_access=True).select_related('user').prefetch_related('posttag_set', 'postimage_set')
            
            # 필터링 적용
            if query.user_id:
                posts_query = posts_query.filter(user_id=query.user_id)
            
            # 시스템 태그 필터링 적용
            if query.system_tags:
                try:
                    from posts.models import SystemTag
                    
                    system_tag_names = [tag.strip().lower() for tag in query.system_tags if tag.strip()]
                    
                    if system_tag_names:
                        # 정규식 기반 매칭 시도
                        try:
                            matching_system_tags = SystemTag.objects.filter(
                                is_active=True,
                                name__iregex='|'.join(system_tag_names)
                            ).values_list('name', flat=True)
                            
                            if matching_system_tags:
                                posts_query = posts_query.filter(
                                    posttag__tag_name__in=matching_system_tags
                                ).distinct()
                            else:
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
                
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"시스템 태그 필터링 중 오류 발생: {str(e)}")
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
                post_data['is_liked'] = False  # 전체 공개는 좋아요 상태 미제공
                post_data['is_all_access'] = post.is_all_access
                posts_with_data.append(post_data)
            
            return posts_with_data
        
        return await get_public_posts()
        
    except Exception as e:
        raise HttpError(500, f"전체 공개 게시글 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/all/{post_id}",
    summary="[R] 전체 공개 게시글 상세 조회",
    description="전체 공개 게시글의 상세 정보를 조회합니다. 인증이 필요하지 않습니다.",
    response={
        200: PostDetailOut,
        403: dict,
        404: dict,
        500: dict,
    },
)
async def get_all_public_post_detail(request: HttpRequest, post_id: str):
    """전체 공개 게시글 상세 정보를 조회합니다."""
    try:
        @sync_to_async
        def get_public_post_detail():
            try:
                post = Post.objects.select_related('user').get(id=post_id, is_all_access=True)
            except Post.DoesNotExist:
                return None, None, None
            
            # 태그와 이미지 조회
            tags = list(PostTag.objects.filter(post=post))
            images = list(PostImage.objects.filter(post=post).order_by('order_index'))
            
            return post, tags, images
        
        result = await get_public_post_detail()
        if result[0] is None:
            raise HttpError(404, "전체 공개 게시글을 찾을 수 없습니다")
        
        post, tags, images = result
        
        # 응답 데이터 구성
        @sync_to_async
        def build_post_response():
            return _build_post_response(
                post,
                tags=[_build_tag_response(tag) for tag in tags],
                images=[_build_image_response(img) for img in images],
                user_nickname=getattr(post.user, 'nickname', post.user.username),
                user_image=getattr(post.user, 'image', None)
            )
        
        post_data = await build_post_response()
        post_data['is_liked'] = False  # 전체 공개는 좋아요 상태 미제공
        post_data['is_all_access'] = post.is_all_access
        
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
        logger.error(f"전체 공개 게시글 상세 조회 오류: {str(e)}")
        raise HttpError(500, f"전체 공개 게시글 상세 조회 중 오류가 발생했습니다: {str(e)}")


# === 센터 권한자용 게시글 API (인증 필요) ===

@router.get(
    "/center/",
    summary="[R] 센터 권한자용 게시글 목록 조회",
    description="센터 권한자와 본인 게시글 목록을 조회합니다. 인증이 필요합니다.",
    response={
        200: list[PostOut],
        401: dict,
        500: dict,
    },
    auth=jwt_auth,
)
@paginate
async def get_center_posts(request: HttpRequest, query: Query[PostListQueryIn]):
    """센터 권한자용 게시글 목록을 조회합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user
        
        @sync_to_async
        def get_center_posts_list():
            # 센터 권한자와 본인 게시글 조회
            posts_query = Post.objects.select_related('user').prefetch_related('posttag_set', 'postimage_set').filter(
                models.Q(is_all_access=True) |  # 전체 공개
                models.Q(user=current_user) |   # 본인 글
                models.Q(user__user_type__in=['센터관리자', '최고관리자'])  # 센터 권한자 글
            )
            
            # 필터링 적용
            if query.user_id:
                posts_query = posts_query.filter(user_id=query.user_id)
            
            # is_all_access 필터 적용
            if query.is_all_access is not None:
                posts_query = posts_query.filter(is_all_access=query.is_all_access)
            
            # 시스템 태그 필터링 적용
            if query.system_tags:
                try:
                    from posts.models import SystemTag
                    
                    system_tag_names = [tag.strip().lower() for tag in query.system_tags if tag.strip()]
                    
                    if system_tag_names:
                        try:
                            matching_system_tags = SystemTag.objects.filter(
                                is_active=True,
                                name__iregex='|'.join(system_tag_names)
                            ).values_list('name', flat=True)
                            
                            if matching_system_tags:
                                posts_query = posts_query.filter(
                                    posttag__tag_name__in=matching_system_tags
                                ).distinct()
                            else:
                                return []
                                
                        except Exception as e:
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
                                pass
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"시스템 태그 필터링 중 오류 발생: {str(e)}")
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
            
            # 사용자 좋아요 상태 확인
            user_likes = set()
            if current_user:
                user_likes = set(PostLike.objects.filter(
                    user=current_user,
                    post_id__in=post_ids
                ).values_list('post_id', flat=True))
            
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
                post_data['is_liked'] = str(post.id) in user_likes
                post_data['is_all_access'] = post.is_all_access
                posts_with_data.append(post_data)
            
            return posts_with_data
        
        return await get_center_posts_list()
        
    except Exception as e:
        raise HttpError(500, f"센터 권한자용 게시글 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/center/{post_id}",
    summary="[R] 센터 권한자용 게시글 상세 조회",
    description="센터 권한자와 본인 게시글의 상세 정보를 조회합니다. 인증이 필요합니다.",
    response={
        200: PostDetailOut,
        401: dict,
        403: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def get_center_post_detail(request: HttpRequest, post_id: str):
    """센터 권한자용 게시글 상세 정보를 조회합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user
        
        @sync_to_async
        def get_center_post_detail():
            try:
                post = Post.objects.select_related('user').get(id=post_id)
            except Post.DoesNotExist:
                return None, None, None
            
            # 접근 권한 확인
            can_access = False
            if post.is_all_access:
                can_access = True
            elif post.user == current_user or current_user.user_type in ['센터관리자', '최고관리자']:
                can_access = True
            
            if not can_access:
                return None, None, None
            
            # 태그와 이미지 조회
            tags = list(PostTag.objects.filter(post=post))
            images = list(PostImage.objects.filter(post=post).order_by('order_index'))
            
            return post, tags, images
        
        result = await get_center_post_detail()
        if result[0] is None:
            raise HttpError(403, "이 게시글에 접근할 권한이 없습니다")
        
        post, tags, images = result
        
        # 사용자 좋아요 상태 확인
        is_liked = False
        if current_user:
            @sync_to_async
            def check_like():
                return PostLike.objects.filter(
                    user=current_user,
                    post=post
                ).exists()
            
            is_liked = await check_like()
        
        # 응답 데이터 구성
        @sync_to_async
        def build_post_response():
            return _build_post_response(
                post,
                tags=[_build_tag_response(tag) for tag in tags],
                images=[_build_image_response(img) for img in images],
                user_nickname=getattr(post.user, 'nickname', post.user.username),
                user_image=getattr(post.user, 'image', None)
            )
        
        post_data = await build_post_response()
        post_data['is_liked'] = is_liked
        post_data['is_all_access'] = post.is_all_access
        
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
        logger.error(f"센터 권한자용 게시글 상세 조회 오류: {str(e)}")
        raise HttpError(500, f"센터 권한자용 게시글 상세 조회 중 오류가 발생했습니다: {str(e)}")


# === 기존 CRUD API (인증 필요) ===

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
                adoption_id=data.adoption_id if data.adoption_id else None,
                is_all_access=data.is_all_access if data.is_all_access is not None else True
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
        @sync_to_async
        def build_response():
            return _build_post_response(post)
        
        response_data = {
            "message": "게시글이 생성되었습니다.",
            "community": await build_response()
        }

        return 201, response_data

    except Exception as e:
        raise HttpError(500, f"게시글 생성 중 오류가 발생했습니다: {str(e)}")


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
            
            # 접근 권한 확인
            can_access = False
            if post.is_all_access:
                can_access = True
            elif post.user == current_user or current_user.user_type in ['센터관리자', '최고관리자']:
                can_access = True
            
            if not can_access:
                raise PermissionError("이 게시글에 접근할 권한이 없습니다")
            
            # 수정 권한 확인 (본인만 수정 가능)
            if post.user != current_user:
                raise PermissionError("수정 권한이 없습니다")
            
            # 게시글 업데이트
            if data.title is not None:
                post.title = data.title
            if data.content is not None:
                post.content = data.content
            if data.adoption_id is not None:
                post.adoption_id = data.adoption_id
            if data.is_all_access is not None:
                post.is_all_access = data.is_all_access
            
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


# === 좋아요 API ===

@router.post(
    "/{post_id}/like/toggle",
    summary="[C/D] 포스트 좋아요 토글",
    description="포스트를 좋아요하거나 좋아요를 해제합니다.",
    response={
        200: dict,
        401: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def toggle_post_like(request: HttpRequest, post_id: str):
    """포스트 좋아요를 토글합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def toggle_like():
            # 포스트 존재 확인
            try:
                post = Post.objects.get(id=post_id)
            except Post.DoesNotExist:
                raise HttpError(404, "포스트를 찾을 수 없습니다")

            # 현재 좋아요 상태 확인
            try:
                like = PostLike.objects.get(
                    user=current_user,
                    post=post
                )
                # 좋아요 해제
                like.delete()
                is_liked = False
                message = "포스트 좋아요가 해제되었습니다"
            except PostLike.DoesNotExist:
                # 좋아요 추가
                PostLike.objects.create(
                    user=current_user,
                    post=post
                )
                is_liked = True
                message = "포스트를 좋아요했습니다"

            # 총 좋아요 개수 조회 및 Post 모델 업데이트
            total_likes = PostLike.objects.filter(post=post).count()
            post.like_count = total_likes
            post.save(update_fields=['like_count'])

            return {
                "is_liked": is_liked,
                "message": message,
                "total_likes": total_likes
            }

        return await toggle_like()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"포스트 좋아요 토글 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/{post_id}/like/status",
    summary="[R] 포스트 좋아요 상태 확인",
    description="특정 포스트의 좋아요 상태를 확인합니다.",
    response={
        200: dict,
        401: dict,
        404: dict,
        500: dict,
    },
    auth=jwt_auth,
)
async def check_post_like_status(request: HttpRequest, post_id: str):
    """포스트 좋아요 상태를 확인합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def check_status():
            # 포스트 존재 확인
            try:
                post = Post.objects.get(id=post_id)
            except Post.DoesNotExist:
                raise HttpError(404, "포스트를 찾을 수 없습니다")

            # 좋아요 상태 확인
            is_liked = PostLike.objects.filter(
                user=current_user,
                post=post
            ).exists()

            # 총 좋아요 개수 조회 및 Post 모델 업데이트
            total_likes = PostLike.objects.filter(post=post).count()
            post.like_count = total_likes
            post.save(update_fields=['like_count'])

            return {
                "is_liked": is_liked,
                "total_likes": total_likes
            }

        return await check_status()

    except HttpError:
        raise
    except Exception as e:
        raise HttpError(500, f"포스트 좋아요 상태 확인 중 오류가 발생했습니다: {str(e)}")


# === 시스템 태그 API ===

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



