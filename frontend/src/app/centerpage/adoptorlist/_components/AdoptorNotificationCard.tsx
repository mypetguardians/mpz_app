import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";
import type { CenterAdoptionData } from "@/types/center-adoption";

interface AdoptorNotificationCardProps {
  id: string;
  userName: string;
  profileImage: string;
  timeAgo: string;
  status: "응답 대기 중" | "입양 진행 중" | "입양 완료" | "거절";
  isGrayscale?: boolean;
  tabType?: "application" | "foster" | "adopter";
  apiStatus?: string; // API 상태값 추가
  adoption?: CenterAdoptionData; // 입양 데이터 추가
}

function AdoptorNotificationCard({
  id,
  userName,
  profileImage,
  timeAgo,
  status,
  isGrayscale = false,
  tabType = "adopter",
  apiStatus,
}: AdoptorNotificationCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    console.log("Card clicked:", { id, tabType, apiStatus });

    // API 상태에 따른 단계별 이동
    if (apiStatus) {
      switch (apiStatus) {
        case "신청":
          router.push(`/centerpage/adoptorlist/application/${id}/request`);
          break;
        case "미팅":
          router.push(`/centerpage/adoptorlist/application/${id}/meeting`);
          break;
        case "계약서작성":
          router.push(`/centerpage/adoptorlist/application/${id}/writing`);
          break;
        case "입양완료":
          router.push(`/centerpage/adoptorlist/application/${id}/complete`);
          break;
        case "모니터링":
          router.push(`/centerpage/adoptorlist/application/${id}/monitoring`);
          break;
        case "취소":
          router.push(`/centerpage/adoptorlist/application/${id}/refuse`);
          break;
        default:
          router.push(`/centerpage/adoptorlist/application/${id}/request`);
      }
    } else {
      // 기존 로직 (fallback)
      if (tabType === "foster") {
        router.push(`/centerpage/adoptorlist/foster/${id}`);
      } else if (tabType === "adopter") {
        router.push(`/centerpage/adoptorlist/adopter/${id}`);
      } else {
        router.push(`/centerpage/adoptorlist/application/${id}/request`);
      }
    }
  };
  // Chip 컴포넌트의 variantColorClass 색상들을 사용
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "응답 대기 중":
        return "bg-green/10 text-green";
      case "입양 진행 중":
        return "bg-bg text-gr";
      case "입양 완료":
        return "bg-yellow/10 text-yellow";
      case "거절":
        return "bg-brand/10 text-brand";
      default:
        return "";
    }
  };

  return (
    <div
      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg"
      onClick={handleCardClick}
    >
      {/* 프로필 이미지 */}
      <div className="flex-shrink-0">
        <Image
          src={profileImage}
          alt={`${userName}의 프로필`}
          className={cn(
            "w-[74.5px] h-[74.5px] object-cover rounded-md",
            isGrayscale && "grayscale"
          )}
          width={74.5}
          height={74.5}
        />
      </div>

      {/* 사용자 정보 및 상태 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 truncate">
              {userName}
            </span>
            <span className="text-xs text-gray-500 mt-1">{timeAgo}</span>
          </div>

          {/* 상태 태그 */}
          <div className="flex-shrink-0 ml-2">
            <Chip className={getStatusColorClass(status)}>{status}</Chip>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AdoptorNotificationCard };
