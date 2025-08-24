CREATE TABLE `adoption_monitoring_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`adoption_id` text NOT NULL,
	`check_sequence` integer NOT NULL,
	`check_date` integer NOT NULL,
	`expected_check_date` integer NOT NULL,
	`period_start` integer NOT NULL,
	`period_end` integer NOT NULL,
	`posts_found` integer DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	`delay_days` integer DEFAULT 0,
	`days_until_deadline` integer,
	`next_check_date` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`adoption_id`) REFERENCES `adoptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `replies` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_comments`("id", "post_id", "user_id", "content", "like_count", "created_at", "updated_at") SELECT "id", "post_id", "user_id", "content", "like_count", "created_at", "updated_at" FROM `comments`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
ALTER TABLE `__new_comments` RENAME TO `comments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `adoptions` ADD `meeting_scheduled_at` integer;--> statement-breakpoint
ALTER TABLE `adoptions` ADD `contract_sent_at` integer;--> statement-breakpoint
ALTER TABLE `adoptions` ADD `adoption_completed_at` integer;--> statement-breakpoint
ALTER TABLE `adoptions` ADD `monitoring_started_at` integer;--> statement-breakpoint
ALTER TABLE `adoptions` ADD `monitoring_next_check_at` integer;--> statement-breakpoint
ALTER TABLE `adoptions` ADD `monitoring_end_date` integer;--> statement-breakpoint
ALTER TABLE `adoptions` ADD `monitoring_completed_checks` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `adoptions` ADD `monitoring_total_checks` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `adoptions` ADD `monitoring_status` text DEFAULT '진행중';--> statement-breakpoint
ALTER TABLE `adoptions` ADD `center_notes` text;--> statement-breakpoint
ALTER TABLE `adoptions` DROP COLUMN `contract_agreement`;--> statement-breakpoint
ALTER TABLE `centers` ADD `monitoring_period_months` integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE `centers` ADD `monitoring_interval_days` integer DEFAULT 14;--> statement-breakpoint
ALTER TABLE `centers` DROP COLUMN `monitoring_period_days`;--> statement-breakpoint
ALTER TABLE `posts` ADD `adoptions_id` text;