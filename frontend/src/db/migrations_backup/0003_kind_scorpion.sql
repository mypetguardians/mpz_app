CREATE TABLE `phone_verification_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`phone_number` text NOT NULL,
	`token` text NOT NULL,
	`is_used` integer DEFAULT false,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`phone` text,
	`phone_verification` integer DEFAULT false,
	`name` text,
	`birth` text,
	`address` text,
	`address_is_public` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_id_unique` ON `user_settings` (`user_id`);--> statement-breakpoint
ALTER TABLE `adoption_monitoring` ADD `post_id` text NOT NULL REFERENCES posts(id);--> statement-breakpoint
ALTER TABLE `adoption_monitoring` DROP COLUMN `monitoring_date`;--> statement-breakpoint
ALTER TABLE `adoption_monitoring` DROP COLUMN `method`;--> statement-breakpoint
ALTER TABLE `adoption_monitoring` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `adoption_monitoring` DROP COLUMN `notes`;--> statement-breakpoint
ALTER TABLE `adoption_monitoring` DROP COLUMN `image_urls`;--> statement-breakpoint
ALTER TABLE `adoption_monitoring` DROP COLUMN `conducted_by`;--> statement-breakpoint
ALTER TABLE `adoption_monitoring` DROP COLUMN `next_monitoring_date`;--> statement-breakpoint
ALTER TABLE `adoptions` ADD `monitoring_agreement` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `adoptions` ADD `guidelines_agreement` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `adoptions` ADD `contract_agreement` integer NOT NULL;