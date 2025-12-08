"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/SearchInput";
import { CaretDown } from "@phosphor-icons/react";
import { useGetAnimals } from "@/hooks/query/useGetAnimals";
import type { RawAnimalResponse } from "@/types/animal";

interface BreedFilterProps {
  selectedBreed: string;
  setSelectedBreed: (breed: string) => void;
  setBreedSearchTerm: (term: string) => void;
}

export default function BreedFilter({
  selectedBreed,
  setSelectedBreed,
  setBreedSearchTerm,
}: BreedFilterProps) {
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<RawAnimalResponse[]>([]);

  // URL 파라미터에서 breed 값 읽어오기
  useEffect(() => {
    const breedFromUrl = searchParams.get("breed");
    if (breedFromUrl && breedFromUrl !== selectedBreed) {
      setSelectedBreed(breedFromUrl);
      setBreedSearchTerm(breedFromUrl);
    }
  }, [searchParams, selectedBreed, setSelectedBreed, setBreedSearchTerm]);

  // 외부 클릭 시 dropdown 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setLocalSearchTerm("");
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 품종 검색 결과 가져오기
  const {
    data: searchData,
    isLoading,
    error,
  } = useGetAnimals({
    page_size: 50,
    breed: localSearchTerm || undefined,
  });

  // 검색 데이터가 업데이트되면 결과 설정
  useEffect(() => {
    if (searchData && localSearchTerm) {
      const allAnimals = searchData.pages
        .flatMap((page) => page.data || [])
        .filter((animal): animal is RawAnimalResponse => animal !== undefined);
      setSearchResults(allAnimals);
    } else if (!localSearchTerm) {
      setSearchResults([]);
    }
  }, [searchData, localSearchTerm]);

  const handleBreedSearchClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setSelectedBreed(nextValue);
    setLocalSearchTerm(nextValue);
    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
    }
  };

  const handleBreedSelect = (breed: string) => {
    setSelectedBreed(breed);
    setBreedSearchTerm(breed);
    setIsDropdownOpen(false);
    setLocalSearchTerm("");
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
    <div className="flex flex-col gap-3 relative" ref={dropdownRef}>
      <h5 className="text-dg">품종</h5>
      <div className="relative">
        <SearchInput
          variant="variant2"
          placeholder="품종명을 검색해보세요"
          value={selectedBreed}
          onChange={handleSearchChange}
          onFocus={() => setIsDropdownOpen(true)}
        />
        <span
          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 cursor-pointer"
          onClick={handleBreedSearchClick}
        >
          <CaretDown
            size={18}
            className={`transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </span>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <div className="flex flex-col p-4">
              {/* 품종 리스트 표시 */}
              <div className="max-h-96 overflow-y-auto scrollbar-hide">
                {isLoading ? (
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
                            selectedBreed === breed
                              ? "bg-blue-50 text-blue-600 border border-blue-200"
                              : "text-gray-800"
                          }`}
                          onClick={() => handleBreedSelect(breed)}
                        >
                          {breed}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : localSearchTerm ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500">
                      &ldquo;{localSearchTerm}&rdquo;에 해당하는 품종이 없습니다
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
          </div>
        )}
      </div>
    </div>
  );
}
