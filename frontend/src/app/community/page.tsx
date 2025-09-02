"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Bell, Plus } from "@phosphor-icons/react";

import { Container } from "@/components/common/Container";
import { TopBar } from "@/components/common/TopBar";
import { NavBar } from "@/components/common/NavBar";
import { CommunityCard, CommunityCardSkeleton } from "@/components/ui";
import { TabButton } from "@/components/ui/TabButton";
import { BigButton } from "@/components/ui/BigButton";
import { IconButton } from "@/components/ui/IconButton";
import { useGetPublicPosts } from "@/hooks/query/useGetPublicPosts";
import { useGetCenterPosts } from "@/hooks/query/useGetCenterPosts";
import { useGetSystemTags } from "@/hooks/query/useGetSystemTags";
import { useDeletePost } from "@/hooks/mutation/useDeletePost";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { CustomModal } from "@/components/ui/CustomModal";
import { Toast } from "@/components/ui/Toast";
import { useGetBanners } from "@/hooks/query/useGetBanners";
import { Post } from "@/types/posts";

export default function CommunityPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { data: banners, isLoading: bannersLoading } = useGetBanners({
    type: "sub",
  });

  // 시스템 태그 가져오기
  const { data: systemTags, isLoading: tagsLoading } = useGetSystemTags();

  // 배너 섹션 컴포넌트
  const BannerSection = () => {
    // 로딩 중이거나 배너가 없으면 섹션 자체를 렌더링하지 않음
    if (bannersLoading || !banners?.data || banners.data.length === 0) {
      return null;
    }

    const targetBanner = banners.data[0];

    return (
      <div className="py-5">
        <div className="relative w-full h-20 rounded-lg overflow-hidden cursor-pointer">
          {bannersLoading ? (
            <div className="w-full h-full bg-gray-200 animate-pulse" />
          ) : (
            <>
              <Image
                // TODO: targetBanner.image_url
                src="/img/banner.jpg"
                alt={targetBanner.alt}
                fill
                className="object-cover"
                onClick={() => {
                  if (targetBanner.link_url) {
                    window.open(targetBanner.link_url, "_blank");
                  }
                }}
              />
              <div className="absolute inset-0 flex items-center px-5">
                <span className="text-sm text-white font-medium">
                  {targetBanner.title}
                </span>
              </div>
            </>
          )}
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

  // 사용자 권한에 따라 적절한 API 호출
  const isCenterUser =
    user?.userType === "센터관리자" ||
    user?.userType === "훈련사" ||
    user?.userType === "센터최고관리자";

  // 센터권한자용 게시글 조회
  const {
    data: centerPostsData,
    isLoading: centerPostsLoading,
    error: centerPostsError,
  } = useGetCenterPosts({
    tags: activeTab !== "latest" ? [activeTab] : undefined,
  });

  // 일반 사용자용 게시글 조회
  const {
    data: publicPostsData,
    isLoading: publicPostsLoading,
    error: publicPostsError,
  } = useGetPublicPosts({
    tags: activeTab !== "latest" ? [activeTab] : undefined,
  });

  // 권한에 따라 적절한 데이터 선택 및 필터링
  let postsData = isCenterUser ? centerPostsData : publicPostsData;

  // 일반 사용자인 경우 전체공개 게시글만 필터링
  if (!isCenterUser && publicPostsData?.data) {
    const filteredAllAccess = publicPostsData.data.filter(
      (post) => post.isAllAccess
    );
    postsData = {
      ...publicPostsData,
      data: filteredAllAccess,
      posts: filteredAllAccess,
    };
  }

  const isLoading = isCenterUser ? centerPostsLoading : publicPostsLoading;
  const error = isCenterUser ? centerPostsError : publicPostsError;

  // 게시글 삭제 훅
  const deletePostMutation = useDeletePost();

  const posts: Post[] = useMemo(() => {
    const list = (postsData?.posts ?? postsData?.data) as Post[] | undefined;
    return list ?? [];
  }, [postsData]);

  type TagLike =
    | string
    | { tagName?: string; tag_name?: string; name?: string };

  const filteredPosts: Post[] = useMemo(() => {
    if (activeTab === "latest") return posts;
    const getTagText = (tag: TagLike): string => {
      if (!tag) return "";
      if (typeof tag === "string") return tag;
      return tag.tagName || tag.tag_name || tag.name || "";
    };
    return posts.filter((p: Post) => {
      const tagList = (p.tags as unknown as TagLike[]) ?? [];
      return tagList.some((t: TagLike) => getTagText(t) === activeTab);
    });
  }, [posts, activeTab]);

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
        queryKey: isCenterUser ? ["center-posts"] : ["public-posts"],
      });

      // 강제로 리패치 실행
      await queryClient.refetchQueries({
        queryKey: isCenterUser ? ["center-posts"] : ["public-posts"],
      });

      setToastMessage("삭제 완료되었습니다.");
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
      setToastMessage("삭제에 실패했습니다!");
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
            <Link href="/community/notifications">
              <IconButton
                icon={({ size }) => <Bell size={size} weight="bold" />}
                size="iconM"
              />
            </Link>
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
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col h-full items-center justify-center">
            <h5 className="text-lg text-sm text-center">
              아직 업로드된 게시글이 없어요.
              <br />첫 번째 게시글을 작성해보세요!
            </h5>
          </div>
        ) : (
          <div className="cursor-pointer">
            {filteredPosts.map((post, index) => (
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
