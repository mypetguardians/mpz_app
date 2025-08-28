# services.py (드롭인 교체본)
import os
import logging
import base64
import boto3
from botocore.client import Config
from typing import Union

logger = logging.getLogger(__name__)

BytesLike = Union[bytes, bytearray, memoryview]

def _maybe_decode_base64(s: str) -> bytes:
    """
    문자열이 Base64(또는 dataURL)로 보이면 bytes로 디코딩한다.
    확실하지 않으면 TypeError를 던져 상위에서 잡게 한다.
    """
    raw = s.strip()
    if raw.startswith("data:") and "," in raw:
        raw = raw.split(",", 1)[1]  # dataURL 프리픽스 제거
    # 공백/개행 제거
    raw = "".join(raw.split())
    # Base64 패딩 보정
    missing = (-len(raw)) % 4
    if missing:
        raw += "=" * missing
    try:
        return base64.b64decode(raw, validate=True)
    except Exception as e:
        raise TypeError(f"upload_file(data): bytes-like object required, not 'str' (invalid base64?)") from e


class R2Client:
    """
    Cloudflare R2 클라이언트 (boto3 S3 compatible)
    환경변수에서 R2 자격증명 및 버킷 정보를 읽어 초기화합니다.
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
                "R2 환경변수(R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, "
                "R2_ENDPOINT, R2_PUBLIC_BASE_URL)가 모두 필요합니다."
            )

        self.client = boto3.client(
            "s3",
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            endpoint_url=self.endpoint,          # 예: https://<accountid>.r2.cloudflarestorage.com
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

    def _ensure_bytes(self, data: Union[str, BytesLike]) -> BytesLike:
        """bytes-like만 반환. str이면 base64로 판단해 디코딩 시도 후 실패 시 TypeError."""
        if isinstance(data, (bytes, bytearray, memoryview)):
            return data
        if isinstance(data, str):
            # 백엔드 어디선가 실수로 str이 들어오더라도 여기서 방어
            return _maybe_decode_base64(data)
        raise TypeError(f"upload_file(data): unsupported type {type(data)}")

    def upload_file(self, key: str, data: Union[str, BytesLike], content_type: str = "application/octet-stream"):
        """R2 버킷에 파일 업로드 (boto3)"""
        try:
            blob = self._ensure_bytes(data)
            # memoryview로 래핑 (선택)
            if not isinstance(blob, memoryview):
                blob = memoryview(blob)

            if not content_type:
                content_type = "application/octet-stream"

            resp = self.client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=blob,                  # ✅ 반드시 bytes류
                ContentType=content_type,   # ✅ FE에서 전달한 MIME 사용
                # ContentEncoding 금지(직접 gzip 안 했으면)
            )
            logger.info(f"R2 업로드 성공: {key} (len={len(blob)})")
            return resp
        except Exception as e:
            logger.error(f"R2 업로드 실패: {key}, 오류: {e}")
            raise

    def download_file(self, key: str):
        """R2 버킷에서 파일 다운로드 (boto3)"""
        try:
            response = self.client.get_object(Bucket=self.bucket, Key=key)
            data = response["Body"].read()
            logger.info(f"R2 다운로드 성공: {key} (len={len(data)})")
            return data
        except Exception as e:
            logger.error(f"R2 다운로드 실패: {key}, 오류: {e}")
            raise

    def delete_file(self, key: str):
        """R2 버킷에서 파일 삭제 (boto3)"""
        try:
            response = self.client.delete_object(Bucket=self.bucket, Key=key)
            logger.info(f"R2 삭제 성공: {key}")
            return response
        except Exception as e:
            logger.error(f"R2 삭제 실패: {key}, 오류: {e}")
            raise
