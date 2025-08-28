import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";
import { MiniButton } from "@/components/ui/MiniButton";
import { CommunityCard } from "@/components/ui/CommunityCard";
import { MainSection } from "@/components/common/MainSection";
import { useGetPublicPosts } from "@/hooks/query/useGetPublicPosts";
import type { Post } from "@/types/posts";
import type { user } from "@/db/schema/auth";

type User = Omit<typeof user.$inferSelect, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

interface CommunitySectionProps {
  users?: User[]; // users는 선택적으로 변경
}

export function CommunitySection({ users = [] }: CommunitySectionProps) {
  const router = useRouter();

  // useGetPosts 훅을 사용하여 최신 게시물 3개를 가져옴
  const {
    data: postsData,
    isLoading,
    error,
  } = useGetPublicPosts({
    page: 1,
    limit: 3,
  });

  const handleMorePosts = () => {
    router.push("/community");
  };

  // 로딩 중이거나 에러가 있을 때 처리
  if (isLoading) {
    return (
      <MainSection title="누군가의 가족이 된 순간들">
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </MainSection>
    );
  }

  if (error) {
    return (
      <MainSection title="누군가의 가족이 된 순간들">
        <div className="text-center text-gray-500 py-8">
          게시물을 불러올 수 없습니다.
        </div>
      </MainSection>
    );
  }

  // 게시글이 없는 경우
  if (!postsData?.posts || postsData.posts.length === 0) {
    return (
      <MainSection title="누군가의 가족이 된 순간들">
        <div className="text-center py-8">
          <div className="text-lg text-sm mb-4">
            아직 업로드된 게시글이 없어요.
            <br />첫 번째 게시글을 작성해보세요!
          </div>
        </div>
        <MiniButton
          text="첫 글 작성하기"
          variant="filterOff"
          className="py-4 w-full"
          rightIcon={<CaretDown size={12} />}
          onClick={() => router.push("/community/upload")}
        />
      </MainSection>
    );
  }

  return (
    <MainSection title="누군가의 가족이 된 순간들">
      <div className="flex flex-col gap-4">
        {postsData.posts.map((item: Post) => (
          <div
            key={item.id}
            className="cursor-pointer"
            onClick={() => router.push(`/community/${item.id}`)}
          >
            <CommunityCard item={item} users={users} variant="primary" />
          </div>
        ))}
      </div>
      <MiniButton
        text="스토리 더보기"
        variant="filterOff"
        className="py-4 w-full"
        rightIcon={<CaretDown size={12} />}
        onClick={handleMorePosts}
      />
    </MainSection>
  );
}
