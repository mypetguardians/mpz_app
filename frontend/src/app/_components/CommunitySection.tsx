import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";
import { MiniButton } from "@/components/ui/MiniButton";
import { CommunityCard } from "@/components/ui/CommunityCard";
import { MainSection } from "@/components/common/MainSection";
import type { PostWithExtrasSchema } from "@/server/openapi/routes/posts";
import type { user } from "@/db/schema/auth";
import { z } from "zod";

type Post = z.infer<typeof PostWithExtrasSchema>;
type User = Omit<typeof user.$inferSelect, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

interface CommunitySectionProps {
  feedItems: Post[];
  users: User[];
}

export function CommunitySection({ feedItems, users }: CommunitySectionProps) {
  const router = useRouter();

  const handleMorePosts = () => {
    router.push("/community");
  };

  return (
    <MainSection title="누군가의 가족이 된 순간들">
      <div className="flex flex-col gap-4">
        {feedItems.slice(0, 3).map((item) => (
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
