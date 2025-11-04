import { CaretDown, MapPin } from "@phosphor-icons/react";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetCard } from "@/components/ui/PetCard";
import { PetCardSkeleton } from "@/components/ui/PetCardSkeleton";
import { MainSection } from "@/components/common/MainSection";
import { PetSectionError } from "@/components/ui/PetSectionError";
import { RawAnimalResponse, transformRawAnimalToPetCard } from "@/types/animal";
import { PetCardVariant } from "@/types/petcard";
import { useGeolocation } from "@/hooks/useGeolocaiton";
import { getLocationBasedRegion, isValidLocation } from "@/lib/location-utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PetSectionProps {
  title: string;
  rightSlot?: string;
  animals: RawAnimalResponse[];
  variant: PetCardVariant;
  showLocationFilter?: boolean;
  locations?: string[];
  isLoading?: boolean;
  error?: Error | null;
  isExpertAnalysis?: boolean;
  selectedLocation?: string;
  onLocationSelect?: (location: string) => void;
  sortBy?: "created_at" | "admission_date" | "megaphone_count";
  sortOrder?: "asc" | "desc";
}

export function TopPetSection({
  title,
  rightSlot,
  animals,
  variant, // eslint-disable-line @typescript-eslint/no-unused-vars
  showLocationFilter = false,
  locations = [],
  isLoading = false,
  error = null,
  isExpertAnalysis = false,
  selectedLocation,
  onLocationSelect,
  sortBy = "created_at", // eslint-disable-line @typescript-eslint/no-unused-vars
  sortOrder = "desc", // eslint-disable-line @typescript-eslint/no-unused-vars
}: PetSectionProps) {
  const router = useRouter();
  const {
    latitude,
    longitude,
    error: locationError,
    isLoading: locationLoading,
    requestLocation,
  } = useGeolocation();
  const [userLocation, setUserLocation] = useState<string>("");

  useEffect(() => {
    if (latitude && longitude && isValidLocation(latitude, longitude)) {
      const region = getLocationBasedRegion(latitude, longitude);
      setUserLocation(region);
      if (selectedLocation === "내 주변") {
        onLocationSelect?.(region);
      }
    }
  }, [latitude, longitude, selectedLocation, onLocationSelect]);

  // "내 주변" 버튼 클릭 시 위치정보 요청
  const handleNearbyClick = () => {
    if (userLocation) {
      onLocationSelect?.(userLocation);
    } else {
      onLocationSelect?.("내 주변");
      requestLocation();
    }
  };

  // 위치정보 에러가 있는 경우 처리
  useEffect(() => {
    if (locationError) {
      alert(
        "위치정보를 가져올 수 없습니다. 브라우저 설정에서 위치정보 접근을 허용해주세요."
      );
    }
  }, [locationError]);
  // ExpertAnalysis 모드일 때
  if (isExpertAnalysis) {
    if (isLoading) {
      return (
        <MainSection className="pt-5 pb-8">
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, index) => (
              <PetCardSkeleton key={index} variant="primary" />
            ))}
          </div>
          <MiniButton
            text="전문가 분석 모아보기"
            variant="filterOff"
            className="py-4"
            rightIcon={<CaretDown size={12} />}
          />
        </MainSection>
      );
    }

    if (error) {
      return (
        <MainSection className="pt-5 pb-8">
          <div className="flex items-center justify-center h-32">
            <div className="text-lg text-error">
              동물 정보를 불러오는데 실패했습니다.
            </div>
          </div>
          <MiniButton
            text="전문가 분석 모아보기"
            variant="filterOff"
            className="py-4"
            rightIcon={<CaretDown size={12} />}
          />
        </MainSection>
      );
    }

    const analysisAnimals = (animals || [])
      .filter((animal) => animal?.protection_status === "보호중")
      .slice(0, 3);

    return (
      <MainSection className="pt-5 pb-8">
        <div className="flex flex-col gap-3">
          {analysisAnimals.map((animal) => (
            <PetCard
              key={animal.id}
              pet={transformRawAnimalToPetCard(animal)}
              variant="primary"
            />
          ))}
        </div>
        <MiniButton
          text="전문가 분석 모아보기"
          variant="filterOff"
          className="py-4"
          rightIcon={<CaretDown size={12} />}
        />
      </MainSection>
    );
  }

  // 일반 PetSection 모드일 때
  if (error) {
    return (
      <PetSectionError
        title={title || ""}
        rightSlot={rightSlot}
        showLocationFilter={showLocationFilter}
        locations={locations}
        selectedLocation={selectedLocation}
        onLocationSelect={onLocationSelect}
      />
    );
  }

  // 서버에서 이미 필터링되고 정렬된 데이터를 사용
  const displayAnimals = (animals || [])
    .filter((animal) => animal?.protection_status === "보호중")
    .filter((animal) => animal?.adoption_status === "입양가능");

  return (
    <MainSection
      title={title}
      rightSlot={rightSlot}
      onRightClick={() => router.push("/list/animal")}
      className="pt-5 pb-8"
    >
      {/* 지역 필터 */}
      {showLocationFilter && (
        <div className="flex items-center overflow-x-auto scrollbar-hide gap-[6px] -mx-4 px-4">
          <MiniButton
            key="location"
            leftIcon={<MapPin size={16} />}
            text={locationLoading ? "위치 확인 중..." : "내 주변"}
            variant={
              selectedLocation === "내 주변" ||
              selectedLocation === userLocation
                ? "filterOn"
                : "filterOff"
            }
            onClick={handleNearbyClick}
            disabled={locationLoading}
          />
          {locations.map((loc) => (
            <MiniButton
              key={loc}
              text={loc}
              variant={selectedLocation === loc ? "filterOn" : "filterOff"}
              onClick={() => {
                if (selectedLocation === loc) {
                  onLocationSelect?.("");
                } else {
                  onLocationSelect?.(loc);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* 동물 카드 목록 */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide flex-nowrap -mx-4 px-4">
        {isLoading
          ? // 스켈레톤 로딩 상태
            [...Array(10)].map((_, index) => (
              <PetCardSkeleton key={index} variant="primary" />
            ))
          : // 실제 데이터 표시
            displayAnimals.map((animal) => (
              <PetCard
                key={animal.id}
                pet={transformRawAnimalToPetCard(animal)}
                variant="primary"
              />
            ))}
      </div>
    </MainSection>
  );
}
