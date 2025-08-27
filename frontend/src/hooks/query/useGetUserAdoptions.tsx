import { useQuery } from "@tanstack/react-query";
import { UserAdoptionOut, UserAdoptionFilterIn } from "@/types/adoption";
import instance from "@/lib/axios-instance";

interface GetUserAdoptionsParams {
  filters?: UserAdoptionFilterIn;
}

interface UserAdoptionsResponse {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number | null;
  previousPage: number | null;
  data: UserAdoptionOut[];
}

const getUserAdoptions = async (
  params: GetUserAdoptionsParams = {}
): Promise<UserAdoptionsResponse> => {
  const { filters } = params;

  const searchParams = new URLSearchParams();

  // 필터 적용
  if (filters?.status && filters.status.trim()) {
    searchParams.append("status", filters.status.trim());
  }
  if (filters?.is_temporary_protection !== undefined) {
    searchParams.append(
      "is_temporary_protection",
      filters.is_temporary_protection.toString()
    );
  }

  const url = `/adoptions/my${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const response = await instance.get<UserAdoptionsResponse>(url);
  return response.data;
};

export function useGetUserAdoptions(params: GetUserAdoptionsParams = {}) {
  const { filters } = params;

  return useQuery<UserAdoptionsResponse>({
    queryKey: ["user-adoptions", filters],
    queryFn: () => getUserAdoptions(params),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
