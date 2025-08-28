import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import type { AdoptionMonitoringPostsResponse } from "@/types/adoption-monitoring";

const getAdoptionMonitoringPosts = async (
  adoptionId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<AdoptionMonitoringPostsResponse> => {
  const response = await instance.get<AdoptionMonitoringPostsResponse>(
    `/adoptions/monitoring/posts/${adoptionId}?page=${page}&page_size=${pageSize}`
  );
  return response.data;
};

export const useGetAdoptionMonitoringPosts = (
  adoptionId: string,
  page: number = 1,
  pageSize: number = 10
) => {
  return useQuery({
    queryKey: ["adoption-monitoring-posts", adoptionId, page, pageSize],
    queryFn: () => getAdoptionMonitoringPosts(adoptionId, page, pageSize),
    enabled: !!adoptionId,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
