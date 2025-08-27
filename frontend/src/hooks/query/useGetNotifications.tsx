import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { NotificationsResponse } from "@/types/notifications";

const fetchNotifications = async (): Promise<NotificationsResponse> => {
  const response = await instance.get<NotificationsResponse>("/notifications/");
  return response.data;
};

export const useGetNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 1 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
