import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { NotificationSchema } from "@/server/openapi/routes/notifications";
import instance from "@/lib/axios-instance";

type Notification = z.infer<typeof NotificationSchema>;

interface NotificationsResponse {
  notifications: Notification[];
}

const fetchNotifications = async (): Promise<NotificationsResponse> => {
  const response = await instance.get<NotificationsResponse>("/notifications");
  return response.data;
};

export const useGetNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
