CREATE TABLE `banners` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text DEFAULT 'main' NOT NULL,
	`title` text,
	`description` text,
	`alt` text NOT NULL,
	`image_url` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`link_url` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
