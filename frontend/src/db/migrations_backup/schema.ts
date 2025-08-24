import {
  sqliteTable,
  AnySQLiteColumn,
  foreignKey,
  text,
  integer,
  real,
  numeric,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const adoptionContracts = sqliteTable("adoption_contracts", {
  id: text().primaryKey().notNull(),
  adoptionId: text("adoption_id")
    .notNull()
    .references(() => adoptions.id, { onDelete: "cascade" }),
  templateId: text("template_id")
    .notNull()
    .references(() => adoptionContractTemplates.id),
  contractContent: text("contract_content").notNull(),
  guidelinesContent: text("guidelines_content"),
  userSignatureUrl: text("user_signature_url"),
  userSignedAt: integer("user_signed_at"),
  centerSignatureUrl: text("center_signature_url"),
  centerSignedAt: integer("center_signed_at"),
  status: text().default("대기중").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const adoptionQuestionResponses = sqliteTable(
  "adoption_question_responses",
  {
    id: text().primaryKey().notNull(),
    adoptionId: text("adoption_id")
      .notNull()
      .references(() => adoptions.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => adoptionQuestions.id, { onDelete: "cascade" }),
    answer: text().notNull(),
    createdAt: integer("created_at")
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at")
      .default(sql`(unixepoch())`)
      .notNull(),
  }
);

export const adoptionQuestions = sqliteTable("adoption_questions", {
  id: text().primaryKey().notNull(),
  centerId: text("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  sequence: integer().default(0).notNull(),
  content: text().notNull(),
  isActive: integer("is_active").default(true).notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const adoptions = sqliteTable("adoptions", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  animalId: text("animal_id")
    .notNull()
    .references(() => animals.id, { onDelete: "cascade" }),
  status: text().default("신청").notNull(),
  notes: text(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  monitoringAgreement: integer("monitoring_agreement").notNull(),
  guidelinesAgreement: integer("guidelines_agreement").notNull(),
  meetingScheduledAt: integer("meeting_scheduled_at"),
  contractSentAt: integer("contract_sent_at"),
  adoptionCompletedAt: integer("adoption_completed_at"),
  monitoringStartedAt: integer("monitoring_started_at"),
  monitoringNextCheckAt: integer("monitoring_next_check_at"),
  monitoringEndDate: integer("monitoring_end_date"),
  monitoringCompletedChecks: integer("monitoring_completed_checks").default(0),
  monitoringTotalChecks: integer("monitoring_total_checks").default(0),
  monitoringStatus: text("monitoring_status").default("진행중"),
  centerNotes: text("center_notes"),
});

export const animalImages = sqliteTable("animal_images", {
  id: text().primaryKey().notNull(),
  animalId: text("animal_id")
    .notNull()
    .references(() => animals.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const animals = sqliteTable("animals", {
  id: text().primaryKey().notNull(),
  centerId: text("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  name: text().notNull(),
  isFemale: integer("is_female").notNull(),
  age: integer().notNull(),
  weight: real(),
  color: text(),
  breed: text(),
  description: text(),
  announceNumber: text("announce_number"),
  announcementDate: text("announcement_date"),
  foundLocation: text("found_location"),
  personality: text(),
  status: text().default("보호중").notNull(),
  waitingDays: integer("waiting_days").default(0),
  activityLevel: integer("activity_level"),
  sensitivity: integer(),
  sociability: integer(),
  separationAnxiety: integer("separation_anxiety"),
  specialNotes: text("special_notes"),
  healthNotes: text("health_notes"),
  basicTraining: text("basic_training"),
  trainerComment: text("trainer_comment"),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  neutering: numeric(" neutering"),
  neutering: integer(),
});

export const account = sqliteTable("account", {
  id: text().primaryKey().notNull(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: integer(),
  refreshTokenExpiresAt: integer(),
  scope: text(),
  password: text(),
  createdAt: integer()
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer()
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const phoneVerificationRequests = sqliteTable(
  "phone_verification_requests",
  {
    id: text().primaryKey().notNull(),
    phoneNumber: text("phone_number").notNull(),
    verificationCode: text("verification_code").notNull(),
    expiresAt: integer("expires_at").notNull(),
    isUsed: integer("is_used").default(false).notNull(),
    createdAt: integer("created_at")
      .default(sql`(unixepoch())`)
      .notNull(),
  }
);

export const session = sqliteTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: integer().notNull(),
    token: text().notNull(),
    createdAt: integer()
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer()
      .default(sql`(unixepoch())`)
      .notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("session_token_unique").on(table.token)]
);

export const user = sqliteTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: integer().default(false),
    password: text(),
    image: text(),
    nickname: text(),
    phoneNumber: text("phone_number"),
    userType: text("user_type").default("일반사용자"),
    isPhoneVerified: integer("is_phone_verified").default(false),
    phoneVerifiedAt: integer("phone_verified_at"),
    kakaoId: text("kakao_id"),
    createdAt: integer()
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer()
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_kakao_id_unique").on(table.kakaoId),
    uniqueIndex("user_email_unique").on(table.email),
  ]
);

export const verification = sqliteTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: integer().notNull(),
  createdAt: integer().default(sql`(unixepoch())`),
  updatedAt: integer().default(sql`(unixepoch())`),
});

export const adoptionContractTemplates = sqliteTable(
  "adoption_contract_templates",
  {
    id: text().primaryKey().notNull(),
    centerId: text("center_id")
      .notNull()
      .references(() => centers.id, { onDelete: "cascade" }),
    title: text().notNull(),
    description: text(),
    content: text().notNull(),
    isActive: integer("is_active").default(true).notNull(),
    createdAt: integer("created_at")
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at")
      .default(sql`(unixepoch())`)
      .notNull(),
  }
);

export const centers = sqliteTable("centers", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text().notNull(),
  centerNumber: text("center_number"),
  description: text(),
  location: text(),
  region: text(),
  phoneNumber: text("phone_number"),
  adoptionProcedure: text("adoption_procedure"),
  adoptionGuidelines: text("adoption_guidelines"),
  hasMonitoring: integer("has_monitoring").default(false).notNull(),
  monitoringDescription: text("monitoring_description"),
  verified: integer().default(false).notNull(),
  isPublic: integer("is_public").default(false).notNull(),
  adoptionPrice: integer("adoption_price").default(0).notNull(),
  imageUrl: text("image_url"),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  monitoringPeriodMonths: integer("monitoring_period_months").default(3),
  monitoringIntervalDays: integer("monitoring_interval_days").default(14),
});

export const matchingQuestionnaires = sqliteTable("matching_questionnaires", {
  id: text().primaryKey().notNull(),
  title: text().notNull(),
  description: text(),
  isActive: integer("is_active").default(true).notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const matchingQuestions = sqliteTable("matching_questions", {
  id: text().primaryKey().notNull(),
  questionnaireId: text("questionnaire_id")
    .notNull()
    .references(() => matchingQuestionnaires.id, { onDelete: "cascade" }),
  sequence: integer().default(0).notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(),
  options: text().notNull(),
  weight: integer().default(1).notNull(),
  category: text(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const matchingResponses = sqliteTable("matching_responses", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  questionnaireId: text("questionnaire_id")
    .notNull()
    .references(() => matchingQuestionnaires.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => matchingQuestions.id, { onDelete: "cascade" }),
  selectedOptions: text("selected_options").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const matchingResults = sqliteTable("matching_results", {
  id: text().primaryKey().notNull(),
  sessionId: text("session_id")
    .notNull()
    .references(() => matchingSessions.id, { onDelete: "cascade" }),
  animalId: text("animal_id")
    .notNull()
    .references(() => animals.id, { onDelete: "cascade" }),
  matchScore: integer("match_score").notNull(),
  compatibilityReport: text("compatibility_report").notNull(),
  matchingFactors: text("matching_factors").notNull(),
  potentialChallenges: text("potential_challenges"),
  recommendations: text(),
  recommendationLevel: text("recommendation_level").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const matchingSessions = sqliteTable("matching_sessions", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  questionnaireId: text("questionnaire_id")
    .notNull()
    .references(() => matchingQuestionnaires.id, { onDelete: "cascade" }),
  isCompleted: integer("is_completed").default(false).notNull(),
  completedAt: integer("completed_at"),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const userPreferences = sqliteTable("user_preferences", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  sessionId: text("session_id")
    .notNull()
    .references(() => matchingSessions.id, { onDelete: "cascade" }),
  preferences: text().notNull(),
  animalType: text("animal_type"),
  sizePreference: text("size_preference"),
  activityLevel: text("activity_level"),
  experienceLevel: text("experience_level"),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const favorites = sqliteTable("favorites", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  targetId: text("target_id").notNull(),
  targetType: text("target_type").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text().notNull(),
  content: text().notNull(),
  type: text().notNull(),
  isRead: integer("is_read").default(false).notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const personalityTests = sqliteTable("personality_tests", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  testResults: text("test_results"),
  recommendedAnimals: text("recommended_animals"),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const questionForms = sqliteTable("question_forms", {
  id: text().primaryKey().notNull(),
  centerId: text("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  question: text().notNull(),
  type: text().notNull(),
  options: text(),
  isRequired: integer("is_required").default(false).notNull(),
  sequence: integer().default(1).notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const postImages = sqliteTable("post_images", {
  id: text().primaryKey().notNull(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const postTags = sqliteTable("post_tags", {
  id: text().primaryKey().notNull(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  tagName: text("tag_name").notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const posts = sqliteTable("posts", {
  id: text().primaryKey().notNull(),
  userId: text("user_id")
    .default("temp_user")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  animalId: text("animal_id").references(() => animals.id, {
    onDelete: "set null",
  }),
  title: text().notNull(),
  content: text().notNull(),
  likeCount: integer("like_count").default(0).notNull(),
  commentCount: integer("comment_count").default(0).notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  adoptionsId: text("adoptions_id"),
  contentTags: text("content_tags"),
  visibility: text("visibility"),
});

export const animalFavorites = sqliteTable(
  "animal_favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    animalId: text("animal_id")
      .notNull()
      .references(() => animals.id, { onDelete: "cascade" }),
    createdAt: integer("created_at")
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.animalId],
      name: "animal_favorites_user_id_animal_id_pk",
    }),
  ]
);

export const centerFavorites = sqliteTable(
  "center_favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    centerId: text("center_id")
      .notNull()
      .references(() => centers.id, { onDelete: "cascade" }),
    createdAt: integer("created_at")
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.centerId],
      name: "center_favorites_user_id_center_id_pk",
    }),
  ]
);

export const notices = sqliteTable("notices", {
  id: text().primaryKey().notNull(),
  centerId: text("center_id")
    .notNull()
    .references(() => centers.id, { onDelete: "cascade" }),
  title: text().notNull(),
  content: text().notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const superadminNotices = sqliteTable("superadmin_notices", {
  id: text().primaryKey().notNull(),
  title: text().notNull(),
  content: text().notNull(),
  isActive: integer("is_active").default(true).notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const phoneVerificationTokens = sqliteTable(
  "phone_verification_tokens",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    phoneNumber: text("phone_number").notNull(),
    token: text().notNull(),
    isUsed: integer("is_used").default(false),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at")
      .default(sql`(unixepoch())`)
      .notNull(),
  }
);

export const userSettings = sqliteTable(
  "user_settings",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    phone: text(),
    phoneVerification: integer("phone_verification").default(false),
    name: text(),
    birth: text(),
    address: text(),
    addressIsPublic: integer("address_is_public").default(false),
    createdAt: integer("created_at")
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at")
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => [uniqueIndex("user_settings_user_id_unique").on(table.userId)]
);

export const adoptionMonitoring = sqliteTable("adoption_monitoring", {
  id: text().primaryKey().notNull(),
  adoptionId: text("adoption_id")
    .notNull()
    .references(() => adoptions.id, { onDelete: "cascade" }),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const adoptionMonitoringChecks = sqliteTable(
  "adoption_monitoring_checks",
  {
    id: text().primaryKey().notNull(),
    adoptionId: text("adoption_id")
      .notNull()
      .references(() => adoptions.id, { onDelete: "cascade" }),
    checkSequence: integer("check_sequence").notNull(),
    checkDate: integer("check_date").notNull(),
    expectedCheckDate: integer("expected_check_date").notNull(),
    periodStart: integer("period_start").notNull(),
    periodEnd: integer("period_end").notNull(),
    postsFound: integer("posts_found").default(0).notNull(),
    status: text().notNull(),
    delayDays: integer("delay_days").default(0),
    daysUntilDeadline: integer("days_until_deadline"),
    nextCheckDate: integer("next_check_date"),
    notes: text(),
    createdAt: integer("created_at")
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at")
      .default(sql`(unixepoch())`)
      .notNull(),
  }
);

export const replies = sqliteTable("replies", {
  id: text().primaryKey().notNull(),
  commentId: text("comment_id")
    .notNull()
    .references(() => comments.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text().notNull(),
  likeCount: integer("like_count").default(0).notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});

export const comments = sqliteTable("comments", {
  id: text().primaryKey().notNull(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text().notNull(),
  likeCount: integer("like_count").default(0).notNull(),
  createdAt: integer("created_at")
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at")
    .default(sql`(unixepoch())`)
    .notNull(),
});
