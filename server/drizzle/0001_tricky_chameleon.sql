CREATE TABLE `mcp_plugins` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`name` varchar(255) NOT NULL,
	`description` varchar(1024),
	`config_needed` json NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mcp_plugins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_mcp_plugins` (
	`id` varchar(36) NOT NULL DEFAULT (uuid()),
	`mcp_plugin_id` varchar(36) NOT NULL,
	`organization_id` varchar(36) NOT NULL,
	`config` json NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_mcp_plugins_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_mcp_plugins_org_plugin_unique` UNIQUE(`organization_id`,`mcp_plugin_id`)
);
--> statement-breakpoint
ALTER TABLE `organization_mcp_plugins` ADD CONSTRAINT `organization_mcp_plugins_mcp_plugin_id_mcp_plugins_id_fk` FOREIGN KEY (`mcp_plugin_id`) REFERENCES `mcp_plugins`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_mcp_plugins` ADD CONSTRAINT `organization_mcp_plugins_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;