import logging
import httpx
from django.conf import settings

logger = logging.getLogger(__name__)


async def send_sms(receiver: str, message: str) -> bool:
    """알리고 API로 SMS 발송. 성공 시 True, 실패 시 False."""
    if not settings.ALIGO_API_KEY:
        logger.warning("ALIGO_API_KEY 미설정 — SMS 발송 스킵")
        return False

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.post(
                "https://apis.aligo.in/send/",
                data={
                    "key": settings.ALIGO_API_KEY,
                    "user_id": settings.ALIGO_USER_ID,
                    "sender": settings.ALIGO_SENDER.replace("-", ""),
                    "receiver": receiver.replace("-", ""),
                    "msg": message,
                    "testmode_yn": getattr(settings, "ALIGO_TESTMODE", "N"),
                },
            )
            result = response.json()

            if int(result.get("result_code", 0)) > 0:
                logger.info("SMS 발송 성공: receiver=%s", receiver)
                return True
            else:
                logger.error("SMS 발송 실패: %s", result.get("message"))
                return False

    except Exception:
        logger.exception("SMS 발송 중 예외 발생")
        return False
