import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  AnimalFavoriteWithDetailsSchema,
  CenterFavoriteWithDetailsSchema,
} from "@/server/openapi/routes/favorites";
import instance from "@/lib/axios-instance";

// 타입 정의
type AnimalFavorite = z.infer<typeof AnimalFavoriteWithDetailsSchema>;
type CenterFavorite = z.infer<typeof CenterFavoriteWithDetailsSchema>;

interface AnimalFavoritesResponse {
  animals: AnimalFavorite[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CenterFavoritesResponse {
  centers: CenterFavorite[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 찜한 동물 목록 조회
const fetchAnimalFavorites = async (
  page?: number,
  limit?: number
): Promise<AnimalFavoritesResponse> => {
  const params = new URLSearchParams();
  if (page !== undefined) params.append("page", page.toString());
  if (limit !== undefined) params.append("limit", limit.toString());

  const response = await instance.get<AnimalFavoritesResponse>(
    `/favorites/animals?${params}`
  );
  return response.data;
};

// 찜한 센터 목록 조회
const fetchCenterFavorites = async (
  page?: number,
  limit?: number
): Promise<CenterFavoritesResponse> => {
  const params = new URLSearchParams();
  if (page !== undefined) params.append("page", page.toString());
  if (limit !== undefined) params.append("limit", limit.toString());

  const response = await instance.get<CenterFavoritesResponse>(
    `/favorites/centers?${params}`
  );
  return response.data;
};

// 찜한 동물 목록 조회 훅
export const useGetAnimalFavorites = (page?: number, limit?: number) => {
  return useQuery({
    queryKey: ["animalFavorites", page, limit],
    queryFn: () => fetchAnimalFavorites(page, limit),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 찜한 센터 목록 조회 훅
export const useGetCenterFavorites = (page?: number, limit?: number) => {
  return useQuery({
    queryKey: ["centerFavorites", page, limit],
    queryFn: () => fetchCenterFavorites(page, limit),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
