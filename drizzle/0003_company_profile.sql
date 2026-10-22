ALTER TABLE `companies` ADD COLUMN `cnpj` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_cnpj_unique` ON `companies` (`cnpj`);
--> statement-breakpoint
ALTER TABLE `companies` ADD COLUMN `responsible_name` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `companies` ADD COLUMN `responsible_email` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `companies` ADD COLUMN `responsible_whatsapp` text NOT NULL DEFAULT '';
