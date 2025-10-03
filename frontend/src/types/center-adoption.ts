import { z } from "zod";

// 사용자 정보 스키마
export const UserInfoSchema = z.object({
  name: z.string(),
  phone: z.string(),
  address: z.string(),
  address_is_public: z.boolean(),
});

// 동의 사항 스키마
export const AgreementsSchema = z.object({
  monitoring: z.boolean(),
  guidelines: z.boolean(),
});

// 타임라인 스키마
export const TimelineSchema = z.object({
  applied_at: z.string(),
  meeting_scheduled_at: z.string().nullable().optional(),
  contract_sent_at: z.string().nullable().optional(),
  adoption_completed_at: z.string().nullable().optional(),
  monitoring_started_at: z.string().nullable().optional(),
  monitoring_next_check_at: z.string().nullable().optional(),
});

// 센터 입양 데이터 스키마
export const CenterAdoptionDataSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  animal_id: z.string(),
  animal_name: z.string(),
  animal_image: z.string().optional(),
  animal_protection_status: z.string().optional(),
  animal_adoption_status: z.string().optional(),
  status: z.string(),
  notes: z.string().nullable().optional(),
  center_notes: z.string().nullable().optional(),
  user_memo: z.string().nullable().optional(),
  is_temporary_protection: z.boolean(),
  user_info: UserInfoSchema,
  question_responses: z.array(
    z.object({
      question_id: z.string().optional(),
      question_content: z.string().optional(),
      question: z.string().optional(),
      answer: z.string(),
    })
  ),
  agreements: AgreementsSchema,
  timeline: TimelineSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

// 센터 입양 응답 스키마
export const CenterAdoptionResponseSchema = z.object({
  count: z.number(),
  totalCnt: z.number(),
  pageCnt: z.number(),
  curPage: z.number(),
  nextPage: z.number(),
  previousPage: z.number(),
  data: z.array(CenterAdoptionDataSchema),
});

// 타입 추론
export type UserInfo = z.infer<typeof UserInfoSchema>;
export type Agreements = z.infer<typeof AgreementsSchema>;
export type Timeline = z.infer<typeof TimelineSchema>;
export type CenterAdoptionData = z.infer<typeof CenterAdoptionDataSchema>;
export type CenterAdoptionResponse = z.infer<
  typeof CenterAdoptionResponseSchema
>;
