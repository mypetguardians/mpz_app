"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ShareNetwork, User } from "@phosphor-icons/react";
import { useEffect, useState, useRef } from "react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { CommunityCard } from "@/components/ui/CommunityCard";
import { IconButton } from "@/components/ui/IconButton";
import { CustomModal } from "@/components/ui/CustomModal";
import { Toast } from "@/components/ui/Toast";
import { useKakaoSDK } from "@/hooks/useKakaoSDK";

import type { Post } from "@/types/posts";
import { useGetPublicPosts } from "@/hooks";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { isLoaded, isInitialized } = useKakaoSDK();
  const [page, setPage] = useState(1);
  const [accumulatedPosts, setAccumulatedPosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data: postsData,
    isLoading: isPostsLoading,
    isFetching,
    error: postsError,
  } = useGetPublicPosts({
    user_id: userId,
    page,
    page_size: 10,
  });

  // 페이지 변경 시 데이터 누적
  useEffect(() => {
    if (!postsData) return;

    const newPosts = postsData.data || [];
    const hasNextPage = postsData.nextPage !== null && postsData.nextPage > 0;

    setNextPage(hasNextPage ? postsData.nextPage : null);

    setAccumulatedPosts((prev) => {
      if (page === 1) {
        return newPosts as Post[];
      }

      const existingIds = new Set(prev.map((post) => post.id));
      const uniqueNewPosts = newPosts.filter(
        (post) => !existingIds.has(post.id)
      ) as Post[];

      return [...prev, ...uniqueNewPosts];
    });
  }, [postsData, page]);

  // userId 변경 시 초기화
  useEffect(() => {
    setPage(1);
    setAccumulatedPosts([]);
    setNextPage(null);
  }, [userId]);

  // 무한 스크롤 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          nextPage !== null &&
          !isFetching &&
          !isPostsLoading
        ) {
          setPage(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [nextPage, isFetching, isPostsLoading]);

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
      window.Kakao.Share &&
      window.Kakao.Share.sendScrap
    ) {
      try {
        const userProfileUrl = window.location.href;
        window.Kakao.Share.sendScrap({ requestUrl: userProfileUrl });
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

  // 초기 로딩 상태 처리
  const isInitialLoading = isPostsLoading && accumulatedPosts.length === 0;

  if (isInitialLoading) {
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
              <h2>작성자가 쓴 다른 글</h2>
            </div>
          }
        />
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </Container>
    );
  }

  // 에러 상태 처리
  if (postsError) {
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
              <h2>작성자가 쓴 다른 글</h2>
            </div>
          }
        />
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-gray-500">데이터를 불러오는데 실패했습니다.</p>
        </div>
      </Container>
    );
  }

  const userPosts = accumulatedPosts;

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
          </div>
        }
        center={
          <h4>
            {userPosts.length > 0
              ? userPosts[0].user_nickname || "사용자"
              : "사용자"}
            님이 쓴 다른 글
          </h4>
        }
        right={
          <IconButton
            icon={({ size }) => <ShareNetwork size={size} weight="bold" />}
            size="iconM"
            onClick={() => setShowShareModal(true)}
          />
        }
      />
      <div className="px-4 py-3">
        {/* 사용자 프로필 헤더 */}
        {userPosts.length > 0 ? (
          <div className="flex flex-col items-center gap-2 mx-auto pb-6 border-b border-bg">
            {userPosts[0].user_image && userPosts[0].user_image !== "" ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={userPosts[0].user_image}
                  alt={userPosts[0].user_nickname}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    console.error("ProfileInfo Image load error:", e);
                  }}
                />
              </div>
            ) : (
              <div
                className={`w-16 h-16 bg-lg flex items-center justify-center p-1 rounded-full`}
              >
                <User size={40} weight="regular" className="text-gr" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-bk">
                {userPosts[0].user_nickname || "사용자"}
              </h3>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 mx-auto pb-6 border-b border-bg">
            <div className="relative w-16 h-16 rounded-full overflow-hidden">
              {userPosts[0]?.user_image && userPosts[0].user_image !== "" ? (
                <Image
                  src={userPosts[0].user_image}
                  alt={userPosts[0].user_nickname || "사용자"}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    console.error("ProfileInfo Image load error:", e);
                  }}
                />
              ) : (
                <div
                  className={`w-full h-full bg-lg flex items-center justify-center rounded-full`}
                >
                  <User size={40} weight="regular" className="text-gr" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-bk">사용자</h3>
            </div>
          </div>
        )}

        <div>
          {userPosts.length === 0 ? (
            <div className="flex flex-col pt-12 items-center justify-center">
              <h5 className="text-gr text-center">
                아직 업로드된 게시글이 없어요.
              </h5>
            </div>
          ) : (
            <div className="cursor-pointer">
              {userPosts.map((item) => (
                <div key={item.id} className="py-4">
                  <a href={`/community/${item.id}`} className="block">
                    <CommunityCard
                      item={item as unknown as Post}
                      users={[]}
                      variant="variant3"
                    />
                  </a>
                </div>
              ))}
              {/* 무한 스크롤 감지 타겟 */}
              {nextPage !== null && (
                <div ref={observerTarget} className="py-4">
                  {isFetching && (
                    <div className="text-center text-gray-500 py-4">
                      불러오는 중...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="h-20" />
        </div>
      </div>

      {/* 공유 모달 */}
      <CustomModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="프로필 공유하기"
        variant="variant4"
        onKakaoShare={handleKakaoShare}
        onCopyLink={handleCopyLink}
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
