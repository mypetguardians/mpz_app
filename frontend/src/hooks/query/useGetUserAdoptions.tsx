import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  UserAdoptionSchema,
  UserAdoptionListResponseSchema,
} from "@/server/openapi/routes/user-adoption";
import instance from "@/lib/axios-instance";

type Adoption = z.infer<typeof UserAdoptionSchema>;

interface GetUserAdoptionsParams {
  userId: string;
  page?: number;
  limit?: number;
}

// 프론트엔드에서 기대하는 응답 구조로 변경
interface UserAdoptionsResponse {
  adoptions: Adoption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
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
  const parsedData = UserAdoptionListResponseSchema.parse(response.data);

  // API 응답 구조를 프론트엔드에서 기대하는 구조로 변환
  return {
    adoptions: parsedData.adoptions,
    total: parsedData.pagination.total,
    page: parsedData.pagination.page,
    limit: parsedData.pagination.limit,
    totalPages: parsedData.pagination.totalPages,
    hasNext: parsedData.pagination.page < parsedData.pagination.totalPages,
    hasPrev: parsedData.pagination.page > 1,
  };
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
