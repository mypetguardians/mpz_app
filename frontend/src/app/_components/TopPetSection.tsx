import { CaretDown, MapPin } from "@phosphor-icons/react";
import { MiniButton } from "@/components/ui/MiniButton";
import { PetCard } from "@/components/ui/PetCard";
import { PetCardSkeleton } from "@/components/ui/PetCardSkeleton";
import { MainSection } from "@/components/common/MainSection";
import { PetSectionError } from "@/components/ui/PetSectionError";
import { RawAnimalResponse, transformRawAnimalToPetCard } from "@/types/animal";
import { PetCardVariant } from "@/types/petcard";
import { useGeolocation } from "@/hooks/useGeolocaiton";
import { isValidLocation, getRegionNameByGeocode } from "@/lib/location-utils";
import {
  getFullLocationName,
  getShortLocationName,
  isLocationMatch,
} from "@/lib/region-utils";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/Toast";
import { useHomeLocationStore } from "@/stores/homeLocation";

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
  const [isMounted, setIsMounted] = useState(false);
  const hasAutoAppliedLocation = useRef(false);
  const [locationToastMsg, setLocationToastMsg] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tagRefsMap = useRef<Map<string, HTMLElement>>(new Map());

  const { userGpsLocation, setUserGpsLocation, selectedLocation: storeLocation } = useHomeLocationStore();

  // 클라이언트 마운트 시 위치 처리
  useEffect(() => {
    setIsMounted(true);

    // store에 이미 선택된 지역이 있으면 GPS 요청 안 함 (탭 전환 케이스)
    if (storeLocation) {
      hasAutoAppliedLocation.current = true;
      if (userGpsLocation) setUserLocation(userGpsLocation);
      return;
    }

    // store에 GPS 위치가 있으면 재사용
    if (userGpsLocation) {
      setUserLocation(userGpsLocation);
      hasAutoAppliedLocation.current = true;
      onLocationSelect?.(userGpsLocation);
      return;
    }

    // 아무것도 없으면 GPS 요청
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GPS 결과 → 역지오코딩 → 내 지역 태그 자동 활성화
  useEffect(() => {
    if (!latitude || !longitude || !isValidLocation(latitude, longitude)) return;
    if (hasAutoAppliedLocation.current) return;

    const resolveRegion = async () => {
      const region = await getRegionNameByGeocode(latitude, longitude);
      setUserLocation(region);
      setUserGpsLocation(region);
      hasAutoAppliedLocation.current = true;
      onLocationSelect?.(region);
    };

    resolveRegion();
  }, [latitude, longitude, onLocationSelect, setUserGpsLocation]);

  // "내 주변" 버튼 클릭 시 GPS 재요청 → 내 지역 태그 활성화
  const handleNearbyClick = () => {
    if (userLocation) {
      onLocationSelect?.(userLocation);
    } else {
      hasAutoAppliedLocation.current = false;
      sessionStorage.removeItem("homeUserLocation");
      requestLocation();
    }
  };

  // 선택된 지역 태그로 스크롤 포커싱
  useEffect(() => {
    if (!selectedLocation || !scrollContainerRef.current) return;
    const matchedKey = locations.find(
      (loc) =>
        isLocationMatch(selectedLocation, loc) ||
        isLocationMatch(selectedLocation, getFullLocationName(loc))
    );
    if (!matchedKey) return;
    const el = tagRefsMap.current.get(matchedKey);
    if (!el) return;
    const container = scrollContainerRef.current;
    const scrollLeft = el.offsetLeft - container.offsetLeft - 16;
    container.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }, [selectedLocation, locations]);

  // 위치정보 에러가 있는 경우 처리
  useEffect(() => {
    if (locationError) {
      setLocationToastMsg("위치정보를 가져올 수 없어요. 브라우저 설정에서 위치정보 접근을 허용해주세요.");
      setTimeout(() => setLocationToastMsg(""), 4000);
    }
  }, [locationError]);
  // ExpertAnalysis 모드일 때
  if (isExpertAnalysis) {
    if (isLoading) {
      return (
        <MainSection className="pb-0">
          <div className="flex flex-col space-y-3">
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
        <MainSection className="pb-0">
          <div className="flex items-center justify-center h-32">
            <div className="text-[18px] text-error">
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
      <MainSection className="pb-0">
        <div className="flex flex-col space-y-3">
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
      className="pb-0"
    >
      {/* 지역 필터 */}
      {showLocationFilter && (
        <div ref={scrollContainerRef} className="flex items-center overflow-x-auto scrollbar-hide space-x-[6px] -mx-4 px-4">
          <MiniButton
            key="location"
            leftIcon={<MapPin size={16} />}
            text={isMounted && locationLoading ? "위치 확인 중..." : "내 주변"}
            variant="filterOff"
            onClick={handleNearbyClick}
            disabled={isMounted && locationLoading}
          />
          {locations.map((loc) => {
            const displayName = getShortLocationName(loc);
            const fullName = getFullLocationName(loc);
            const isSelected = selectedLocation
              ? isLocationMatch(selectedLocation, loc) ||
                isLocationMatch(selectedLocation, fullName)
              : false;

            return (
              <div
                key={loc}
                ref={(el) => {
                  if (el) tagRefsMap.current.set(loc, el);
                }}
              >
                <MiniButton
                  text={displayName}
                  variant={isSelected ? "filterOn" : "filterOff"}
                  onClick={() => {
                    if (!isSelected) {
                      onLocationSelect?.(fullName);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* 동물 카드 목록 */}
      {isLoading ? (
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide flex-nowrap -mx-4 px-4">
          {[...Array(10)].map((_, index) => (
            <PetCardSkeleton key={index} variant="primary" />
          ))}
        </div>
      ) : displayAnimals.length > 0 ? (
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide flex-nowrap -mx-4 px-4">
          {displayAnimals.map((animal) => (
            <PetCard
              key={animal.id}
              pet={transformRawAnimalToPetCard(animal)}
              variant="primary"
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gr">
            해당 지역에 보호중인 동물이 없습니다.
          </div>
        </div>
      )}
      {locationToastMsg && (
        <div className="fixed bottom-4 left-4 right-4 z-[10000]">
          <Toast>{locationToastMsg}</Toast>
        </div>
      )}
    </MainSection>
  );
}
