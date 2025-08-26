import { useQuery } from "@tanstack/react-query";
import { UserAdoptionsResponse } from "@/types/adoption";
import instance from "@/lib/axios-instance";

interface GetUserAdoptionsParams {
  userId: string;
  page?: number;
  limit?: number;
}

const getUserAdoptions = async (
  params: GetUserAdoptionsParams
): Promise<UserAdoptionsResponse> => {
  const { userId, page, limit } = params;

  // userId가 유효하지 않으면 에러 발생
  if (!userId || userId.trim() === "") {
    throw new Error("유효하지 않은 사용자 ID입니다.");
  }

  const searchParams = new URLSearchParams();

  if (page !== undefined) {
    searchParams.append("page", page.toString());
  }
  if (limit !== undefined) {
    searchParams.append("limit", limit.toString());
  }

  const url = `/adoptions/my${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const response = await instance.get<UserAdoptionsResponse>(url);
  return response.data;
};

export function useGetUserAdoptions(params: GetUserAdoptionsParams) {
  const { userId, page, limit } = params;

  return useQuery<UserAdoptionsResponse>({
    queryKey: ["user-adoptions", userId, page, limit],
    queryFn: () => getUserAdoptions(params),
    enabled: !!userId && userId.trim() !== "", // userId가 유효한 값일 때만 활성화
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
