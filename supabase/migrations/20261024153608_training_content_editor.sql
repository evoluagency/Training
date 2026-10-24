ALTER TABLE training.catalogs ADD COLUMN cover_image text NOT NULL DEFAULT '';
ALTER TABLE training.courses ADD COLUMN cover_image text NOT NULL DEFAULT '';
ALTER TABLE training.courses ADD COLUMN content_locked integer NOT NULL DEFAULT 0;
UPDATE training.courses SET content_locked=1 WHERE status='published';
