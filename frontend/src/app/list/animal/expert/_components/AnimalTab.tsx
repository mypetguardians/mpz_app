"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PetCard } from "@/components/ui/PetCard";
import type { RawAnimalResponse } from "@/types/animal";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";

const ITEMS_PER_PAGE = 5;

function AnimalTab() {
  const router = useRouter();
  const [pets, setPets] = useState<RawAnimalResponse[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { data: animalsData } = useGetAnimals();
  const allAnimals = useMemo(() => {
    if (!animalsData?.pages) return [];
    const seen = new Set<string>();
    return animalsData.pages
      .flatMap((page) => page.data || [])
      .filter((animal: RawAnimalResponse) => {
        if (!animal?.id) return false;
        if (seen.has(animal.id)) return false;
        seen.add(animal.id);
        return true;
      });
  }, [animalsData]);

  // 무한스크롤 시뮬레이션 (데이터 반복 X)
  const loadMorePets = () => {
    if (loading || !hasMore) return;

    setLoading(true);

    setTimeout(() => {
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const newPets = allAnimals.slice(startIndex, endIndex);

      if (newPets.length === 0) {
        setHasMore(false);
      } else {
        setPets((prev) => [...prev, ...newPets]);
        setPage((prev) => prev + 1);
        if (endIndex >= allAnimals.length) setHasMore(false);
      }

      setLoading(false);
    }, 500);
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadMorePets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 스크롤 이벤트 처리
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 1000
      ) {
        loadMorePets();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, loading, hasMore]);

  if (pets.length === 0 && !loading) {
    return (
      <div>
        <div className="text-gray-500 text-center py-8">
          해당하는 동물이 없습니다
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-2">
        {pets.map((pet, idx) => (
          <div
            key={pet.id ?? idx} // id가 있으면 id, 없으면 index
            className="cursor-pointer"
            onClick={() => router.push(`/list/animal/${pet.id}`)}
          >
            <PetCard
              pet={{
                id: pet.id,
                name: pet.name || "",
                breed: pet.breed || "",
                isFemale: pet.is_female,
                protection_status: pet.protection_status || "보호중",
                adoption_status: pet.adoption_status || "입양가능",
                centerId: pet.center_id,
                animalImages:
                  pet.animal_images?.map((img) => ({
                    id: img.id,
                    imageUrl: img.image_url,
                    orderIndex: img.order_index,
                  })) || [],
                foundLocation: pet.found_location || "",
              }}
              variant="variant2"
              imageSize="full"
              className="w-full"
            />
          </div>
        ))}
      </div>
      {loading && (
        <div className="text-center py-4">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      )}
    </div>
  );
}

export { AnimalTab };
