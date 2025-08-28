import { useQuery } from "@tanstack/react-query";
import instance from "@/lib/axios-instance";
import {
  CenterFavoritesApiResponse,
  AnimalFavoritesApiResponse,
} from "@/types/favorites";

// API 응답을 기존 형식으로 변환하는 함수
const transformCenterFavorites = (apiResponse: CenterFavoritesApiResponse) => {
  return {
    centers: apiResponse.data.map((item) => ({
      id: item.id,
      name: item.name,
      location: item.location,
      region: item.region,
      phoneNumber: item.phone_number,
      imageUrl: item.image_url,
      isFavorited: item.is_favorited,
      favoritedAt: item.favorited_at,
    })),
    total: apiResponse.totalCnt,
    page: apiResponse.curPage,
    limit: apiResponse.count,
    totalPages: apiResponse.pageCnt,
    hasNext: apiResponse.nextPage > 0,
    hasPrev: apiResponse.previousPage > 0,
  };
};

const transformAnimalFavorites = (apiResponse: AnimalFavoritesApiResponse) => {
  return {
    animals: apiResponse.data.map((item) => ({
      id: item.id,
      name: item.name,
      breed: item.breed,
      age: item.age,
      isFemale: item.isFemale,
      status: item.status,
      personality: item.personality,
      centerId: item.centerId,
      centerName: item.centerName,
      isFavorited: item.isFavorited,
      favoritedAt: item.favoritedAt,
    })),
    total: apiResponse.totalCnt,
    page: apiResponse.curPage,
    limit: apiResponse.count,
    totalPages: apiResponse.pageCnt,
    hasNext: apiResponse.nextPage > 0,
    hasPrev: apiResponse.previousPage > 0,
  };
};

// 찜한 동물 목록 조회
const fetchAnimalFavorites = async (
  page?: number,
  limit?: number
): Promise<AnimalFavoritesApiResponse> => {
  const params = new URLSearchParams();
  if (page !== undefined) params.append("page", page.toString());
  if (limit !== undefined) params.append("limit", limit.toString());

  const response = await instance.get<AnimalFavoritesApiResponse>(
    `/favorites/animals?${params}`
  );
  return response.data;
};

// 찜한 센터 목록 조회
const fetchCenterFavorites = async (
  page?: number,
  limit?: number
): Promise<CenterFavoritesApiResponse> => {
  const params = new URLSearchParams();
  if (page !== undefined) params.append("page", page.toString());
  if (limit !== undefined) params.append("limit", limit.toString());

  const response = await instance.get<CenterFavoritesApiResponse>(
    `/favorites/centers?${params}`
  );
  return response.data;
};

// 찜한 동물 목록 조회 훅
export const useGetAnimalFavorites = (page?: number, limit?: number) => {
  return useQuery({
    queryKey: ["animalFavorites", page, limit],
    queryFn: () => fetchAnimalFavorites(page, limit),
    select: transformAnimalFavorites,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

// 찜한 센터 목록 조회 훅
export const useGetCenterFavorites = (page?: number, limit?: number) => {
  return useQuery({
    queryKey: ["centerFavorites", page, limit],
    queryFn: () => fetchCenterFavorites(page, limit),
    select: transformCenterFavorites,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};
