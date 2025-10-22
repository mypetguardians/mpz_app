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
import { useGetComments } from "@/hooks/query/useGetComments";
import { useGetNotifications } from "@/hooks/query/useGetNotifications";
import { useDeletePost } from "@/hooks/mutation/useDeletePost";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
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

  // 알림 관련 hooks (메인페이지와 동일한 로직)
  const { data: notificationsData } = useGetNotifications();
  const { unreadCount: socketUnreadCount, isConnected } =
    useNotificationSocket();

  // 읽지 않은 알림이 있는지 확인 (소켓 연결 시 소켓 데이터 우선, 아니면 API 데이터)
  const hasUnreadNotifications = isAuthenticated
    ? isConnected && socketUnreadCount > 0
      ? true
      : notificationsData?.data?.some(
          (notification) => notification.is_read === false
        )
    : false;

  const {
    data: banners,
    isLoading: bannersLoading,
    refetch: refetchBanners,
  } = useGetBanners({
    type: "sub",
  });

  // 시스템 태그 가져오기
  const {
    data: systemTags,
    isLoading: tagsLoading,
    refetch: refetchSystemTags,
  } = useGetSystemTags();

  // 배너 섹션 컴포넌트
  const BannerSection = () => {
    // 로딩 중이거나 배너가 없으면 섹션 자체를 렌더링하지 않음
    if (bannersLoading || !banners?.data || banners.data.length === 0) {
      return null;
    }

    const targetBanner = banners.data[0];

    return (
      <div className="py-5">
        <div className="relative w-full h-20 overflow-hidden rounded-lg cursor-pointer">
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
                <span className="text-sm font-medium text-white">
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
    const baseTabs = [{ label: "전체", value: "latest" }];

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

  // URL 동기화 없이 프론트 상태로만 필터링

  // API에는 태그 파라미터를 넘기지 않음 (클라이언트 측 필터링)
  const apiParams = useMemo(() => ({} as const), []);

  // 센터권한자용 게시글 조회
  const {
    data: centerPostsData,
    isLoading: centerPostsLoading,
    error: centerPostsError,
    refetch: refetchCenterPosts,
  } = useGetCenterPosts(apiParams);

  // 일반 사용자용 게시글 조회
  const {
    data: publicPostsData,
    isLoading: publicPostsLoading,
    error: publicPostsError,
    refetch: refetchPublicPosts,
  } = useGetPublicPosts(apiParams);

  // 모든 게시글을 합쳐서 표시
  const allPosts = useMemo(() => {
    const centerPosts = centerPostsData?.data || [];
    const publicPosts = publicPostsData?.data || [];
    const combined = [...centerPosts, ...publicPosts];
    return combined;
  }, [centerPostsData, publicPostsData]);

  const postsData = useMemo(() => ({ data: allPosts }), [allPosts]);
  const isLoading = centerPostsLoading || publicPostsLoading;
  const error = centerPostsError || publicPostsError;

  // 페이지 마운트 시 및 사용자 타입 변경 시 모든 데이터 새로고침
  useEffect(() => {
    const refreshAllData = async () => {
      try {
        // 모든 데이터를 병렬로 새로고침
        await Promise.all([
          refetchBanners(),
          refetchSystemTags(),
          refetchCenterPosts(),
          refetchPublicPosts(),
        ]);
      } catch (error) {
        console.error("데이터 새로고침 실패:", error);
      }
    };

    refreshAllData();
  }, [
    refetchBanners,
    refetchSystemTags,
    refetchCenterPosts,
    refetchPublicPosts,
  ]); // 페이지 마운트 시 실행

  // 게시글 삭제 훅
  const deletePostMutation = useDeletePost();

  const posts: Post[] = useMemo(() => {
    const list = postsData?.data as Post[] | undefined;
    return list ?? [];
  }, [postsData]);

  // 댓글 수를 포함한 CommunityCard 컴포넌트
  const CommunityCardWithComments = ({
    post,
  }: {
    post: Post;
    index: number;
  }) => {
    const { data: commentsData } = useGetComments(post.id);

    // 실제 댓글 수 계산 (메인 댓글 + 대댓글)
    const actualCommentCount = useMemo(() => {
      if (!commentsData?.data) return post.comment_count || 0;

      const mainComments = commentsData.data.length;
      const repliesCount = commentsData.data.reduce(
        (total, comment) => total + (comment.replies?.length || 0),
        0
      );

      return mainComments + repliesCount;
    }, [commentsData, post.comment_count]);

    // Post 객체에 계산된 댓글 수를 적용
    const postWithCorrectCount = {
      ...post,
      comment_count: actualCommentCount,
    };

    return (
      <div key={post.id}>
        <div className="pt-4">
          <a href={`/community/${post.id}`} className="block">
            <CommunityCard
              item={postWithCorrectCount}
              users={[
                {
                  id: post.user_id,
                  nickname: post.user_nickname,
                  image: post.user_image,
                  createdAt: post.created_at,
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
    );
  };

  const filteredPosts: Post[] = useMemo(() => {
    let filtered = posts;

    // 탭 필터링
    if (activeTab !== "latest") {
      const selected = activeTab.toLowerCase();
      filtered = posts.filter((p) =>
        p.tags?.some((t) => (t.tag_name || "").toLowerCase() === selected)
      );
    }

    // 중복 제거 (id 기준으로)
    const uniquePosts = filtered.reduce((acc, current) => {
      const existingPost = acc.find((post) => post.id === current.id);
      if (!existingPost) {
        acc.push(current);
      }
      return acc;
    }, [] as Post[]);

    return uniquePosts;
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
        queryKey: ["center-posts", "public-posts"],
      });

      // 강제로 리패치 실행
      await queryClient.refetchQueries({
        queryKey: ["center-posts", "public-posts"],
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
            isAuthenticated ? (
              <Link href="/notifications">
                <div className="relative">
                  <IconButton
                    icon={({ size }) => <Bell size={size} weight="bold" />}
                    size="iconM"
                  />
                  {hasUnreadNotifications && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red rounded-full"></div>
                  )}
                </div>
              </Link>
            ) : (
              <Link href="/login">
                <IconButton
                  icon={({ size }) => <Bell size={size} weight="bold" />}
                  size="iconM"
                />
              </Link>
            )
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
        <div className="flex-1 mx-4 overflow-y-auto scrollbar-hide">
          {/* 게시글 스켈레톤 */}
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index}>
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
            isAuthenticated ? (
              <Link href="/notifications">
                <div className="relative">
                  <IconButton
                    icon={({ size }) => <Bell size={size} weight="bold" />}
                    size="iconM"
                  />
                  {hasUnreadNotifications && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red rounded-full"></div>
                  )}
                </div>
              </Link>
            ) : (
              <Link href="/login">
                <IconButton
                  icon={({ size }) => <Bell size={size} weight="bold" />}
                  size="iconM"
                />
              </Link>
            )
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
          isAuthenticated ? (
            <Link href="/notifications">
              <div className="relative">
                <IconButton
                  icon={({ size }) => <Bell size={size} weight="bold" />}
                  size="iconM"
                />
                {hasUnreadNotifications && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red rounded-full"></div>
                )}
              </div>
            </Link>
          ) : (
            <Link href="/login">
              <IconButton
                icon={({ size }) => <Bell size={size} weight="bold" />}
                size="iconM"
              />
            </Link>
          )
        }
      />
      <div className="w-full overflow-x-auto scrollbar-hide">
        <TabButton
          value={activeTab}
          onValueChange={setActiveTab}
          tabs={tabs}
          variant="primary"
        />
      </div>
      {/* 상단 고정 배너 */}
      <div className="mx-4">
        <BannerSection />
      </div>
      <div
        className="flex-1 mx-4 overflow-y-auto scrollbar-hide"
        key={activeTab}
      >
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
          <div className="flex flex-col items-center justify-center h-full">
            <h5 className="text-sm text-lg text-center">
              아직 업로드된 게시글이 없어요.
              <br />첫 번째 게시글을 작성해보세요!
            </h5>
          </div>
        ) : (
          <div className="cursor-pointer">
            {filteredPosts.map((post, index) => (
              <CommunityCardWithComments
                key={`${post.id}-${index}`}
                post={post}
                index={index}
              />
            ))}
          </div>
        )}
        <div className="h-20" />
      </div>

      {/* 글쓰기 플로팅 버튼 */}
      <div className="fixed z-50 translate-x-20 bottom-20 left-1/2">
        <BigButton
          variant="primary"
          left={<Plus size={16} />}
          onClick={handleWritePost}
          className="px-3"
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
