interface PetSectionErrorProps {
  title: string;
  rightSlot?: string;
  showLocationFilter?: boolean;
  locations?: string[];
  selectedLocation?: string;
  onLocationSelect?: (location: string) => void;
}

export function PetSectionError({
  title,
  rightSlot,
  showLocationFilter = false,
  locations = [],
  selectedLocation,
  onLocationSelect,
}: PetSectionErrorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {rightSlot && (
          <span className="text-sm text-gray-500">{rightSlot}</span>
        )}
      </div>

      {showLocationFilter && (
        <div className="flex items-center overflow-x-auto gap-[6px] mb-4">
          {locations.map((loc) => (
            <button
              key={loc}
              onClick={() => {
                if (selectedLocation === loc) {
                  // 같은 버튼 재클릭 시 필터 해제
                  onLocationSelect?.("");
                } else {
                  // 다른 지역 선택
                  onLocationSelect?.(loc);
                }
              }}
              className={`px-3 py-1 border rounded-full text-sm transition-colors ${
                selectedLocation === loc
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center h-32">
        <div className="text-lg text-red-500">
          동물 정보를 불러오는데 실패했습니다.
        </div>
      </div>
    </div>
  );
}
