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
    PostOut, PostDetailOut, PostCreateOut, PostUpdateOut, PostDeleteOut, MixedAccessPostsOut
)
from api.security import jwt_auth
from user.models import User
from posts.models import SystemTag
from django.db import models


router = Router(tags=["Posts"])


def _build_post_response(post, tags=None, images=None, user_nickname=None, user_image=None, comment_count=None):
    """포스트 응답 데이터 구성"""
    # comment_count가 제공되지 않으면 동적으로 계산
    if comment_count is None:
        from comments.models import Comment
        comment_count = Comment.objects.filter(post=post).count()
    
    return {
        "id": str(post.id),
        "title": post.title,
        "content": post.content,
        "user_id": str(post.user.id),
        "animal_id": str(post.animal.id) if post.animal else None,
        "content_tags": getattr(post, 'content_tags', None),
        "like_count": getattr(post, 'like_count', 0),
        "comment_count": comment_count,
        "is_liked": False,  # 기본값, 필요시 별도 로직으로 설정
        "is_all_access": getattr(post, 'is_all_access', True),
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
async def get_all_public_posts(request: HttpRequest, user_id: str = Query(None), tags: list[str] = Query(None), is_all_access: bool = Query(None), sort_by: str = Query("latest")):
    """전체 공개 게시글 목록을 조회합니다."""
    try:
        @sync_to_async
        def get_public_posts():
            posts_query = Post.objects.filter(is_all_access=True).select_related('user')
            
            # 필터링 적용
            if user_id:
                posts_query = posts_query.filter(user_id=user_id)
            
            # 시스템 태그 필터링 적용 - PostTag 모델 기반
            if tags:
                try:
                    system_tag_names = [tag.strip() for tag in tags if tag.strip()]
                    print(f"🔍 Public Posts 태그 필터링 시도: {system_tag_names}")
                    print(f"🔍 필터링 전 게시글 수: {posts_query.count()}")
                    
                    if system_tag_names:
                        # 대소문자 무시 정확 일치 정규식으로 필터링
                        import re
                        escaped = [re.escape(name) for name in system_tag_names]
                        pattern = rf"^({'|'.join(escaped)})$"
                        posts_query = posts_query.filter(
                            posttag__tag_name__iregex=pattern
                        ).distinct()
                        print(f"🔍 필터링 후 게시글 수: {posts_query.count()}")
                        
                        # 실제로 매칭되는 태그들 확인
                        matching_tags = PostTag.objects.filter(tag_name__in=system_tag_names).values_list('tag_name', flat=True).distinct()
                        print(f"🔍 실제 매칭되는 태그들: {list(matching_tags)}")
                        
                except Exception as e:
                    print(f"❌ 시스템 태그 필터링 오류: {e}")
                    # 오류 발생 시 필터링 없이 진행
            
            # 정렬 적용
            if sort_by == "latest":
                posts_query = posts_query.order_by('-created_at')
            elif sort_by == "oldest":
                posts_query = posts_query.order_by('created_at')
            elif sort_by == "most_liked":
                posts_query = posts_query.order_by('-like_count', '-created_at')
            elif sort_by == "most_commented":
                posts_query = posts_query.order_by('-comment_count', '-created_at')
            else:
                posts_query = posts_query.order_by('-created_at')  # 기본값
            
            posts = list(posts_query)
            
            # 응답 데이터 구성
            posts_response = []
            for post in posts:
                # 태그 정보 가져오기
                post_tags = [_build_tag_response(tag) for tag in PostTag.objects.filter(post=post)]
                
                # 이미지 정보 가져오기
                images = [_build_image_response(img) for img in PostImage.objects.filter(post=post).order_by('order_index')]
                
                # 사용자 정보 가져오기
                user_nickname = getattr(post.user, 'nickname', post.user.username)
                user_image = getattr(post.user, 'image', None)
                
                post_response = _build_post_response(post, post_tags, images, user_nickname, user_image)
                posts_response.append(post_response)
            
            return posts_response
        
        return await get_public_posts()
        
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        error_detail = f"Get all public posts error: {str(e)}\nTraceback: {traceback.format_exc()}"
        print(error_detail)
        logger.error(error_detail)
        raise HttpError(500, f"게시글 목록 조회 중 오류가 발생했습니다: {str(e)}")


@router.get(
    "/mixed/",
    summary="[R] 전체/제한 공개 게시글 목록 조회",
    description="전체 공개(is_all_access=True)와 제한 공개(is_all_access=False) 게시글 목록을 한꺼번에 조회합니다. 제한 공개 게시글은 센터 권한자(센터관리자, 센터최고관리자, 훈련사) 또는 입양 완료 이력이 있는 사용자만 볼 수 있습니다.",
    response={
        200: MixedAccessPostsOut,
        500: dict,
    },
)
async def get_mixed_access_posts(request: HttpRequest, user_id: str = Query(None), tags: list[str] = Query(None), is_all_access: bool = Query(None), sort_by: str = Query("latest")):
    """전체 공개와 제한 공개 게시글 목록을 한꺼번에 조회합니다. 제한 공개 게시글은 센터 권한자 또는 입양 완료 이력이 있는 사용자만 볼 수 있습니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user

        @sync_to_async
        def get_mixed_posts():
            # 전체 공개 게시글 조회
            public_posts_query = Post.objects.filter(is_all_access=True).select_related('user')
            
            # 제한 공개 게시글 조회 (센터 권한자만)
            private_posts_query = Post.objects.filter(is_all_access=False).select_related('user')
            
            # 필터링 적용 (전체 공개)
            if user_id:
                public_posts_query = public_posts_query.filter(user_id=user_id)
            
            # 필터링 적용 (제한 공개) - 센터 권한자만
            if user_id:
                private_posts_query = private_posts_query.filter(user_id=user_id)
            
            # 센터 권한 또는 입양 완료 이력 체크
            has_center_permission = False
            if current_user and hasattr(current_user, 'user_type'):
                has_center_permission = current_user.user_type in ["센터관리자", "센터최고관리자", "훈련사"]
                
                # 입양 완료 이력이 있는 사용자도 제한 공개 게시글에 접근 가능
                if not has_center_permission:
                    from adoptions.models import Adoption
                    has_adoption_history = Adoption.objects.filter(
                        user=current_user,
                        status='입양완료'
                    ).exists()
                    has_center_permission = has_adoption_history
            
            # 센터 권한이나 입양 완료 이력이 없으면 제한 공개 게시글은 빈 리스트
            if not has_center_permission:
                private_posts_query = Post.objects.none()
            
            # 시스템 태그 필터링 적용 (전체 공개) - PostTag 모델 기반
            if tags:
                try:
                    system_tag_names = [tag.strip() for tag in tags if tag.strip()]
                    print(f"Mixed Posts 태그 필터링 시도: {system_tag_names}")
                    
                    if system_tag_names:
                        import re
                        escaped = [re.escape(name) for name in system_tag_names]
                        pattern = rf"^({'|'.join(escaped)})$"
                        public_posts_query = public_posts_query.filter(
                            posttag__tag_name__iregex=pattern
                        ).distinct()
                        print(f"필터링 후 전체 공개 게시글 수: {public_posts_query.count()}")
                        
                except Exception as e:
                    print(f"시스템 태그 필터링 오류: {e}")
                    # 오류 발생 시 필터링 없이 진행
            
            # 정렬 적용 (전체 공개) - 기본값으로 최신순
            public_posts_query = public_posts_query.order_by('-created_at')
            
            # 제한 공개 게시글도 같은 정렬 적용 - 기본값으로 최신순
            private_posts_query = private_posts_query.order_by('-created_at')
            
            public_posts = list(public_posts_query)
            private_posts = list(private_posts_query)
            
            # 응답 데이터 구성
            def build_posts_response(posts):
                posts_response = []
                for post in posts:
                    # 태그 정보 가져오기
                    post_tags = [_build_tag_response(tag) for tag in PostTag.objects.filter(post=post)]
                    
                    # 이미지 정보 가져오기
                    images = [_build_image_response(img) for img in PostImage.objects.filter(post=post).order_by('order_index')]
                    
                    # 사용자 정보 가져오기
                    user_nickname = getattr(post.user, 'nickname', post.user.username)
                    user_image = getattr(post.user, 'image', None)
                    
                    post_response = _build_post_response(post, post_tags, images, user_nickname, user_image)
                    posts_response.append(post_response)
                
                return posts_response
            
            public_response = build_posts_response(public_posts)
            private_response = build_posts_response(private_posts)
            
            return MixedAccessPostsOut(
                public_posts=public_response,
                private_posts=private_response,
                public_count=len(public_response),
                private_count=len(private_response),
                total_count=len(public_response) + len(private_response)
            )
        
        return await get_mixed_posts()
        
    except Exception as e:
        print(f"Get mixed access posts error: {e}")
        raise HttpError(500, "게시글 목록 조회 중 오류가 발생했습니다")


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
    description="센터 권한자, 입양 완료 이력이 있는 사용자, 본인 게시글 목록을 조회합니다. 인증이 필요합니다.",
    response={
        200: list[PostOut],
        401: dict,
        500: dict,
    },
    auth=jwt_auth,
)
@paginate
async def get_center_posts(request: HttpRequest, user_id: str = Query(None), tags: list[str] = Query(None), is_all_access: bool = Query(None), sort_by: str = Query("latest")):
    """센터 권한자, 입양 완료 이력이 있는 사용자, 본인 게시글 목록을 조회합니다."""
    try:
        current_user = request.auth
        if hasattr(current_user, '__await__'):
            current_user = await current_user
        
        @sync_to_async
        def get_center_posts_list():
            # 입양 완료 이력 확인
            from adoptions.models import Adoption
            has_adoption_history = Adoption.objects.filter(
                user=current_user,
                status='입양완료'
            ).exists()
            
            # 접근 가능한 범위를 하나의 Q 조건으로 구성 (UNION 대신)
            access_condition = (
                models.Q(is_all_access=True) |               # 전체 공개
                models.Q(user=current_user)                  # 본인 글
            )
            if (current_user.user_type in ['센터관리자', '최고관리자'] or has_adoption_history):
                access_condition = access_condition | (
                    models.Q(user__user_type__in=['센터관리자', '최고관리자']) |  # 센터 권한자 글
                    models.Q(is_all_access=False)                                  # 제한 공개 글
                )

            posts_query = Post.objects.select_related('user').filter(access_condition)
            
            # 필터링 적용
            if user_id:
                posts_query = posts_query.filter(user_id=user_id)
            
            # is_all_access 필터 적용
            if is_all_access is not None:
                posts_query = posts_query.filter(is_all_access=is_all_access)
            
            # 시스템 태그 필터링 적용 - 정확한 태그명 매칭 (대소문자 무시)
            if tags:
                try:
                    system_tag_names = [tag.strip() for tag in tags if tag.strip()]
                    print(f"Center Posts 태그 필터링 시도: {system_tag_names}")
                    
                    if system_tag_names:
                        import re
                        escaped = [re.escape(name) for name in system_tag_names]
                        pattern = rf"^({'|'.join(escaped)})$"
                        posts_query = posts_query.filter(
                            posttag__tag_name__iregex=pattern
                        ).distinct()
                        print(f"필터링 후 게시글 수: {posts_query.count()}")
                        
                except Exception as e:
                    print(f"❌ 시스템 태그 필터링 오류: {e}")
            
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
                post_tags = tags_by_post.get(post.id, [])
                images = images_by_post.get(post.id, [])
                comment_count = comment_count_by_post.get(post.id, 0)
                
                post_data = _build_post_response(
                    post,
                    tags=[_build_tag_response(tag) for tag in post_tags],
                    images=[_build_image_response(img) for img in images],
                    user_nickname=getattr(post.user, 'nickname', post.user.username),
                    user_image=getattr(post.user, 'image', None),
                    comment_count=comment_count
                )
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
    description="센터 권한자, 입양 완료 이력이 있는 사용자, 본인 게시글의 상세 정보를 조회합니다. 인증이 필요합니다.",
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
    """센터 권한자, 입양 완료 이력이 있는 사용자, 본인 게시글의 상세 정보를 조회합니다."""
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
                # 전체 공개 글은 누구나 접근 가능
                can_access = True
            elif post.user == current_user:
                # 본인 글은 누구나 접근 가능
                can_access = True
            elif current_user.user_type in ['센터관리자', '센터최고관리자', '훈련사']:
                # 센터 권한자는 모든 글에 접근 가능
                can_access = True
            elif post.user.user_type in ['센터관리자', '센터최고관리자', '훈련사']:
                # 센터 권한자가 작성한 글은 누구나 볼 수 있음
                can_access = True
            else:
                # 입양 완료 이력이 있는 사용자는 제한 공개 글에 접근 가능
                from adoptions.models import Adoption
                has_adoption_history = Adoption.objects.filter(
                    user=current_user,
                    status='입양완료'
                ).exists()
                
                if has_adoption_history and not post.is_all_access:
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
                animal_id=data.animal_id if data.animal_id else None,
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
            if data.animal_id is not None:
                post.animal_id = data.animal_id
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



