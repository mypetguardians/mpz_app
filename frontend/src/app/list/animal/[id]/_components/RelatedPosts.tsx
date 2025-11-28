import React from "react";
import Link from "next/link";
import { CommunityCard } from "@/components/ui/CommunityCard";
import { MiniButton, NotificationToast } from "@/components/ui";
import { useGetPublicPosts } from "@/hooks/query/useGetPublicPosts";
import { useGetCenterPosts } from "@/hooks/query/useGetCenterPosts";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Animal } from "@/types/animal";
import type { ApiPostResponse, ApiPostsResponse, Post } from "@/types/posts";

type CenterPostsData = {
  data: Post[];
  posts: Post[];
  pagination: {
    count: number;
    totalCnt: number;
    pageCnt: number;
    curPage: number;
    nextPage: number;
    previousPage: number;
  };
};

type PostsQueryResult = ApiPostResponse[] | Post[];

const extractPosts = (
  data?: ApiPostsResponse | CenterPostsData
): PostsQueryResult => {
  if (!data) {
    return [];
  }

  // ApiPostsResponse와 CenterPostsData 모두 data 속성을 가지고 있음
  if ("data" in data && Array.isArray(data.data)) {
    return data.data;
  }

  return [];
};

const extractNextPage = (
  data?: ApiPostsResponse | CenterPostsData
): number | null => {
  if (!data) {
    return null;
  }

  if ("pagination" in data) {
    const value = data.pagination?.nextPage;
    return typeof value === "number" && value > 0 ? value : null;
  }

  const value = data.nextPage;
  return typeof value === "number" && value > 0 ? value : null;
};

interface RelatedPostsProps {
  currentPet: Animal;
  title?: string;
}

export default function RelatedPosts({
  currentPet,
  title = "이 아이에 대해 더 알고싶다면",
}: RelatedPostsProps) {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const PAGE_SIZE = 3;
  const [page, setPage] = React.useState(1);
  const [accumulatedPosts, setAccumulatedPosts] = React.useState<
    Array<ApiPostResponse | Post>
  >([]);
  const [nextPage, setNextPage] = React.useState<number | null>(null);
  const [toast, setToast] = React.useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "error" });

  // 센터 사용자 체크
  const isCenterUser =
    !authLoading &&
    isAuthenticated &&
    (user?.userType === "센터관리자" ||
      user?.userType === "훈련사" ||
      user?.userType === "센터최고관리자");

  const postsQueryParams = React.useMemo(
    () => ({
      animalId: currentPet.id,
      page,
      page_size: PAGE_SIZE,
    }),
    [currentPet.id, page]
  );

  // 센터권한자용 게시물 조회 (로그인한 센터 사용자만)
  const centerPostsQuery = useGetCenterPosts(postsQueryParams, {
    enabled: !authLoading && isAuthenticated && isCenterUser,
  });

  // 일반 사용자용 게시물 조회 (미로그인 및 일반 사용자)
  const publicPostsQuery = useGetPublicPosts(postsQueryParams);

  // 권한에 따라 적절한 쿼리 선택
  const activeQuery =
    isCenterUser && !centerPostsQuery.error
      ? centerPostsQuery
      : publicPostsQuery;

  const postsData = activeQuery.data;
  const isLoading = activeQuery.isLoading;
  const isFetching = activeQuery.isFetching;
  const error = activeQuery.error;
  const refetch = activeQuery.refetch;

  React.useEffect(() => {
    setPage(1);
    setAccumulatedPosts([]);
    setNextPage(null);
  }, [currentPet.id, isCenterUser]);

  const filteredPosts = React.useMemo(() => {
    if (!postsData) {
      return [];
    }

    const relatedPosts = extractPosts(postsData);

    if (!relatedPosts || relatedPosts.length === 0) {
      return [];
    }

    // animal_id가 일치하는 게시물만 필터링 (null이 아닌 경우만)
    const filtered = relatedPosts.filter((post) => {
      const postAnimalId = (post as ApiPostResponse | Post).animal_id;
      return postAnimalId !== null && postAnimalId === currentPet.id;
    });

    return filtered as Array<ApiPostResponse | Post>;
  }, [postsData, currentPet.id]);

  React.useEffect(() => {
    if (!postsData) {
      return;
    }

    const nextPageValue = extractNextPage(postsData);
    setNextPage(nextPageValue);
  }, [postsData]);

  // filteredPosts가 변경될 때마다 accumulatedPosts 업데이트
  React.useEffect(() => {
    setAccumulatedPosts((prev) => {
      if (page === 1) {
        // 첫 페이지인 경우 filteredPosts로 완전히 교체
        return filteredPosts;
      }

      // 이후 페이지인 경우 기존 게시물에 추가
      const mergedPosts = [...prev];
      const existingIds = new Set(prev.map((post) => post.id));

      filteredPosts.forEach((post) => {
        if (!existingIds.has(post.id)) {
          mergedPosts.push(post);
        }
      });

      return mergedPosts;
    });
  }, [filteredPosts, page]);

  const displayPosts = accumulatedPosts;
  const hasMore = nextPage !== null;
  const isInitialLoading = isLoading && displayPosts.length === 0;
  const isFetchingNext = isFetching && !isInitialLoading;

  const handleLoadMore = React.useCallback(() => {
    if (!hasMore || isFetchingNext) {
      return;
    }

    if (nextPage === null) {
      return;
    }

    if (nextPage === page) {
      void refetch();
      return;
    }

    setPage(nextPage);
  }, [hasMore, isFetchingNext, nextPage, page, refetch]);

  // 에러 발생 시 토스트 표시
  React.useEffect(() => {
    if (error) {
      setToast({
        show: true,
        message: "게시물을 불러오는데 실패했습니다. 다시 시도해 주세요.",
        type: "error",
      });
    }
  }, [error]);

  if (isInitialLoading) {
    return (
      <div className="mx-4 my-3">
        <h2 className="text-bk mb-4">{title}</h2>
        <div className="text-center py-4 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error && displayPosts.length === 0) {
    return (
      <>
        <div className="mx-4 my-3">
          <h2 className="text-bk mb-4">{title}</h2>
          <div className="text-center py-4 text-red-500">
            게시물을 불러오는데 실패했습니다
          </div>
        </div>
        {toast.show && (
          <NotificationToast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </>
    );
  }

  return (
    <div className="mx-4 my-3 flex flex-col gap-4">
      <div>
        <h2 className="text-bk mb-4">{title}</h2>
        {displayPosts.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {displayPosts.map((post) => (
              <div key={post.id} className="flex-shrink-1 w-full">
                <Link href={`/community/${post.id}`} className="block">
                  <CommunityCard
                    item={post as Post}
                    users={[]}
                    variant="primary"
                  />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>아직 이 아이에 대한 게시물이 없어요</p>
          </div>
        )}
      </div>
      {displayPosts.length >= 3 && hasMore && (
        <MiniButton
          text={isFetchingNext ? "불러오는 중..." : "더보기"}
          variant="filterOff"
          className="py-4 w-full"
          disabled={isFetchingNext}
          onClick={handleLoadMore}
        />
      )}

      {/* Toast 알림 */}
      {toast.show && (
        <NotificationToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
