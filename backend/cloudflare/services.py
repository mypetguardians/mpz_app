import os
import logging
import base64
import boto3
from botocore.client import Config
from typing import Union

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

BytesLike = Union[bytes, bytearray]

def _decode_base64_maybe_dataurl(s: str) -> bytes:
    """
    'data:image/png;base64,...' 또는 순수 Base64 모두 지원.
    공백/개행 제거 및 padding 보정 포함.
    """
    raw = (s or "").strip()
    if raw.startswith("data:") and "," in raw:
        raw = raw.split(",", 1)[1]
    raw = "".join(raw.split())
    missing = (-len(raw)) % 4
    if missing:
        raw += "=" * missing
    return base64.b64decode(raw, validate=False)

class R2Client:
    """
    Cloudflare R2 클라이언트 (S3 호환)
    필요 ENV:
      R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_ENDPOINT, R2_PUBLIC_BASE_URL
    """
    def __init__(self):
        self.account_id = os.getenv("R2_ACCOUNT_ID")
        self.access_key = os.getenv("R2_ACCESS_KEY")
        self.secret_key = os.getenv("R2_SECRET_KEY")
        self.bucket = os.getenv("R2_BUCKET")
        self.endpoint = os.getenv("R2_ENDPOINT")
        self.public_base_url = os.getenv("R2_PUBLIC_BASE_URL")

        if not all([self.account_id, self.access_key, self.secret_key, self.bucket, self.endpoint, self.public_base_url]):
            raise ValueError(
                "R2 환경변수(R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, "
                "R2_BUCKET, R2_ENDPOINT, R2_PUBLIC_BASE_URL)가 모두 필요합니다."
            )

        self.client = boto3.client(
            "s3",
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            endpoint_url=self.endpoint,     # 예: https://<accountid>.r2.cloudflarestorage.com
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

    def _ensure_bytes(self, data: Union[str, BytesLike, memoryview]) -> BytesLike:
        """
        bytes-like 보장.
        - str  → base64로 간주해 디코딩
        - memoryview → bytes로 변환
        - bytes/bytearray → 그대로
        """
        if isinstance(data, (bytes, bytearray)):
            return data
        if isinstance(data, memoryview):
            return data.tobytes()
        if isinstance(data, str):
            return _decode_base64_maybe_dataurl(data)
        raise TypeError(f"upload_file(data): unsupported type {type(data)}")

    def upload_file(self, key: str, data: Union[str, BytesLike, memoryview], content_type: str = "application/octet-stream"):
        """R2 put_object. Body는 반드시 bytes/bytearray."""
        blob = self._ensure_bytes(data)
        if not content_type:
            content_type = "application/octet-stream"

        resp = self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=blob,                 # ✅ bytes/bytearray
            ContentType=content_type,
        )
        logger.info(f"[R2] 업로드 성공 key={key} len={len(blob)} ct={content_type}")
        return resp

    def download_file(self, key: str) -> bytes:
        resp = self.client.get_object(Bucket=self.bucket, Key=key)
        data = resp["Body"].read()
        logger.info(f"[R2] 다운로드 성공 key={key} len={len(data)}")
        return data

    def delete_file(self, key: str):
        resp = self.client.delete_object(Bucket=self.bucket, Key=key)
        logger.info(f"[R2] 삭제 성공 key={key}")
        return resp
