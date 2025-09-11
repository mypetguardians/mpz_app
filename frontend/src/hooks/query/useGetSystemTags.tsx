import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import { SystemTag } from "./posts/utils";

// 시스템 태그 목록 조회
const getSystemTags = async (): Promise<SystemTag[]> => {
  const response = await instance.get<SystemTag[]>("/posts/tags/system");
  return response.data;
};

// 시스템 태그 목록 조회 훅
export const useGetSystemTags = () => {
  return useQuery({
    queryKey: ["system-tags"],
    queryFn: getSystemTags,
    staleTime: 0, // 항상 최신 데이터 요청
    gcTime: 30 * 60 * 1000, // 30분
    retry: 1,
    refetchOnWindowFocus: true, // 창 포커스 시 리페치
  });
};
