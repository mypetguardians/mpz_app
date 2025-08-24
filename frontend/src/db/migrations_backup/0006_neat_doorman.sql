CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`email` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT '접수' NOT NULL,
	`priority` text DEFAULT '보통' NOT NULL,
	`admin_response` text,
	`admin_id` text,
	`responded_at` integer,
	`user_agent` text,
	`ip_address` text,
	`device_info` text,
	`page_url` text,
	`attachments` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`admin_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `feedback_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
