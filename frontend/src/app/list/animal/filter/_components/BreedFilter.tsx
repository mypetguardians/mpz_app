"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CaretDown, X } from "@phosphor-icons/react";

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
  setBreedSearchTerm,
}: BreedFilterProps) {
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState("");

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

  const handleBreedSearchClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setLocalSearchTerm(nextValue);
    // 입력값이 비면 선택도 해제
    if (!nextValue.trim()) {
      setSelectedBreed("");
      setBreedSearchTerm("");
    }
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

  const filteredBreeds =
    localSearchTerm.trim().length === 0
      ? breedList
      : breedList.filter((breed) =>
          breed.toLowerCase().includes(localSearchTerm.toLowerCase())
        );

  return (
    <div className="flex flex-col gap-3 relative" ref={dropdownRef}>
      <h5 className="text-dg">품종</h5>
      <div className="flex items-center w-full bg-bg rounded-[8px] px-4 h-[44px]">
        <input
          className="flex-1 outline-none bg-transparent text-body placeholder:text-gr"
          placeholder="품종명을 검색해보세요"
          value={isDropdownOpen ? localSearchTerm : selectedBreed}
          onChange={handleSearchChange}
          onFocus={() => {
            setLocalSearchTerm(selectedBreed);
            setIsDropdownOpen(true);
          }}
        />
        <div className="flex items-center space-x-2 ml-2 text-gray-400">
          {(selectedBreed || localSearchTerm) && (
            <span
              className="cursor-pointer"
              onClick={() => {
                setSelectedBreed("");
                setBreedSearchTerm("");
                setLocalSearchTerm("");
              }}
            >
              <X size={16} weight="bold" />
            </span>
          )}
          <span
            className="cursor-pointer"
            onClick={handleBreedSearchClick}
          >
            <CaretDown
              size={18}
              className={`transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </span>
        </div>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <div className="flex flex-col p-4">
              {/* 품종 리스트 표시 */}
              <div className="max-h-96 overflow-y-auto scrollbar-hide">
                {filteredBreeds.length > 0 ? (
                  <div className="flex flex-col">
                    <div className="space-y-1">
                      {filteredBreeds.map((breed, index) => (
                        <button
                          key={`${breed}-${index}`}
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
