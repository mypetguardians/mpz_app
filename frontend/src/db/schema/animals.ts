import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { centers } from "./centers";

export const animals = sqliteTable("animals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  centerId: text("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isFemale: integer("is_female", { mode: "boolean" }).notNull(),
  age: integer("age").notNull(),
  weight: real("weight"),
  color: text("color"),
  breed: text("breed"),
  description: text("description"),
  announceNumber: text("announce_number"),
  announcementDate: text("announcement_date"),
  admissionDate: text("admission_date"), // 입소일
  foundLocation: text("found_location"), // 발견 장소
  personality: text("personality"), // 성격 (예: 활발함, 온순함, 내성적, 장난꾸러기 등)
  status: text("status", {
    enum: ["보호중", "입양완료", "무지개다리", "임시보호중", "반환", "방사"],
  })
    .notNull()
    .default("보호중"),
  waitingDays: integer("waiting_days").default(0),
  activityLevel: integer("activity_level"), // 활동력
  sensitivity: integer("sensitivity"), // 민감도
  sociability: integer("sociability"), // 사회성
  separationAnxiety: integer("separation_anxiety"), // 분리불안
  neutering: integer("neutering", { mode: "boolean" }), // 중성화 여부
  specialNotes: text("special_notes"), // 특이사항
  healthNotes: text("health_notes"), // 건강 상태
  basicTraining: text("basic_training"), // 기본 훈련 여부
  trainerComment: text("trainer_comment"), // 훈련사 한마디
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const animalImages = sqliteTable("animal_images", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  animalId: text("animal_id")
    .notNull()
    .references(() => animals.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
