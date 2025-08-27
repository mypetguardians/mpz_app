import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import instance from "@/lib/axios-instance";
import { UserProfileSchema } from "@/server/openapi/routes/user";

type UserProfile = z.infer<typeof UserProfileSchema>;

const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const response = await instance.get<UserProfile>(`/users/${userId}/`);
  return response.data;
};

export const useGetUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
