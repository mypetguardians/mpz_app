import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { NoticeResponseSchema } from "@/server/openapi/routes/center-notice";
import instance from "@/lib/axios-instance";

type Notice = z.infer<typeof NoticeResponseSchema>;

const fetchCenterNotices = async (): Promise<Notice[]> => {
  try {
    const response = await instance.get("/center-notices");

    if (!response.data.notices) {
      throw new Error("Invalid response format");
    }

    return response.data.notices;
  } catch (error) {
    throw error;
  }
};

const fetchCenterNoticeById = async (id: string): Promise<Notice> => {
  try {
    const response = await instance.get(`/center-notices/${id}`);

    if (!response.data.notice) {
      throw new Error("Invalid response format");
    }

    return response.data.notice;
  } catch (error) {
    throw error;
  }
};

export const useGetCenterNotices = () => {
  return useQuery({
    queryKey: ["CenterNotices"],
    queryFn: fetchCenterNotices,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

export const useGetCenterNoticeById = (id: string) => {
  return useQuery({
    queryKey: ["CenterNotice", id],
    queryFn: () => fetchCenterNoticeById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
