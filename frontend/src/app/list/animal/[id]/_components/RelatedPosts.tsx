import React from "react";
import { CommunityCard } from "@/components/ui/CommunityCard";
import { MiniButton } from "@/components/ui/MiniButton";
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

  return data.data;
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
  const PAGE_SIZE = 5;
  const [page, setPage] = React.useState(1);
  const [accumulatedPosts, setAccumulatedPosts] = React.useState<
    Array<ApiPostResponse | Post>
  >([]);
  const [nextPage, setNextPage] = React.useState<number | null>(null);

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

  // 실제로 현재 동물과 연관된 게시물만 필터링
  const filteredPosts = React.useMemo(() => {
    const relatedPosts = extractPosts(postsData);

    return relatedPosts.filter(
      (post) => post.animal_id === currentPet.id
    ) as Array<ApiPostResponse | Post>;
  }, [postsData, currentPet.id]);

  React.useEffect(() => {
    if (!postsData) {
      return;
    }

    setNextPage(extractNextPage(postsData));

    setAccumulatedPosts((prev) => {
      if (page === 1) {
        return filteredPosts;
      }

      const mergedPosts = [...prev];
      const existingIds = new Set(prev.map((post) => post.id));

      filteredPosts.forEach((post) => {
        if (!existingIds.has(post.id)) {
          mergedPosts.push(post);
        }
      });

      return mergedPosts;
    });
  }, [filteredPosts, page, postsData]);

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
      <div className="mx-4 my-3">
        <h2 className="text-bk mb-4">{title}</h2>
        <div className="text-center py-4 text-red-500">
          게시물을 불러오는데 실패했습니다
        </div>
      </div>
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
                <CommunityCard
                  item={post as Post}
                  users={[]}
                  variant="primary"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>아직 이 아이에 대한 게시물이 없어요</p>
          </div>
        )}
      </div>
      {Boolean(error) && displayPosts.length > 0 && (
        <div className="text-center text-sm text-red-500">
          게시물을 불러오는데 실패했습니다. 다시 시도해 주세요.
        </div>
      )}
      {displayPosts.length > 0 && hasMore && (
        <MiniButton
          text={isFetchingNext ? "불러오는 중..." : "더보기"}
          variant="filterOff"
          className="py-4 w-full"
          disabled={isFetchingNext}
          onClick={handleLoadMore}
        />
      )}
    </div>
  );
}
