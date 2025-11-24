"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/SearchInput";
import { BottomSheet } from "@/components/ui/BottomSheet";

interface BreedFilterProps {
  breedList: string[];
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
  breedList,
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

  // URL 파라미터에서 breed 값 읽어오기
  useEffect(() => {
    const breedFromUrl = searchParams.get("breed");
    if (breedFromUrl && breedFromUrl !== selectedBreed) {
      setSelectedBreed(breedFromUrl);
      setBreedSearchTerm(breedFromUrl);
    }
  }, [searchParams, selectedBreed, setSelectedBreed, setBreedSearchTerm]);

  const handleBreedSearchClick = () => {
    setTempSelectedBreed(selectedBreed);
    setBreedSearchTerm(selectedBreed);
    setIsBreedSheetOpen(true);
  };

  const handleBreedApply = (breed: string) => {
    setSelectedBreed(breed);
    setIsBreedSheetOpen(false);
    setBreedSearchTerm("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setBreedSearchTerm(nextValue);
    setTempSelectedBreed(nextValue);
  };

  const filteredBreeds =
    breedSearchTerm.trim().length === 0
      ? breedList
      : breedList.filter((breed) =>
          breed.toLowerCase().includes(breedSearchTerm.toLowerCase())
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
            readOnly={true}
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
          <div className="max-h-96 overflow-y-auto scrollbar-hide">
            {filteredBreeds.length > 0 ? (
              <div className="flex flex-col">
                <div className="space-y-1">
                  {filteredBreeds.map((breed, index) => (
                    <button
                      key={`${breed}-${index}`}
                      className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-50 ${
                        tempSelectedBreed === breed
                          ? "bg-blue-50 text-blue-600 border border-blue-200"
                          : "text-gray-800"
                      }`}
                      onClick={() => {
                        setTempSelectedBreed(breed);
                        handleBreedApply(breed);
                      }}
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
