import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { UserAdoptionDetailResponseSchema } from "@/server/openapi/routes/user-adoption";
import instance from "@/lib/axios-instance";

type UserAdoptionDetail = z.infer<typeof UserAdoptionDetailResponseSchema>;

interface GetUserAdoptionDetailParams {
  userId: string;
  adoptionId: string;
}

const getUserAdoptionDetail = async (
  params: GetUserAdoptionDetailParams
): Promise<UserAdoptionDetail> => {
  const { userId, adoptionId } = params;

  const url = `/users/${userId}/adoption/${adoptionId}`;

  const response = await instance.get<UserAdoptionDetail>(url);
  return response.data;
};

export function useGetUserAdoptionDetail(params: GetUserAdoptionDetailParams) {
  const { userId, adoptionId } = params;

  return useQuery<UserAdoptionDetail>({
    queryKey: ["user-adoption-detail", userId, adoptionId],
    queryFn: () => getUserAdoptionDetail(params),
    enabled: !!userId && !!adoptionId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
