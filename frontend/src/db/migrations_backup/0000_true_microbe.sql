CREATE TABLE `adoption_contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`adoption_id` text NOT NULL,
	`template_id` text NOT NULL,
	`contract_content` text NOT NULL,
	`guidelines_content` text,
	`user_signature_url` text,
	`user_signed_at` integer,
	`center_signature_url` text,
	`center_signed_at` integer,
	`status` text DEFAULT '대기중' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`adoption_id`) REFERENCES `adoptions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `adoption_contract_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `adoption_monitoring` (
	`id` text PRIMARY KEY NOT NULL,
	`adoption_id` text NOT NULL,
	`monitoring_date` integer NOT NULL,
	`method` text NOT NULL,
	`status` text NOT NULL,
	`notes` text,
	`image_urls` text,
	`conducted_by` text,
	`next_monitoring_date` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`adoption_id`) REFERENCES `adoptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `adoption_question_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`adoption_id` text NOT NULL,
	`question_id` text NOT NULL,
	`answer` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`adoption_id`) REFERENCES `adoptions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `adoption_questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `adoption_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`center_id` text NOT NULL,
	`sequence` integer DEFAULT 0 NOT NULL,
	`content` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`center_id`) REFERENCES `centers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `adoptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`animal_id` text NOT NULL,
	`status` text DEFAULT '신청' NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `animal_images` (
	`id` text PRIMARY KEY NOT NULL,
	`animal_id` text NOT NULL,
	`image_url` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `animals` (
	`id` text PRIMARY KEY NOT NULL,
	`center_id` text NOT NULL,
	`name` text NOT NULL,
	`is_female` integer NOT NULL,
	`age` integer NOT NULL,
	`weight` real,
	`color` text,
	`breed` text,
	`description` text,
	`announce_number` text,
	`announcement_date` text,
	`found_location` text,
	`personality` text,
	`status` text DEFAULT '보호중' NOT NULL,
	`waiting_days` integer DEFAULT 0,
	`activity_level` integer,
	`sensitivity` integer,
	`sociability` integer,
	`separation_anxiety` integer,
	`special_notes` text,
	`health_notes` text,
	`basic_training` text,
	`trainer_comment` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`center_id`) REFERENCES `centers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `phone_verification_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`phone_number` text NOT NULL,
	`verification_code` text NOT NULL,
	`expires_at` integer NOT NULL,
	`is_used` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false,
	`password` text,
	`image` text,
	`nickname` text,
	`phone_number` text,
	`user_type` text DEFAULT '일반사용자',
	`is_phone_verified` integer DEFAULT false,
	`phone_verified_at` integer,
	`kakao_id` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_kakao_id_unique` ON `user` (`kakao_id`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()),
	`updatedAt` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `adoption_contract_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`center_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`center_id`) REFERENCES `centers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `centers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`center_number` text,
	`description` text,
	`location` text,
	`region` text,
	`phone_number` text,
	`adoption_procedure` text,
	`adoption_guidelines` text,
	`has_monitoring` integer DEFAULT false NOT NULL,
	`monitoring_period_days` integer DEFAULT 30,
	`monitoring_description` text,
	`verified` integer DEFAULT false NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`adoption_price` integer DEFAULT 0 NOT NULL,
	`image_url` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`parent_comment_id` text,
	`content` text NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `matching_questionnaires` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `matching_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`questionnaire_id` text NOT NULL,
	`sequence` integer DEFAULT 0 NOT NULL,
	`question_text` text NOT NULL,
	`question_type` text NOT NULL,
	`options` text NOT NULL,
	`weight` integer DEFAULT 1 NOT NULL,
	`category` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`questionnaire_id`) REFERENCES `matching_questionnaires`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `matching_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`questionnaire_id` text NOT NULL,
	`question_id` text NOT NULL,
	`selected_options` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`questionnaire_id`) REFERENCES `matching_questionnaires`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `matching_questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `matching_results` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`animal_id` text NOT NULL,
	`match_score` integer NOT NULL,
	`compatibility_report` text NOT NULL,
	`matching_factors` text NOT NULL,
	`potential_challenges` text,
	`recommendations` text,
	`recommendation_level` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `matching_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `matching_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`questionnaire_id` text NOT NULL,
	`is_completed` integer DEFAULT false NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`questionnaire_id`) REFERENCES `matching_questionnaires`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text NOT NULL,
	`preferences` text NOT NULL,
	`animal_type` text,
	`size_preference` text,
	`activity_level` text,
	`experience_level` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `matching_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_id` text NOT NULL,
	`target_type` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`type` text NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `personality_tests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`test_results` text,
	`recommended_animals` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `question_forms` (
	`id` text PRIMARY KEY NOT NULL,
	`center_id` text NOT NULL,
	`question` text NOT NULL,
	`type` text NOT NULL,
	`options` text,
	`is_required` integer DEFAULT false NOT NULL,
	`sequence` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`center_id`) REFERENCES `centers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_images` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`image_url` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`tag_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text DEFAULT 'temp_user' NOT NULL,
	`animal_id` text,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`comment_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON UPDATE no action ON DELETE set null
);
