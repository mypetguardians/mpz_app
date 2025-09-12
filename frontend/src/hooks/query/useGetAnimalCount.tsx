"use client";

import { useQuery } from "@tanstack/react-query";

interface AnimalCountResponse {
  adoption_available: number;
  adoption_in_progress: number;
  adoption_completed: number;
  adoption_unavailable: number;
  total: number;
}

const fetchAnimalCount = async (): Promise<AnimalCountResponse> => {
  const response = await fetch(
    "https://mpzfullstack-production.up.railway.app/v1/animals/list/count",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("동물 카운트 조회에 실패했습니다");
  }

  return response.json();
};

export const useGetAnimalCount = () => {
  return useQuery({
    queryKey: ["animalCount"],
    queryFn: fetchAnimalCount,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchOnWindowFocus: false,
  });
};
