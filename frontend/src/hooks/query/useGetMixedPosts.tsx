import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { MixedPostsResponse, GetMixedPostsParams } from "@/types/posts";
import { transformRawPostToPost } from "./posts/utils";

const getMixedPosts = async (
  params?: GetMixedPostsParams
): Promise<MixedPostsResponse> => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === "tags" && Array.isArray(value)) {
          value.forEach((tag) => searchParams.append("tags", tag));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });
  }

  const queryString = searchParams.toString();
  const url = queryString ? `/posts/mixed/?${queryString}` : `/posts/mixed/`;

  const response = await instance.get<MixedPostsResponse>(url);
  return response.data;
};

export const useGetMixedPosts = (params?: GetMixedPostsParams) => {
  return useQuery({
    queryKey: ["mixed-posts", params],
    queryFn: () => getMixedPosts(params),
    select: (data: MixedPostsResponse) => {
      // public_posts와 private_posts를 변환하여 하나의 배열로 합치기
      const transformedPublicPosts = data.public_posts.map(
        transformRawPostToPost
      );
      const transformedPrivatePosts = data.private_posts.map(
        transformRawPostToPost
      );

      return {
        public_posts: transformedPublicPosts,
        private_posts: transformedPrivatePosts,
        all_posts: [...transformedPublicPosts, ...transformedPrivatePosts],
        public_count: data.public_count,
        private_count: data.private_count,
        total_count: data.total_count,
      };
    },
    staleTime: 0,
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: true,
  });
};
