import { CaretDown, MapPin } from "@phosphor-icons/react";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetCard } from "@/components/ui/PetCard";
import { PetCardSkeleton } from "@/components/ui/PetCardSkeleton";
import { MainSection } from "@/components/common/MainSection";
import { PetSectionError } from "@/components/ui/PetSectionError";
import { RawAnimalResponse, transformRawAnimalToPetCard } from "@/types/animal";
import { PetCardVariant } from "@/types/petcard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useGeolocation from "react-hook-geolocation";

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
  variant,
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
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const geolocation = useGeolocation(
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    },
    () => {}, // 콜백 함수
    isLocationEnabled // 사용자가 명시적으로 활성화할 때만 위치 요청
  );

  const [hasLocation, setHasLocation] = useState<boolean>(false);

  useEffect(() => {
    if (geolocation.latitude && geolocation.longitude) {
      setHasLocation(true);
      setIsLocationEnabled(false); // 위치를 받은 후 로딩 상태 해제
      if (selectedLocation === "내 주변") {
        onLocationSelect?.("내 주변");
      }
    }
  }, [
    geolocation.latitude,
    geolocation.longitude,
    selectedLocation,
    onLocationSelect,
  ]);

  // "내 주변" 버튼 클릭 시 위치정보 요청
  const handleNearbyClick = () => {
    if (hasLocation) {
      onLocationSelect?.("내 주변");
    } else {
      onLocationSelect?.("내 주변");
      setIsLocationEnabled(true);
    }
  };

  // 위치 요청 취소
  const handleLocationCancel = () => {
    setIsLocationEnabled(false);
    setHasLocation(false);
    onLocationSelect?.("");
  };

  // 위치정보 에러가 있는 경우 처리
  useEffect(() => {
    if (geolocation.error) {
      console.error("위치 정보 오류:", geolocation.error);
      setIsLocationEnabled(false); // 에러 발생 시에도 로딩 상태 해제
      // alert 대신 더 나은 사용자 경험을 위해 콘솔 로그만 출력
      // 필요시 토스트 알림이나 다른 UI로 대체 가능
    }
  }, [geolocation.error]);
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
      .filter((animal) => animal?.protection_status === "보호중")
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

  // 서버에서 이미 필터링되고 정렬된 데이터를 사용
  const displayAnimals = (animals || [])
    .filter((animal) => animal?.protection_status === "보호중")
    .filter((animal) => animal?.adoption_status === "입양가능");

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
            text={
              isLocationEnabled && !geolocation.latitude && !geolocation.error
                ? "위치 확인 중..."
                : geolocation.error
                ? "위치 재시도"
                : hasLocation
                ? "내 주변"
                : "내 주변"
            }
            variant={selectedLocation === "내 주변" ? "filterOn" : "filterOff"}
            onClick={
              isLocationEnabled && !geolocation.latitude && !geolocation.error
                ? handleLocationCancel
                : handleNearbyClick
            }
            disabled={false}
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
