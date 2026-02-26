CREATE TABLE `ognanization-contexts` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`context` text NOT NULL,
	`updated_by` varchar(150),
	`created_by` varchar(150),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ognanization-contexts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization-users` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`user_id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization-users_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_users_user_org_unique` UNIQUE(`user_id`,`organization_id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`name` varchar(150) NOT NULL,
	`slug` varchar(150) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`deleted_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`email` varchar(255) NOT NULL,
	`first_name` varchar(100),
	`last_name` varchar(100),
	`display_name` varchar(150),
	`is_email_verified` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`deleted_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `organization-users` ADD CONSTRAINT `organization-users_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization-users` ADD CONSTRAINT `organization-users_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;