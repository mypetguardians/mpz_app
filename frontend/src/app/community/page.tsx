"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bell, Plus } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { NavBar } from "@/components/common/NavBar";
import { CommunityCard, CommunityCardSkeleton } from "@/components/ui";
import { TabButton } from "@/components/ui/TabButton";
import { BigButton } from "@/components/ui/BigButton";
import { IconButton } from "@/components/ui/IconButton";
import { useGetPublicPosts } from "@/hooks/query/useGetPublicPosts";
import { useGetSystemTags } from "@/hooks/query/useGetPublicPosts";
import { useDeletePost } from "@/hooks/mutation/useDeletePost";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { CustomModal } from "@/components/ui/CustomModal";
import { Toast } from "@/components/ui/Toast";
import { useGetBanners } from "@/hooks/query/useGetBanners";

export default function CommunityPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // TODO 배너 종류 구분
  const { data: banners, isLoading: bannersLoading } = useGetBanners({
    type: "main",
  });

  // 시스템 태그 가져오기
  const { data: systemTags, isLoading: tagsLoading } = useGetSystemTags();

  // 배너 섹션 컴포넌트
  const BannerSection = () => {
    // 로딩 중이거나 배너가 없으면 섹션 자체를 렌더링하지 않음
    if (bannersLoading || !banners?.data || banners.data.length === 0) {
      return null;
    }

    return (
      <div className="px-0 py-5 border-b border-bg">
        <div className="flex py-[27px] px-5 justify-between items-center rounded-lg">
          <div className="flex gap-2">
            {banners.data.slice(0, 3).map((banner) => (
              <div key={banner.id} className="flex items-center gap-2">
                <Image
                  src={banner.image_url}
                  alt={banner.alt}
                  width={32}
                  height={32}
                  className="object-fill w-8 h-8 rounded"
                />
                <span className="text-sm text-brand">{banner.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 기본 탭과 시스템 태그를 조합하여 탭 옵션 생성
  const tabs = useMemo(() => {
    const baseTabs = [{ label: "최신글", value: "latest" }];

    if (systemTags && Array.isArray(systemTags)) {
      const tagTabs = systemTags.map((tag) => {
        return {
          label: `#${tag.name}`,
          value: tag.name,
        };
      });
      const finalTabs = [...baseTabs, ...tagTabs];
      return finalTabs;
    }

    return baseTabs;
  }, [systemTags]);

  const [activeTab, setActiveTab] = useState("latest");

  // systemTags가 로드된 후 activeTab 업데이트
  useEffect(() => {
    if (systemTags && systemTags.length > 0 && activeTab === "latest") {
      // 기본값은 "latest"로 유지
    }
  }, [systemTags, activeTab]);

  // 실제 posts 데이터 가져오기
  const {
    data: postsData,
    isLoading,
    error,
  } = useGetPublicPosts({
    tags: activeTab !== "latest" ? [activeTab] : undefined,
    // 센터공개, 전체공개 옵션
  });

  // 게시글 삭제 훅
  const deletePostMutation = useDeletePost();

  const posts = postsData?.posts || [];

  const currentUserId = user?.id;

  const handleUserClick = (userId: string) => {
    router.push(`/community/user/${userId}`);
  };

  const handleWritePost = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
    } else {
      router.push("/community/upload");
    }
  };

  const handleEditPost = (postId: string) => {
    router.push(`/community/edit/${postId}`);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePostMutation.mutateAsync(postId);

      // 삭제 성공 후 관련 쿼리 강제 리패치
      await queryClient.invalidateQueries({
        queryKey: ["posts"],
      });

      // 강제로 리패치 실행
      await queryClient.refetchQueries({
        queryKey: ["posts"],
      });

      setToastMessage("삭제 완료되었습니다.");
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
      setToastMessage("삭제에 실패했습니다.");
      setShowToast(true);
    }
  };

  // 로딩 상태
  if (isLoading || tagsLoading) {
    return (
      <Container className="relative flex flex-col h-screen bg-white">
        <TopBar
          variant="variant5"
          left={<h2>커뮤니티</h2>}
          right={
            <IconButton
              icon={({ size }) => <Bell size={size} weight="bold" />}
              size="iconM"
            />
          }
        />
        <div className="w-full overflow-x-auto scrollbar-hide">
          {/* 탭 스켈레톤 */}
          <div className="flex gap-2 px-4 py-3">
            <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="flex-1 mx-4 overflow-y-auto">
          {/* 게시글 스켈레톤 */}
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index}>
                {(index === 0 || (index + 1) % 3 === 0) && <BannerSection />}
                <div className="pt-4">
                  <CommunityCardSkeleton />
                </div>
              </div>
            ))}
          </div>
        </div>
        <NavBar />
      </Container>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Container className="relative flex flex-col h-screen bg-white">
        <TopBar
          variant="variant5"
          left={<h2>커뮤니티</h2>}
          right={
            <IconButton
              icon={({ size }) => <Bell size={size} weight="bold" />}
              size="iconM"
            />
          }
        />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="mb-2 text-red-500">
              데이터를 불러오는데 실패했습니다.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              다시 시도
            </button>
          </div>
        </div>
        <NavBar />
      </Container>
    );
  }

  return (
    <Container className="relative flex flex-col h-screen bg-white">
      <TopBar
        variant="variant5"
        left={<h2>커뮤니티</h2>}
        right={
          <IconButton
            icon={({ size }) => <Bell size={size} weight="bold" />}
            size="iconM"
          />
        }
      />
      <div className="w-full overflow-x-auto scrollbar-hide">
        <TabButton
          value={activeTab}
          onValueChange={setActiveTab}
          tabs={tabs}
          variant="primary"
        />
        {(() => {
          return null;
        })()}
      </div>
      <div className="flex-1 mx-4 overflow-y-auto">
        {isLoading ? (
          // 로딩 중일 때 스켈레톤 표시
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index}>
                {(index === 0 || (index + 1) % 3 === 0) && <BannerSection />}
                <div className="pt-4">
                  <CommunityCardSkeleton />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h5 className="text-sm text-lg text-center">
              아직 업로드된 게시글이 없어요.
              <br />첫 번째 게시글을 작성해보세요!
            </h5>
          </div>
        ) : (
          <div className="cursor-pointer">
            {posts.map((post, index) => (
              <div key={post.id}>
                {(index === 0 || (index + 1) % 3 === 0) && <BannerSection />}
                <div className="pt-4">
                  <a href={`/community/${post.id}`} className="block">
                    <CommunityCard
                      item={post}
                      users={[
                        {
                          id: post.userId,
                          nickname: post.userNickname,
                          image: post.userImage,
                          createdAt: post.createdAt,
                        },
                      ]}
                      variant="variant3"
                      onUserClick={handleUserClick}
                      currentUserId={currentUserId}
                      onEditPost={handleEditPost}
                      onDeletePost={handleDeletePost}
                    />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="h-20" />
      </div>

      {/* 글쓰기 플로팅 버튼 */}
      <div className="absolute z-50 bottom-24 right-4">
        <BigButton
          variant="primary"
          left={<Plus size={16} />}
          onClick={handleWritePost}
          className="px-6"
        >
          글쓰기
        </BigButton>
      </div>

      {/* 토스트 */}
      {showToast && (
        <div className="fixed bottom-4 left-4 right-4 z-[10000]">
          <Toast>{toastMessage}</Toast>
        </div>
      )}

      <NavBar />

      {/* 로그인 모달 */}
      <CustomModal
        open={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="로그인 후 이용해주세요."
        description="원활한 사용을 위해 로그인이 필요해요."
        variant="variant2"
        onCtaClick={() => {
          setIsLoginModalOpen(false);
          router.push("/login");
        }}
        onSubLinkClick={() => {
          setIsLoginModalOpen(false);
          router.push("/login");
        }}
      />
    </Container>
  );
}
