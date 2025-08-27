CREATE TABLE `push_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`platform` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_used` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_tokens_token_unique` ON `push_tokens` (`token`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
DROP TABLE IF EXISTS `notifications`;--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`data` text,
	`is_read` integer DEFAULT false NOT NULL,
	`push_token` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`read_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=ON;