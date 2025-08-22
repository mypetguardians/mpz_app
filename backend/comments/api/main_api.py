from ninja import Router
from comments.api.comment_api import router as comment_router
from comments.api.reply_api import router as reply_router

router = Router(tags=["Comments and Replies"])

router.add_router("", comment_router)
router.add_router("", reply_router)

