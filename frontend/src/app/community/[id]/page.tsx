"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShareNetwork } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { CommunityDetail } from "@/app/community/_components/CommunityDetail";
import { CommentSection } from "@/app/community/_components/CommentSection";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { CustomModal } from "@/components/ui/CustomModal";
import { Toast } from "@/components/ui/Toast";
import { IconButton } from "@/components/ui/IconButton";
import {
  CommunityDetailSkeleton,
  CommentSectionSkeleton,
} from "@/components/ui";
import { useGetPublicPostDetail } from "@/hooks/query/useGetPublicPosts";
import { useGetCenterPostDetail } from "@/hooks/query/useGetCenterPosts";
import { useGetComments } from "@/hooks/query/useGetComments";
import { useDeletePost } from "@/hooks/mutation/useDeletePost";
import { useAuth } from "@/components/providers/AuthProvider";

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [bottomSheetVariant, setBottomSheetVariant] = useState<
    "report" | "postAction"
  >("report");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 사용자 권한에 따라 적절한 API 호출
  const isCenterUser =
    user?.userType === "센터관리자" ||
    user?.userType === "훈련사" ||
    user?.userType === "센터최고관리자";

  // 센터권한자용 게시글 상세조회
  const {
    data: centerPostDetailData,
    isLoading: isCenterPostLoading,
    error: centerPostError,
  } = useGetCenterPostDetail(params.id as string);

  // 일반 사용자용 게시글 상세조회
  const {
    data: publicPostDetailData,
    isLoading: isPublicPostLoading,
    error: publicPostError,
  } = useGetPublicPostDetail(params.id as string);

  // 권한에 따라 적절한 데이터 선택
  const postDetailData = isCenterUser
    ? centerPostDetailData
    : publicPostDetailData;
  const isPostLoading = isCenterUser
    ? isCenterPostLoading
    : isPublicPostLoading;
  const postError = isCenterUser ? centerPostError : publicPostError;

  const { data: commentsData, isLoading: isCommentsLoading } = useGetComments(
    params.id as string
  );

  const deletePostMutation = useDeletePost();

  // 게시글 데이터
  const post = postDetailData?.post;
  const comments = commentsData?.data || [];
  // 로딩 상태 관리
  useEffect(() => {
    if (postDetailData && post) {
      setIsLoading(false);
    }
  }, [postDetailData, post]);

  const pagination = commentsData
    ? {
        count: commentsData.count,
        totalCnt: commentsData.totalCnt,
        pageCnt: commentsData.pageCnt,
        curPage: commentsData.curPage,
        nextPage: commentsData.nextPage,
        previousPage: commentsData.previousPage,
      }
    : undefined;

  // 현재 사용자가 게시글 작성자인지 확인 (실제 로그인된 유저 기준)
  const isMyPost = user?.id && post?.userId && user.id === post.userId;

  // 공유 관련 함수들
  const handleKakaoShare = () => {
    if (typeof window !== "undefined" && window.Kakao) {
      try {
        // 이미지 URL 추출: 문자열/객체(image_url, imageUrl 등) 모두 지원
        const firstImageUrl = (() => {
          const imgs = post?.images;
          if (!imgs || imgs.length === 0) return "";
          const first = imgs[0] as unknown;
          if (typeof first === "string") return first;
          if (typeof first === "object" && first !== null) {
            const obj = first as {
              image_url?: unknown;
              imageUrl?: unknown;
              url?: unknown;
              file_url?: unknown;
            };
            const candidate =
              (obj.image_url as string | undefined) ??
              (obj.imageUrl as string | undefined) ??
              (obj.file_url as string | undefined) ??
              (obj.url as string | undefined);
            return typeof candidate === "string" ? candidate : "";
          }
          return "";
        })();

        window.Kakao.Link.sendDefault({
          objectType: "feed",
          content: {
            title: post?.title || "커뮤니티 게시글",
            description:
              post?.content?.substring(0, 100) ||
              "흥미로운 게시글을 확인해보세요!",
            imageUrl: firstImageUrl || "",
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href,
            },
          },
          buttons: [
            {
              title: "자세히 보기",
              link: {
                mobileWebUrl: window.location.href,
                webUrl: window.location.href,
              },
            },
          ],
        });
        setShowToast(true);
        setToastMessage("카카오톡으로 공유되었습니다!");
        setShowShareModal(false);
      } catch (error) {
        console.error("카카오톡 공유 실패:", error);
        setShowToast(true);
        setToastMessage("카카오톡 공유에 실패했습니다.");
      }
    } else {
      setShowToast(true);
      setToastMessage("카카오톡과 연결되어 있지 않습니다.");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowToast(true);
      setToastMessage("링크가 복사되었습니다!");
      setShowShareModal(false);
    } catch (error) {
      console.error("링크 복사 실패:", error);
      setShowToast(true);
      setToastMessage("링크 복사에 실패했습니다.");
    }
  };

  // 토스트 자동 숨김
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // 로딩 상태 또는 데이터가 없을 때 스켈레톤 표시
  if (isLoading || isPostLoading || !postDetailData || !post) {
    console.log("스켈레톤 렌더링 중:", {
      isLoading,
      isPostLoading,
      hasPostDetailData: !!postDetailData,
      hasPost: !!post,
    });

    return (
      <Container className="min-h-screen bg-white">
        <TopBar
          variant="variant5"
          className="border-b border-lg"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={() => window.history.back()}
              />
            </div>
          }
          center={<h4>자세히 보기</h4>}
          right={
            <IconButton
              icon={({ size }) => <ShareNetwork size={size} weight="bold" />}
              size="iconM"
              onClick={() => {}}
            />
          }
        />

        <div className="flex-1 overflow-y-auto">
          {/* 게시글 내용 스켈레톤 */}
          <div className="py-3">
            <CommunityDetailSkeleton />
          </div>

          {/* 댓글 섹션 스켈레톤 */}
          <CommentSectionSkeleton />
        </div>
      </Container>
    );
  }

  // 에러 상태
  if (postError) {
    return (
      <Container className="min-h-screen bg-white">
        <TopBar
          variant="variant5"
          left={
            <div className="flex items-center gap-2">
              <IconButton
                icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
                size="iconM"
                onClick={() => window.history.back()}
              />
              <h2>게시글</h2>
            </div>
          }
        />
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-gray-500">게시글을 불러오는데 실패했습니다.</p>
        </div>
      </Container>
    );
  }

  const handleReport = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setBottomSheetVariant("report");
    setShowBottomSheet(true);
  };

  const handleReportConfirm = () => {
    setToastMessage("신고 접수 되었습니다.");
    setShowToast(true);
    setShowBottomSheet(false);
  };

  const handlePostAction = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setBottomSheetVariant("postAction");
    setShowBottomSheet(true);
  };

  const handleEdit = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    // 게시글 수정 페이지로 이동
    router.push(`/community/edit/${params.id}`);
    setShowBottomSheet(false);
  };

  const handleDelete = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setShowBottomSheet(false);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deletePostMutation.mutateAsync(params.id as string);
      setToastMessage("삭제 완료되었습니다.");
      setShowToast(true);
      setShowDeleteModal(false);
      // 삭제 후 목록으로 이동
      setTimeout(() => {
        router.push("/community");
      }, 1000);
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
      setToastMessage("삭제에 실패했습니다.");
      setShowToast(true);
    }
  };

  const handleUserClick = (userId: string) => {
    router.push(`/community/user/${userId}`);
  };

  const getBottomSheetContent = () => {
    switch (bottomSheetVariant) {
      case "report":
        return {
          title: "정말 신고하시겠습니까?",
          description: "부적절한 게시물인지 꼼꼼히 살펴볼게요.",
          leftButtonText: "아니요",
          rightButtonText: "네, 신고할래요",
          onLeftClick: () => setShowBottomSheet(false),
          onRightClick: handleReportConfirm,
        };
      case "postAction":
        return {
          title: "게시글 작업을 선택하세요.",
          leftButtonText: "게시글 수정",
          rightButtonText: "게시글 삭제",
          onLeftClick: handleEdit,
          onRightClick: handleDelete,
        };
      default:
        return {};
    }
  };

  return (
    <Container className="min-h-screen bg-white">
      <TopBar
        variant="variant5"
        className="border-b border-lg"
        left={
          <div className="flex items-center gap-2">
            <IconButton
              icon={({ size }) => <ArrowLeft size={size} weight="bold" />}
              size="iconM"
              onClick={() => window.history.back()}
            />
          </div>
        }
        center={<h4>자세히 보기</h4>}
        right={
          <IconButton
            icon={({ size }) => <ShareNetwork size={size} weight="bold" />}
            size="iconM"
            onClick={() => setShowShareModal(true)}
          />
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* 게시글 내용 */}
        <div className="py-3">
          <CommunityDetail
            post={post}
            users={[
              {
                id: post.userId,
                nickname: post.userNickname || "사용자",
                profileImg: post.userImage || "/img/dummyImg.png",
              },
            ]}
            isMyPost={isMyPost || false}
            onReport={handleReport}
            onPostAction={handlePostAction}
            onUserClick={handleUserClick}
            onLoginRequired={() => setShowLoginModal(true)}
          />
        </div>

        {/* 댓글 섹션 */}
        <CommentSection
          comments={comments}
          postId={post.id}
          isLoading={isCommentsLoading}
          pagination={pagination}
          isAuthenticated={isAuthenticated}
          onLoginRequired={() => setShowLoginModal(true)}
        />
      </div>

      {/* 바텀시트 */}
      <BottomSheet
        open={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        variant="primary"
        {...getBottomSheetContent()}
      />

      {/* 삭제 확인 모달 */}
      <BottomSheet
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        variant="primary"
        title="정말 삭제하시겠습니까?"
        description="삭제된 정보는 되돌릴 수 없어요."
        leftButtonText="아니요"
        rightButtonText="네, 삭제할래요"
        onLeftClick={() => setShowDeleteModal(false)}
        onRightClick={handleDeleteConfirm}
      />

      {/* 공유 모달 */}
      <CustomModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="공유하기"
        variant="variant4"
        onKakaoShare={handleKakaoShare}
        onCopyLink={handleCopyLink}
      />

      {/* 로그인 모달 */}
      <CustomModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="로그인 후 이용해주세요"
        variant="variant2"
        ctaText="로그인하기"
        onCtaClick={() => (window.location.href = "/login")}
      />

      {/* 토스트 */}
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 z-[10000]">
          <Toast>{toastMessage}</Toast>
        </div>
      )}
    </Container>
  );
}
