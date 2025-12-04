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
import { ImageCarouselModal } from "@/components/ui/ImageCarouselModal";
import { PetCard } from "@/components/ui/PetCard";
import {
  CommunityDetailSkeleton,
  CommentSectionSkeleton,
} from "@/components/ui";
import {
  useGetPublicPostDetail,
  useGetCenterPostDetail,
  useGetComments,
  useDeletePost,
  useGetAnimalById,
} from "@/hooks";
import { useAuth } from "@/components/providers/AuthProvider";
import { useKakaoSDK } from "@/hooks/useKakaoSDK";
import { transformRawAnimalToPetCard } from "@/types/animal";

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { isLoaded, isInitialized } = useKakaoSDK();

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
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalData, setImageModalData] = useState<{
    images: string[];
    initialIndex: number;
  }>({ images: [], initialIndex: 0 });

  // 사용자 권한에 따라 적절한 API 호출 (인증 로딩 완료 후에만)
  const isCenterUser =
    !authLoading &&
    isAuthenticated &&
    (user?.userType === "센터관리자" ||
      user?.userType === "훈련사" ||
      user?.userType === "센터최고관리자");

  // 센터권한자용 게시글 상세조회 (로그인한 센터 사용자만)
  const centerPostQuery = useGetCenterPostDetail(params.id as string, {
    enabled: !authLoading && isAuthenticated && isCenterUser,
  });

  // 일반 사용자용 게시글 상세조회 (미로그인 및 일반 사용자)
  const publicPostQuery = useGetPublicPostDetail(params.id as string);

  // 권한에 따라 적절한 쿼리 선택
  // 센터 사용자: 센터 API 우선, 실패 시 Public API
  // 일반/미로그인 사용자: Public API만 사용
  const activeQuery =
    isCenterUser && !centerPostQuery.error ? centerPostQuery : publicPostQuery;

  const postDetailData = activeQuery.data;
  const isPostLoading = activeQuery.isLoading;
  const postError = activeQuery.error;

  const refetchCenterPost = centerPostQuery.refetch;
  const refetchPublicPost = publicPostQuery.refetch;

  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = useGetComments(params.id as string);

  const deletePostMutation = useDeletePost();

  // 게시글 데이터
  const post = postDetailData?.post;
  const comments = commentsData?.data || [];
  const animalId = post?.animal_id ?? null;
  const { data: animalData, isLoading: isAnimalLoading } =
    useGetAnimalById(animalId);
  const petCardData = animalData
    ? transformRawAnimalToPetCard(animalData)
    : null;
  // 로딩 상태 관리
  useEffect(() => {
    if (postDetailData && post) {
      setIsLoading(false);
    }
  }, [postDetailData, post]);

  // 페이지 마운트 시 데이터 새로고침
  useEffect(() => {
    const refreshData = async () => {
      try {
        await Promise.all([
          isCenterUser ? refetchCenterPost() : refetchPublicPost(),
          refetchComments(),
        ]);
      } catch (error) {
        console.error("데이터 새로고침 실패:", error);
      }
    };

    refreshData();
  }, [isCenterUser, refetchCenterPost, refetchPublicPost, refetchComments]);

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
  const isMyPost = user?.id && post?.user_id && user.id === post.user_id;

  // 공유 관련 함수들
  const handleKakaoShare = () => {
    if (!isLoaded || !isInitialized) {
      setShowToast(true);
      setToastMessage(
        "카카오톡을 사용할 수 없습니다. 잠시 후 다시 시도해주세요."
      );
      setShowShareModal(false);
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.Kakao &&
      window.Kakao.Share
    ) {
      try {
        const communityUrl = window.location.href;
        
        // 이미지 URL을 절대 URL로 변환하는 함수
        const getAbsoluteImageUrl = (url: string | null | undefined): string => {
          if (!url) return `${window.location.origin}/img/op-image.png`;
          if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
          }
          if (url.startsWith('/')) {
            return `${window.location.origin}${url}`;
          }
          return `${window.location.origin}/${url}`;
        };
        
        // 동물 정보 기반 제목 생성: "마펫쯔: 믹스견(3살 추정)"
        let shareTitle = "마펫쯔";
        if (petCardData && animalData) {
          const breed = petCardData.breed || "믹스견";
          // 나이는 개월 단위이므로 12로 나누어 살 단위로 변환
          const ageText = animalData.age 
            ? (() => {
                const ageInYears = animalData.age / 12;
                // 1살 미만이면 개월로 표시, 1살 이상이면 살로 표시
                if (ageInYears < 1) {
                  return `${animalData.age}개월 추정`;
                } else {
                  // 소수점 첫째자리까지 표시 (예: 1.5살, 3살)
                  const roundedAge = Math.round(ageInYears * 10) / 10;
                  return roundedAge % 1 === 0 
                    ? `${Math.round(roundedAge)}살 추정`
                    : `${roundedAge}살 추정`;
                }
              })()
            : "";
          shareTitle = `마펫쯔: ${breed}${ageText ? `(${ageText})` : ""}`;
        } else {
          shareTitle = post?.title || "마펫쯔";
        }
        
        // 게시글 내용 요약 (100자 이내)
        const contentPreview = post?.content
          ? post.content.length > 100
            ? post.content.substring(0, 100).replace(/\n/g, " ") + "..."
            : post.content.replace(/\n/g, " ")
          : "";
        
        const shareDescription = contentPreview || "유기동물 입양하기! 마펫쯔와 편하게";
        
        // 게시글 이미지가 있으면 첫 번째 이미지 사용, 없으면 동물 이미지, 둘 다 없으면 기본 이미지
        // post.images[0].image_url 또는 animalData.animal_images[0].image_url 사용
        let shareImageUrl = `${window.location.origin}/img/op-image.png`;
        
        if (post?.images && post.images.length > 0) {
          shareImageUrl = getAbsoluteImageUrl(post.images[0].image_url);
        } else if (animalData?.animal_images && animalData.animal_images.length > 0) {
          // animal_images 배열의 첫 번째 이미지 사용
          shareImageUrl = getAbsoluteImageUrl(animalData.animal_images[0].image_url);
        }
        
        // sendDefault 메서드 사용 (더 상세한 정보 포함)
        const kakaoShare = window.Kakao.Share as {
          sendScrap?: (options: { requestUrl: string }) => void;
          sendDefault?: (options: {
            objectType: string;
            content: {
              title: string;
              description: string;
              imageUrl: string;
              link: {
                mobileWebUrl: string;
                webUrl: string;
              };
            };
            buttons: Array<{
              title: string;
              link: {
                mobileWebUrl: string;
                webUrl: string;
              };
            }>;
          }) => void;
        };
        
        if (kakaoShare.sendDefault) {
          kakaoShare.sendDefault({
            objectType: "feed",
            content: {
              title: shareTitle,
              description: shareDescription,
              imageUrl: shareImageUrl,
              link: {
                mobileWebUrl: communityUrl,
                webUrl: communityUrl,
              },
            },
            buttons: [
              {
                title: "자세히 보기",
                link: {
                  mobileWebUrl: communityUrl,
                  webUrl: communityUrl,
                },
              },
            ],
          });
        } else if (kakaoShare.sendScrap) {
          // sendDefault가 없으면 sendScrap 사용 (fallback)
          kakaoShare.sendScrap({ requestUrl: communityUrl });
        }
        
        
                setShowShareModal(false);
      } catch (error) {
        console.error("카카오톡 공유 실패:", error);
        setShowToast(true);
        setToastMessage("카카오톡 공유에 실패했습니다.");
        setShowShareModal(false);
      }
    } else {
      setShowToast(true);
      setToastMessage("카카오톡과 연결되어 있지 않습니다.");
      setShowShareModal(false);
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
  if (authLoading || isLoading || isPostLoading || !postDetailData || !post) {
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
                onClick={() => router.back()}
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

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* 게시글 내용 스켈레톤 */}
          <div className="my-3">
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
                onClick={() => router.back()}
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

  const handleImageClick = (images: string[], initialIndex: number) => {
    setImageModalData({ images, initialIndex });
    setShowImageModal(true);
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
              onClick={() => router.back()}
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

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* 게시글 내용 */}
        <div className="my-3">
          <CommunityDetail
            post={post}
            users={[
              {
                id: post.user_id,
                nickname: post.user_nickname || "사용자",
                profileImg: post.user_image || "",
              },
            ]}
            isMyPost={isMyPost || false}
            onReport={handleReport}
            onPostAction={handlePostAction}
            onUserClick={handleUserClick}
            onLoginRequired={() => setShowLoginModal(true)}
            onImageClick={handleImageClick}
          />
        </div>

        {animalId && (
          <div className="px-4 pb-4">
            {isAnimalLoading ? (
              <div className="h-[72px] rounded-lg bg-gray-100 animate-pulse" />
            ) : (
              petCardData && <PetCard pet={petCardData} variant="variant4" />
            )}
          </div>
        )}

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
        onCtaClick={() => {
          const next = `${window.location.pathname}${window.location.search}`;
          document.cookie = `redirect_after_login=${encodeURIComponent(
            next
          )}; path=/; max-age=600`;
          window.location.href = `/login?next=${encodeURIComponent(next)}`;
        }}
      />

      {/* 이미지 캐러셀 모달 */}
      <ImageCarouselModal
        open={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={imageModalData.images}
        initialIndex={imageModalData.initialIndex}
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
