"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/SearchInput";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";
import { Animal, transformRawAnimalToAnimal } from "@/types/animal";

interface BreedFilterProps {
  selectedBreed: string;
  setSelectedBreed: (breed: string) => void;
  breedSearchTerm: string;
  setBreedSearchTerm: (term: string) => void;
  isBreedSheetOpen: boolean;
  setIsBreedSheetOpen: (open: boolean) => void;
  tempSelectedBreed: string;
  setTempSelectedBreed: (breed: string) => void;
}

export default function BreedFilter({
  selectedBreed,
  setSelectedBreed,
  breedSearchTerm,
  setBreedSearchTerm,
  isBreedSheetOpen,
  setIsBreedSheetOpen,
  tempSelectedBreed,
  setTempSelectedBreed,
}: BreedFilterProps) {
  const searchParams = useSearchParams();
  const [searchResults, setSearchResults] = useState<Animal[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // URL 파라미터에서 breed 값 읽어오기
  useEffect(() => {
    const breedFromUrl = searchParams.get("breed");
    if (breedFromUrl && breedFromUrl !== selectedBreed) {
      setSelectedBreed(breedFromUrl);
      setBreedSearchTerm(breedFromUrl);
    }
  }, [searchParams, selectedBreed, setSelectedBreed, setBreedSearchTerm]);

  // 품종 검색 결과 가져오기
  const {
    data: searchData,
    isLoading,
    error,
  } = useGetAnimals({
    limit: 50,
    breed: breedSearchTerm || undefined,
  });

  // 검색어가 변경될 때마다 검색 결과 업데이트
  useEffect(() => {
    if (breedSearchTerm) {
      setIsSearching(true);
      // 실제로는 API 호출이 완료되면 자동으로 업데이트됨
    } else {
      setSearchResults([]);
    }
  }, [breedSearchTerm]);

  // 검색 데이터가 업데이트되면 결과 설정
  useEffect(() => {
    if (searchData) {
      const allAnimals = searchData.pages.flatMap((page) =>
        page.data.map(transformRawAnimalToAnimal)
      );
      setSearchResults(allAnimals);
      setIsSearching(false);
    }
  }, [searchData]);

  const handleBreedSearchClick = () => {
    setTempSelectedBreed(selectedBreed);
    setIsBreedSheetOpen(true);
  };

  const handleBreedApply = (breed: string) => {
    setSelectedBreed(breed);
    setIsBreedSheetOpen(false);
    setBreedSearchTerm("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBreedSearchTerm(e.target.value);
  };

  // 중복 제거된 품종 목록 생성
  const uniqueBreeds = Array.from(
    new Set(
      searchResults
        .map((animal) => animal.breed || "")
        .filter((breed) => breed !== "")
    )
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        <h5 className="text-dg">품종</h5>
        <div onClick={handleBreedSearchClick} className="cursor-pointer">
          <SearchInput
            variant="variant2"
            placeholder="품종명을 검색해보세요"
            value={selectedBreed}
            onChange={(e) => setSelectedBreed(e.target.value)}
          />
        </div>
      </div>

      <BottomSheet
        open={isBreedSheetOpen}
        onClose={() => setIsBreedSheetOpen(false)}
        variant="selectMenu"
        showApplyButton={true}
        applyButtonText="적용하기"
        onApply={handleBreedApply}
        selectedValue={tempSelectedBreed}
      >
        <div className="flex flex-col gap-4">
          <SearchInput
            variant="variant2"
            placeholder="품종명을 검색해보세요"
            value={breedSearchTerm}
            onChange={handleSearchChange}
          />

          {/* 품종 리스트 표시 */}
          <div className="max-h-96 overflow-y-auto">
            {isSearching || isLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">검색 중...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-500">검색에 실패했습니다</div>
              </div>
            ) : uniqueBreeds.length > 0 ? (
              <div className="flex flex-col">
                <div className="space-y-1">
                  {uniqueBreeds.map((breed, index) => (
                    <button
                      key={index}
                      className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-50 ${
                        tempSelectedBreed === breed
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "text-gray-800"
                      }`}
                      onClick={() => setTempSelectedBreed(breed)}
                    >
                      {breed}
                    </button>
                  ))}
                </div>
              </div>
            ) : breedSearchTerm ? (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  &ldquo;{breedSearchTerm}&rdquo;에 해당하는 품종이 없습니다
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  품종명을 입력하여 검색해보세요
                </div>
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
