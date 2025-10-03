from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from django.apps import apps
from django.contrib import auth
from django.contrib.auth.hashers import make_password
from common.models import BaseModel


class CustomUserManager(UserManager):
    """Custom User Manager Definition"""

    use_in_migrations = True

    def _create_user(self, username, password, **extra_fields):
        """
        Create and save a user with the given username, and password.
        """
        if not username:
            raise ValueError("The given username must be set")
        # Lookup the real model class from the global app registry so this
        # manager method can be used in migrations. This is fine because
        # managers are by definition working on the real model.
        GlobalUserModel = apps.get_model(
            self.model._meta.app_label, self.model._meta.object_name
        )
        username = GlobalUserModel.normalize_username(username)
        user = self.model(username=username, **extra_fields)
        user.password = make_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(username, password, **extra_fields)

    def create_admin_user(self, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(username, password, type="관리자", **extra_fields)

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(
            username, password, status=User.UserStatusChoice.admin, **extra_fields
        )

    def with_perm(
        self, perm, is_active=True, include_superusers=True, backend=None, obj=None
    ):
        if backend is None:
            backends = auth._get_backends(return_tuples=True)
            if len(backends) == 1:
                backend, _ = backends[0]
            else:
                raise ValueError(
                    "You have multiple authentication backends configured and "
                    "therefore must provide the `backend` argument."
                )
        elif not isinstance(backend, str):
            backend = auth.load_backend(backend)
        if hasattr(backend, "with_perm"):
            return backend.with_perm(
                perm,
                is_active=is_active,
                include_superusers=include_superusers,
                obj=obj,
            )
        return self.none()


class User(AbstractUser, BaseModel):
    """Custom User Model Definition"""

    class UserStatusChoice(models.TextChoices):
        active = ("활성유저", "활성유저")  # 정상
        admin = ("관리자", "관리자")  # 관리자
        withdraw = ("탈퇴유저", "탈퇴유저")  # 탈퇴

    class UserTypeChoice(models.TextChoices):
        normal = ("일반사용자", "일반사용자")
        center_admin = ("센터관리자", "센터관리자")
        center_super_admin = ("센터최고관리자", "센터최고관리자")
        trainer = ("훈련사", "훈련사")

    objects = CustomUserManager()
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []

    first_name = models.CharField(
        max_length=150,
        editable=False,
    )
    last_name = models.CharField(
        max_length=150,
        editable=False,
    )
    username = models.CharField(
        max_length=150,
        unique=True,
        help_text="아이디",
    )
    email = models.EmailField(
        max_length=50,
        null=True,
        blank=True,
        help_text="이메일",
    )
    groups = models.ManyToManyField(
        "auth.Group",
        related_name="custom_user_set",  # change this related_name
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="custom_user_permissions_set",  # change this related_name
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )
    status = models.CharField(
        max_length=10,
        choices=UserStatusChoice.choices,
        default=UserStatusChoice.active,
        help_text="회원 유형",
    )
    
    # 추가 필드들
    name = models.CharField(max_length=100, blank=True, null=True, help_text="실명")
    nickname = models.CharField(max_length=100, blank=True, null=True, help_text="닉네임")
    phone_number = models.CharField(max_length=20, blank=True, null=True, help_text="전화번호")
    user_type = models.CharField(
        max_length=20, 
        choices=UserTypeChoice.choices, 
        default=UserTypeChoice.normal, 
        help_text="사용자 타입"
    )
    is_phone_verified = models.BooleanField(default=False, help_text="전화번호 인증 여부")
    phone_verified_at = models.DateTimeField(blank=True, null=True, help_text="전화번호 인증 시간")
    kakao_id = models.CharField(max_length=100, blank=True, null=True, unique=True, help_text="카카오 ID")
    image = models.CharField(max_length=500, blank=True, null=True, help_text="프로필 이미지 URL")
    
    # 사용자 설정 필드들
    birth = models.CharField(max_length=10, blank=True, null=True, help_text="생년월일 (YYYY-MM-DD)")
    address = models.TextField(blank=True, null=True, help_text="주소")
    address_is_public = models.BooleanField(default=False, help_text="주소 공개 여부")
    
    # 약관 동의
    terms_of_service = models.BooleanField(default=False, help_text="이용약관 동의")
    privacy_policy_agreement = models.BooleanField(default=False, help_text="개인정보처리방침 동의")
    terms_agreed_at = models.DateTimeField(blank=True, null=True, help_text="약관 동의 시간")
    
    # 소속 센터 (Many:1 관계 - 한 사용자는 하나의 센터에만 소속)
    center = models.ForeignKey('centers.Center', on_delete=models.SET_NULL, blank=True, null=True, help_text="소속 센터", related_name="members")
    
    # 관리자 메모 (입양, 파양 사유 등 관리자용 메모)
    admin_memo = models.TextField(blank=True, null=True, help_text="관리자 메모 (입양, 파양 사유 등)")
    
    class Meta:
        db_table = 'user'
        verbose_name = '사용자'
        verbose_name_plural = '사용자들'
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"


class Jwt(BaseModel):
    """JWT 토큰 모델"""
    
    user = models.OneToOneField(
        User, related_name="login_user", on_delete=models.CASCADE, help_text="회원"
    )
    access = models.TextField(help_text="Access Token")
    refresh = models.TextField(help_text="Refresh Token")
    
    class Meta:
        db_table = 'jwt_tokens'
        verbose_name = 'JWT 토큰'
        verbose_name_plural = 'JWT 토큰들'
    
    def __str__(self):
        return f"{self.user.username} - JWT 토큰"


class PhoneVerificationToken(BaseModel):
    """휴대폰 인증 토큰 (일회성 코드)"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, help_text="사용자")
    phone_number = models.CharField(max_length=20, help_text="전화번호")
    token = models.CharField(max_length=6, help_text="6자리 인증 토큰")
    is_used = models.BooleanField(default=False, help_text="사용 여부")
    expires_at = models.DateTimeField(help_text="만료 시간")
    
    class Meta:
        db_table = 'phone_verification_tokens'
        verbose_name = '전화번호 인증 토큰'
        verbose_name_plural = '전화번호 인증 토큰들'
    
    def __str__(self):
        return f"{self.user.username} - {self.phone_number}"


class PhoneVerificationRequest(BaseModel):
    """휴대폰 인증 요청 (일회성 코드) - 비로그인 사용자용"""
    
    phone_number = models.CharField(max_length=20, help_text="전화번호")
    verification_code = models.CharField(max_length=6, help_text="인증 코드")
    expires_at = models.DateTimeField(help_text="만료 시간")
    is_used = models.BooleanField(default=False, help_text="사용 여부")
    
    class Meta:
        db_table = 'phone_verification_requests'
        verbose_name = '전화번호 인증 요청'
        verbose_name_plural = '전화번호 인증 요청들'
    
    def __str__(self):
        return f"{self.phone_number} - {self.verification_code}"
