import { useQuery } from "@tanstack/react-query";

export interface AdopterDetailData {
  adoption: {
    id: string;
    status: string;
    notes: string | null;
    centerNotes: string | null;
    monitoringAgreement: boolean;
    guidelinesAgreement: boolean;
    meetingScheduledAt: string | null;
    contractSentAt: string | null;
    adoptionCompletedAt: string | null;
    monitoringStartedAt: string | null;
    monitoringNextCheckAt: string | null;
    monitoringEndDate: string | null;
    monitoringCompletedChecks: number | null;
    monitoringTotalChecks: number | null;
    monitoringStatus: string | null;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id: string;
    name: string;
    nickname: string | null;
    phoneNumber: string | null;
    image: string | null;
  };
  animal: {
    id: string;
    name: string;
    isFemale: boolean;
    age: number;
    weight: number | null;
    color: string | null;
    breed: string | null;
    description: string | null;
    status: string;
    waitingDays: number | null;
    activityLevel: number | null;
    sensitivity: number | null;
    sociability: number | null;
    imageUrls: string[];
  };
  questionResponses: Array<{
    question: string;
    answer: string;
  }>;
  monitoringStatus: {
    isDelayed: boolean;
    delayDays: number;
    remainingChecks: number;
    remainingPeriod: string;
  };
}

export const useGetAdopterDetail = (adoptionId: string) => {
  return useQuery({
    queryKey: ["adopter-detail", adoptionId],
    queryFn: async (): Promise<AdopterDetailData> => {
      try {
        // 실제 API 엔드포인트가 없으므로 더미 데이터 반환
        // 나중에 실제 API가 구현되면 아래 주석을 해제하고 사용
        // const response = await instance.get(`/api/adoptions/${adoptionId}/detail`);
        // return response.data;

        // 임시 더미 데이터 반환
        return {
          adoption: {
            id: adoptionId,
            status: "모니터링",
            notes: "사용자 메모",
            centerNotes: "센터 메모",
            monitoringAgreement: true,
            guidelinesAgreement: true,
            meetingScheduledAt: "2024-01-15T10:00:00Z",
            contractSentAt: "2024-01-10T14:30:00Z",
            adoptionCompletedAt: "2024-01-20T16:00:00Z",
            monitoringStartedAt: "2024-01-21T00:00:00Z",
            monitoringNextCheckAt: "2024-02-15T00:00:00Z",
            monitoringEndDate: "2024-07-21T00:00:00Z",
            monitoringCompletedChecks: 2,
            monitoringTotalChecks: 6,
            monitoringStatus: "진행중",
            createdAt: "2024-01-05T09:00:00Z",
            updatedAt: "2024-01-25T15:30:00Z",
          },
          user: {
            id: "user-1",
            name: "김철수",
            nickname: "철수",
            phoneNumber: "010-1234-5678",
            image: "",
          },
          animal: {
            id: "animal-1",
            name: "군밤",
            isFemale: true,
            age: 3,
            weight: 5.2,
            color: "크림색",
            breed: "말티즈",
            description: "사랑스럽고 활발한 강아지입니다.",
            status: "입양완료",
            waitingDays: 15,
            activityLevel: 4,
            sensitivity: 3,
            sociability: 5,
            imageUrls: ["", "/img/dummyImg.png"],
          },
          questionResponses: [
            {
              question: "반려동물을 키워본 경험이 있나요?",
              answer: "네, 강아지를 3년간 키운 경험이 있습니다.",
            },
            {
              question: "하루에 반려동물과 보낼 수 있는 시간은?",
              answer: "평일 2-3시간, 주말 6-8시간 정도입니다.",
            },
            {
              question: "반려동물과 함께 살 수 있는 주거 환경은?",
              answer: "아파트에서 반려동물 허용 동네입니다.",
            },
          ],
          monitoringStatus: {
            isDelayed: false,
            delayDays: 0,
            remainingChecks: 4,
            remainingPeriod: "5개월 3주",
          },
        };
      } catch (error) {
        console.error("입양자 상세 정보 조회 실패:", error);
        throw new Error("입양자 정보를 불러올 수 없습니다.");
      }
    },
    enabled: !!adoptionId,
  });
};
