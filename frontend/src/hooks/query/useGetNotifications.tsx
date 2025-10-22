import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { NotificationsResponse } from "@/types/notifications";

interface GetNotificationsParams {
  page?: number;
  page_size?: number;
  enabled?: boolean;
}

const fetchNotifications = async (
  params?: Omit<GetNotificationsParams, "enabled">
): Promise<NotificationsResponse> => {
  const response = await instance.get<NotificationsResponse>(
    "/notifications/",
    {
      params: {
        page: params?.page || 1,
        page_size: params?.page_size || 10,
      },
    }
  );
  return response.data;
};

// 기존 단일 쿼리 (하위 호환성 유지)
export const useGetNotifications = (params?: GetNotificationsParams) => {
  const { enabled, ...queryParams } = params || {};
  return useQuery({
    queryKey: ["notifications", queryParams],
    queryFn: () => fetchNotifications(queryParams),
    enabled: enabled !== undefined ? enabled : true,
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 무한스크롤을 위한 새로운 훅
export const useGetNotificationsInfinite = (page_size: number = 20) => {
  return useInfiniteQuery({
    queryKey: ["notifications", "infinite", page_size],
    queryFn: ({ pageParam = 1 }) =>
      fetchNotifications({ page: pageParam, page_size }),
    getNextPageParam: (lastPage) => {
      // nextPage가 0이 아니고 null이 아니면 다음 페이지 존재
      return lastPage.nextPage && lastPage.nextPage !== 0
        ? lastPage.nextPage
        : undefined;
    },
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000, // 1분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
