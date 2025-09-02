import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";

export interface CenterAdmin {
  id: string;
  username: string;
  email: string;
  nickname: string;
  user_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const getCenterAdmins = async (): Promise<CenterAdmin[]> => {
  try {
    console.log("센터 관리자 목록 요청 시작");
    const response = await instance.get("/admin/center-admins");
    console.log("센터 관리자 API 응답:", response.data);
    return response.data as CenterAdmin[];
  } catch (error) {
    console.error("센터 관리자 목록 요청 실패:", error);
    throw error;
  }
};

export const useGetCenterAdmins = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["centerAdmins"],
    queryFn: getCenterAdmins,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    enabled: options?.enabled ?? true,
  });
};
