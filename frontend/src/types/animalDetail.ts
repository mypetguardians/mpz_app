import { RawAnimalResponse } from "./animal";

// 동물 상세 페이지 전용 스키마 (유형별로 깔끔하게 그룹화)
export interface AnimalDetailSchema {
  // 1. 기본 정보
  basic: {
    id: string;
    name: string;
    breed: string | null;
    color: string | null;
    age: number;
    weight: number | null;
    isFemale: boolean;
    neutering: boolean | null | undefined;
  };

  // 2. 상태 / 진행 상황
  status: {
    protectionStatus:
      | "보호중"
      | "임시보호"
      | "안락사"
      | "자연사"
      | "반환"
      | "기증"
      | "방사"
      | "입양완료";
    adoptionStatus: "입양가능" | "입양진행중" | "입양완료" | "입양불가";
    waitingDays: number | null;
    admissionDate: string | null;
    noticeStartDate: string | null;
    noticeEndDate: string | null;
    announcementDate: string | null;
    announceNumber: string | null;
  };

  // 3. 위치 / 센터 정보
  location: {
    foundLocation: string | null;
    centerId: string;
  };

  // 4. 건강 / 케어 정보
  health: {
    healthNotes: string | null;
    specialNotes: string | null;
    basicTraining: number | null;
  };

  // 5. 성격 / 행동 프로필 (요약)
  personality: {
    summary: string | null;
    activityLevel: number | null;
    sensitivity: number | null;
    sociability: number | null;
    separationAnxiety: number | null;
  };

  // 6. 전문가 / 메타 정보
  trainer: {
    name: string | null;
    comment: string | null;
  };

  // 7. 미디어
  media: {
    images: Array<{
      id: string;
      imageUrl: string;
      orderIndex: number;
    }>;
  };

  // 8. 기타 메타
  meta: {
    megaphoneCount: number;
    isMegaphoned: boolean;
    createdAt: string;
    updatedAt: string;
    isPublicData?: boolean;
    publicNoticeNumber?: string | null;
    comment?: string | null;
  };
}

// RawAnimalResponse -> AnimalDetailSchema 변환 함수
export function transformRawAnimalToDetailSchema(
  raw: RawAnimalResponse & {
    is_public_data?: boolean;
    public_notice_number?: string | null;
    comment?: string | null;
  }
): AnimalDetailSchema {
  return {
    basic: {
      id: raw.id,
      name: raw.name,
      breed: raw.breed,
      color: raw.color,
      age: raw.age,
      weight: raw.weight,
      isFemale: raw.is_female,
      neutering: raw.neutering,
    },
    status: {
      protectionStatus: raw.protection_status,
      adoptionStatus: raw.adoption_status,
      waitingDays: raw.waiting_days,
      admissionDate: raw.admission_date,
      noticeStartDate: raw.notice_sdt,
      noticeEndDate: raw.notice_edt,
      announcementDate: raw.announcement_date,
      announceNumber: raw.announce_number,
    },
    location: {
      foundLocation: raw.found_location,
      centerId: raw.center_id,
    },
    health: {
      healthNotes: raw.health_notes,
      specialNotes: raw.special_notes,
      basicTraining: raw.basic_training,
    },
    personality: {
      summary: raw.personality,
      activityLevel: raw.activity_level,
      sensitivity: raw.sensitivity,
      sociability: raw.sociability,
      separationAnxiety: raw.separation_anxiety,
    },
    trainer: {
      name: raw.trainer_name,
      comment: raw.trainer_comment,
    },
    media: {
      images:
        raw.animal_images?.map((img) => ({
          id: img.id,
          imageUrl: img.image_url,
          orderIndex: img.order_index,
        })) ?? [],
    },
    meta: {
      megaphoneCount: raw.megaphone_count,
      isMegaphoned: raw.is_megaphoned,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      isPublicData: (raw as unknown as { is_public_data?: boolean })
        .is_public_data,
      publicNoticeNumber:
        (raw as unknown as { public_notice_number?: string | null })
          .public_notice_number ?? null,
      comment: (raw as unknown as { comment?: string | null }).comment ?? null,
    },
  };
}
