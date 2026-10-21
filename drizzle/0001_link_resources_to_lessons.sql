ALTER TABLE `resources` ADD COLUMN `lesson_id` text REFERENCES `lessons`(`id`);
