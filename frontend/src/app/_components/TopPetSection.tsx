import { CaretDown, MapPin } from "@phosphor-icons/react";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetCard } from "@/components/ui/PetCard";
import { PetCardSkeleton } from "@/components/ui/PetCardSkeleton";
import { MainSection } from "@/components/common/MainSection";
import { PetSectionError } from "@/components/ui/PetSectionError";
import { RawAnimalResponse, transformRawAnimalToPetCard } from "@/types/animal";
import { PetCardVariant } from "@/types/petcard";
import { useGeolocation } from "@/hooks/useGeolocation";
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
}

export function TopPetSection({
  title,
  rightSlot,
  animals,
  variant,
  showLocationFilter = false,
  locations = [],
  isLoading = false,
  error = null,
  isExpertAnalysis = false,
  selectedLocation,
  onLocationSelect,
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

  // 위치정보가 변경될 때마다 사용자 위치 기반 지역을 계산
  useEffect(() => {
    if (latitude && longitude && isValidLocation(latitude, longitude)) {
      const region = getLocationBasedRegion(latitude, longitude);
      setUserLocation(region);
      console.log("사용자 위치 기반 지역:", region);
      // 위치정보가 성공적으로 가져와졌고, 현재 "내 주변"이 선택되어 있다면 자동으로 필터 적용
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
      // 위치정보가 아직 없는 경우 "내 주변" 상태로 설정하고 위치정보 요청
      onLocationSelect?.("내 주변");
      requestLocation();
    }
  };

  // 위치정보 에러가 있는 경우 처리
  useEffect(() => {
    if (locationError) {
      console.error("위치정보 에러:", locationError);
      // 에러 발생 시 사용자에게 알림 (실제 앱에서는 토스트나 모달로 표시)
      alert(
        "위치정보를 가져올 수 없습니다. 브라우저 설정에서 위치정보 접근을 허용해주세요."
      );
    }
  }, [locationError]);
  // ExpertAnalysis 모드일 때
  if (isExpertAnalysis) {
    if (isLoading) {
      return (
        <MainSection>
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, index) => (
              <PetCardSkeleton key={index} variant="variant2" />
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
        <MainSection>
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
      .filter((animal) => animal?.status === "보호중")
      .sort((a, b) => {
        if (a.admission_date && b.admission_date) {
          return (
            new Date(b.admission_date).getTime() -
            new Date(a.admission_date).getTime()
          );
        }
        return (b.waiting_days || 0) - (a.waiting_days || 0);
      })
      .slice(0, 3);

    return (
      <MainSection>
        <div className="flex flex-col gap-3">
          {analysisAnimals.map((animal) => (
            <PetCard
              key={animal.id}
              pet={transformRawAnimalToPetCard(animal)}
              variant="variant2"
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

  // 보호중인 동물만 필터링하고 admission_date 높은 순서대로 정렬
  const limitedAnimals = (animals || [])
    .filter((animal) => animal?.status === "보호중")
    .sort((a, b) => {
      if (a.admission_date && b.admission_date) {
        return (
          new Date(b.admission_date).getTime() -
          new Date(a.admission_date).getTime()
        );
      }
      return (b.waiting_days || 0) - (a.waiting_days || 0);
    });

  // 지역 필터링
  let filteredAnimals = limitedAnimals;
  if (selectedLocation && selectedLocation !== "") {
    filteredAnimals = limitedAnimals.filter((animal) => {
      const animalLocation = animal.found_location || "";
      // "내 주변" 또는 사용자 위치 기반 필터링인 경우
      if (selectedLocation === "내 주변" || selectedLocation === userLocation) {
        return userLocation ? animalLocation.includes(userLocation) : false;
      }
      // 일반 지역 필터링
      return animalLocation.includes(selectedLocation);
    });
  }

  // 필터가 적용된 경우 필터링된 결과를 모두 표시, 필터가 없는 경우 상위 10개만 표시
  const displayAnimals =
    selectedLocation && selectedLocation !== ""
      ? filteredAnimals
      : filteredAnimals.slice(0, 10);

  return (
    <MainSection
      title={title}
      rightSlot={rightSlot}
      onRightClick={() => router.push("/list/animal")}
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
      <div
        className={`flex gap-3 overflow-x-auto scrollbar-hide flex-nowrap -mx-4 px-4 ${
          variant === "variant2" ? "flex-col" : ""
        } ${
          variant === "variant3"
            ? "grid grid-cols-3 gap-x-2 gap-y-3 flex-nowrap"
            : ""
        }`}
      >
        {isLoading
          ? // 스켈레톤 로딩 상태
            [...Array(10)].map((_, index) => (
              <PetCardSkeleton key={index} variant={variant} />
            ))
          : // 실제 데이터 표시
            displayAnimals.map((animal) => (
              <PetCard
                key={animal.id}
                pet={transformRawAnimalToPetCard(animal)}
                variant={variant}
              />
            ))}
      </div>
    </MainSection>
  );
}
