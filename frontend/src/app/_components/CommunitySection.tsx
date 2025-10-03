import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";
import { MiniButton } from "@/components/ui/MiniButton";
import { CommunityCard } from "@/components/ui/CommunityCard";
import { MainSection } from "@/components/common/MainSection";
import { useGetPublicPosts } from "@/hooks/query/useGetPublicPosts";
import type { ApiPostResponse, Post } from "@/types/posts";
import type { User } from "@/types/auth";

interface CommunitySectionProps {
  users?: User[];
}

export function CommunitySection({ users = [] }: CommunitySectionProps) {
  const router = useRouter();

  const {
    data: postsData,
    isLoading,
    error,
  } = useGetPublicPosts({
    page: 1,
    page_size: 3,
    tags: ["입양후기"],
  });

  // "입양후기" 태그 필터링
  const adoptionReviewPosts =
    postsData?.data?.filter(
      (post) =>
        Array.isArray(post.tags) &&
        post.tags.some((t) => t.tag_name === "입양후기")
    ) || [];

  const handleMorePosts = () => {
    router.push("/community");
  };

  // 로딩 중이거나 에러가 있을 때 처리
  if (isLoading) {
    return (
      <MainSection title="커뮤니티">
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </MainSection>
    );
  }

  if (error) {
    return (
      <MainSection title="커뮤니티">
        <div className="py-8 text-center text-gray-500">
          게시물을 불러올 수 없습니다.
        </div>
      </MainSection>
    );
  }

  // 게시글이 없는 경우
  if (!adoptionReviewPosts || adoptionReviewPosts.length === 0) {
    return (
      <MainSection title="커뮤니티">
        <div className="py-8 text-center">
          <div className="mb-4 text-sm text-lg">
            아직 업로드된 게시글이 없어요.
            <br />첫 번째 게시글을 작성해보세요!
          </div>
        </div>
        <MiniButton
          text="첫 글 작성하기"
          variant="filterOff"
          className="w-full py-4"
          rightIcon={<CaretDown size={12} />}
          onClick={() => router.push("/community/upload")}
        />
      </MainSection>
    );
  }

  return (
    <MainSection title="커뮤니티">
      <div className="flex flex-col gap-4">
        {adoptionReviewPosts.map((item: ApiPostResponse) => (
          <div
            key={item.id}
            className="cursor-pointer"
            onClick={() => router.push(`/community/${item.id}`)}
          >
            <CommunityCard
              item={item as unknown as Post}
              users={users}
              variant="primary"
            />
          </div>
        ))}
      </div>
      <MiniButton
        text="스토리 더보기"
        variant="filterOff"
        className="w-full py-4"
        rightIcon={<CaretDown size={12} />}
        onClick={handleMorePosts}
      />
    </MainSection>
  );
}
