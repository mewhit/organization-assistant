ALTER TABLE `organization-contexts` MODIFY COLUMN `updated_by` varchar(36);--> statement-breakpoint
ALTER TABLE `organization-contexts` ADD `organization_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `organization-contexts` ADD CONSTRAINT `organization-contexts_updated_by_users_id_fk` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization-contexts` DROP COLUMN `created_by`;