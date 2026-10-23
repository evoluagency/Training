CREATE SCHEMA IF NOT EXISTS training;

REVOKE ALL ON SCHEMA training FROM PUBLIC, anon, authenticated;

SET search_path TO training, public;

CREATE TABLE training."administrators" (
  "user_id" text NOT NULL,
  "email" text NOT NULL,
  PRIMARY KEY ("user_id")
);

ALTER TABLE training."administrators" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."companies" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "seats" integer NOT NULL,
  "active" integer NOT NULL DEFAULT 1,
  "cnpj" text,
  "responsible_name" text NOT NULL DEFAULT '',
  "responsible_email" text NOT NULL DEFAULT '',
  "responsible_whatsapp" text NOT NULL DEFAULT '',
  PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "companies_0_unique" ON training."companies" ("cnpj");

ALTER TABLE training."companies" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."members" (
  "id" text NOT NULL,
  "company_id" text NOT NULL,
  "user_id" text,
  "email" text NOT NULL,
  "name" text NOT NULL,
  "job_title" text NOT NULL DEFAULT '',
  "whatsapp" text NOT NULL DEFAULT '',
  "role" text NOT NULL DEFAULT 'learner',
  "active" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("company_id") REFERENCES training."companies"("id")
);

CREATE UNIQUE INDEX "members_0_unique" ON training."members" ("email");

CREATE UNIQUE INDEX "members_1_unique" ON training."members" ("user_id");

ALTER TABLE training."members" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."catalogs" (
  "id" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  PRIMARY KEY ("id")
);

ALTER TABLE training."catalogs" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."courses" (
  "id" text NOT NULL,
  "catalog_id" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "hours" integer NOT NULL,
  "duration" integer NOT NULL,
  "passing" integer NOT NULL,
  "attempt_limit" integer NOT NULL,
  "certificate" integer NOT NULL DEFAULT 1,
  "status" text NOT NULL DEFAULT 'draft',
  "show_on_home" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("catalog_id") REFERENCES training."catalogs"("id")
);

ALTER TABLE training."courses" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."grants" (
  "company_id" text NOT NULL,
  "course_id" text NOT NULL,
  PRIMARY KEY ("company_id","course_id"),
  FOREIGN KEY ("course_id") REFERENCES training."courses"("id"),
  FOREIGN KEY ("company_id") REFERENCES training."companies"("id")
);

ALTER TABLE training."grants" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."modules" (
  "id" text NOT NULL,
  "course_id" text NOT NULL,
  "title" text NOT NULL,
  "position" integer NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("course_id") REFERENCES training."courses"("id")
);

ALTER TABLE training."modules" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."lessons" (
  "id" text NOT NULL,
  "module_id" text NOT NULL,
  "course_id" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL DEFAULT '',
  "position" integer NOT NULL,
  "mode" text NOT NULL DEFAULT 'equivalent',
  PRIMARY KEY ("id"),
  FOREIGN KEY ("course_id") REFERENCES training."courses"("id"),
  FOREIGN KEY ("module_id") REFERENCES training."modules"("id")
);

ALTER TABLE training."lessons" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."assets" (
  "id" text NOT NULL,
  "lesson_id" text NOT NULL,
  "key" text NOT NULL,
  "name" text NOT NULL,
  "mime" text NOT NULL,
  "size" integer NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("lesson_id") REFERENCES training."lessons"("id")
);

ALTER TABLE training."assets" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."questions" (
  "id" text NOT NULL,
  "course_id" text NOT NULL,
  "prompt" text NOT NULL,
  "options" text NOT NULL,
  "correct" integer NOT NULL,
  "position" integer NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("course_id") REFERENCES training."courses"("id")
);

ALTER TABLE training."questions" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."progress" (
  "member_id" text NOT NULL,
  "lesson_id" text NOT NULL,
  "completed_at" bigint NOT NULL,
  PRIMARY KEY ("member_id","lesson_id"),
  FOREIGN KEY ("lesson_id") REFERENCES training."lessons"("id"),
  FOREIGN KEY ("member_id") REFERENCES training."members"("id")
);

ALTER TABLE training."progress" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."attempts" (
  "id" text NOT NULL,
  "member_id" text NOT NULL,
  "course_id" text NOT NULL,
  "number" integer NOT NULL,
  "started_at" bigint NOT NULL,
  "deadline" bigint NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "questions" text NOT NULL,
  "answers" text NOT NULL DEFAULT '{}',
  "score" integer,
  "passed" integer,
  "submitted_at" bigint,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("course_id") REFERENCES training."courses"("id"),
  FOREIGN KEY ("member_id") REFERENCES training."members"("id")
);

CREATE UNIQUE INDEX "attempts_0_unique" ON training."attempts" ("member_id","course_id","number");

ALTER TABLE training."attempts" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."surveys" (
  "member_id" text NOT NULL,
  "course_id" text NOT NULL,
  "score" integer,
  "comment" text NOT NULL DEFAULT '',
  "created_at" bigint NOT NULL,
  PRIMARY KEY ("member_id","course_id"),
  FOREIGN KEY ("course_id") REFERENCES training."courses"("id"),
  FOREIGN KEY ("member_id") REFERENCES training."members"("id")
);

ALTER TABLE training."surveys" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."certificates" (
  "id" text NOT NULL,
  "member_id" text NOT NULL,
  "course_id" text NOT NULL,
  "name" text NOT NULL,
  "company" text NOT NULL,
  "title" text NOT NULL,
  "hours" integer NOT NULL,
  "score" integer NOT NULL,
  "issued_at" bigint NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("course_id") REFERENCES training."courses"("id"),
  FOREIGN KEY ("member_id") REFERENCES training."members"("id")
);

CREATE UNIQUE INDEX "certificates_0_unique" ON training."certificates" ("member_id","course_id");

ALTER TABLE training."certificates" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."resources" (
  "id" text NOT NULL,
  "company_id" text NOT NULL,
  "member_id" text,
  "title" text NOT NULL,
  "href" text,
  "key" text,
  "name" text,
  "mime" text,
  "size" integer,
  "lesson_id" text,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("member_id") REFERENCES training."members"("id"),
  FOREIGN KEY ("company_id") REFERENCES training."companies"("id"),
  FOREIGN KEY ("lesson_id") REFERENCES training."lessons"("id")
);

ALTER TABLE training."resources" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."comments" (
  "id" text NOT NULL,
  "company_id" text NOT NULL,
  "course_id" text NOT NULL,
  "user_id" text NOT NULL,
  "author" text NOT NULL,
  "role" text NOT NULL,
  "body" text NOT NULL,
  "created_at" bigint NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("course_id") REFERENCES training."courses"("id"),
  FOREIGN KEY ("company_id") REFERENCES training."companies"("id")
);

ALTER TABLE training."comments" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training."lesson_notes" (
  "member_id" text NOT NULL,
  "lesson_id" text NOT NULL,
  "body" text NOT NULL DEFAULT '',
  "updated_at" bigint NOT NULL,
  PRIMARY KEY ("member_id","lesson_id"),
  FOREIGN KEY ("lesson_id") REFERENCES training."lessons"("id"),
  FOREIGN KEY ("member_id") REFERENCES training."members"("id")
);

ALTER TABLE training."lesson_notes" ENABLE ROW LEVEL SECURITY;

CREATE TABLE training.settings (key text PRIMARY KEY,value text NOT NULL);

ALTER TABLE training.settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA training FROM PUBLIC,anon,authenticated;

CREATE FUNCTION training.json_extract(document text, path text) RETURNS text LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$ SELECT document::jsonb ->> trim(both '"' from substring(path from 3)) $$;
CREATE FUNCTION training.json_extract(document jsonb, path text) RETURNS text LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$ SELECT document ->> trim(both '"' from substring(path from 3)) $$;
CREATE FUNCTION training.json_array_length(document text) RETURNS integer LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$ SELECT jsonb_array_length(document::jsonb) $$;
CREATE FUNCTION training.json_each(document text) RETURNS TABLE(value jsonb) LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$ SELECT jsonb_array_elements(document::jsonb) $$;
CREATE FUNCTION training.json_set(document text, path text, choice integer) RETURNS text LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = pg_catalog AS $$ SELECT jsonb_set(document::jsonb,ARRAY[trim(both '"' from substring(path from 3))],to_jsonb(choice))::text $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA training FROM PUBLIC,anon,authenticated;
CREATE INDEX members_company_active ON training.members(company_id,active);
CREATE INDEX lessons_course ON training.lessons(course_id);
CREATE INDEX attempts_member_course ON training.attempts(member_id,course_id);
CREATE INDEX comments_company_course ON training.comments(company_id,course_id,created_at);
CREATE INDEX resources_company_lesson ON training.resources(company_id,lesson_id);
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types) VALUES ('training-files','training-files',false,104857600,ARRAY['application/pdf','image/png','image/jpeg','image/webp','video/mp4','video/webm','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel','text/csv']) ON CONFLICT(id) DO NOTHING;
