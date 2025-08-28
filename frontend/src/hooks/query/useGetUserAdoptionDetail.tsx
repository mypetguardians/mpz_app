import { useQuery } from "@tanstack/react-query";
import { UserAdoptionDetailResponse } from "@/types/adoption";
import instance from "@/lib/axios-instance";

interface GetUserAdoptionDetailParams {
  adoptionId: string;
}

const getUserAdoptionDetail = async (
  params: GetUserAdoptionDetailParams
): Promise<UserAdoptionDetailResponse> => {
  const { adoptionId } = params;

  const url = `/adoptions/my/${adoptionId}`;

  const response = await instance.get<UserAdoptionDetailResponse>(url);
  return response.data;
};

export function useGetUserAdoptionDetail(params: GetUserAdoptionDetailParams) {
  const { adoptionId } = params;

  return useQuery<UserAdoptionDetailResponse>({
    queryKey: ["user-adoption-detail", adoptionId],
    queryFn: () => getUserAdoptionDetail(params),
    enabled: !!adoptionId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
