-- Aplicada no Supabase do Training em 12/11/2026 (versao 20261112175107) com aceite do proprietario, sessao 1.13.
-- Origem: intelligence docs/digital-instructor/capture/proposal-20261112-motion-capture.sql, sem begin/commit.
-- Espelho SQLite (drizzle/0008) e codigo ficam para a sessao 1.14.


-- 1. Aceite da modalidade C ampliada (imagem-rascunho-0.1): camera obrigatoria, movimento marcado, sem voz.
alter table training.capture_consents drop constraint capture_consents_mode_check;
alter table training.capture_consents
  add constraint capture_consents_mode_check check (mode in ('lesson', 'interview', 'voice', 'motion'));

alter table training.capture_consents add column motion boolean not null default false;

alter table training.capture_consents
  add constraint capture_consents_motion_check check (
    (mode = 'motion' and motion and camera and not voice)
    or (mode <> 'motion' and not motion)
  );

-- 2. Sessao de captacao: A = face, B = body, C = lesson.
create table training.capture_sessions (
  "id" text not null,
  "consent_id" text not null,
  "stage" text not null check ("stage" in ('face', 'body', 'lesson')),
  "script_version" text not null,
  "started_at" bigint not null,
  "ended_at" bigint,
  primary key ("id"),
  foreign key ("consent_id") references training.capture_consents ("id"),
  check ("ended_at" is null or "ended_at" >= "started_at")
);
create index capture_sessions_consent on training.capture_sessions ("consent_id", "started_at");
alter table training.capture_sessions enable row level security;

-- 3. Cameras da sessao. source = 'browser' (camera aberta na pagina, trilha de referencia) ou
--    'device_file' (arquivo gravado no app de camera do celular, que NAO sobe para o Supabase).
create table training.capture_cameras (
  "session_id" text not null,
  "camera_id" text not null check ("camera_id" ~ '^[a-z0-9_]{1,16}$'),
  "role" text not null check ("role" in ('close', 'medium', 'wide', 'reference')),
  "source" text not null check ("source" in ('browser', 'device_file')),
  "device_label" text,
  "location" text check ("location" in ('owner_disk', 'owner_drive')),
  "file_name" text,
  "sha256" text check ("sha256" ~ '^[0-9a-f]{64}$'),
  "bytes" bigint check ("bytes" > 0),
  "duration_ms" integer check ("duration_ms" between 1000 and 14400000),
  "width" integer check ("width" between 320 and 7680),
  "height" integer check ("height" between 240 and 7680),
  "fps" real check ("fps" between 10 and 240),
  "codec" text,
  "sync_offset_ms" integer,
  "drift_ppm" real,
  "created_at" bigint not null,
  primary key ("session_id", "camera_id"),
  foreign key ("session_id") references training.capture_sessions ("id"),
  constraint capture_cameras_file_check check (
    ("source" = 'browser' and "location" is null and "file_name" is null and "sha256" is null and "bytes" is null)
    or ("source" = 'device_file' and "location" is not null and "file_name" is not null
        and "sha256" is not null and "bytes" is not null)
  )
);
alter table training.capture_cameras enable row level security;

-- 4. Item 'track': trecho de trilha extraida (JSON compactado), ligado a uma camera da sessao.
alter table training.capture_items drop constraint capture_items_kind_check;
alter table training.capture_items
  add constraint capture_items_kind_check check (kind in ('photo', 'recording', 'voice', 'track'));

alter table training.capture_items drop constraint capture_items_moment_check;
alter table training.capture_items
  add constraint capture_items_moment_check check (
    moment in ('answer_start', 'expression', 'interval', 'session', 'script_line', 'room_tone', 'track_chunk')
  );

alter table training.capture_items
  add column camera_id text,
  add column track text,
  add column t0_ms integer;

-- Foto e gravacao podem indicar a camera (opcional). Com camera, ela precisa existir na sessao.
alter table training.capture_items
  add constraint capture_items_camera_fk foreign key (session_id, camera_id)
  references training.capture_cameras (session_id, camera_id);

-- Campos por tipo de item. Substitui capture_items_voice_fields_check, com a mesma regra de voz.
alter table training.capture_items drop constraint capture_items_voice_fields_check;
alter table training.capture_items
  add constraint capture_items_kind_fields_check check (
    (
      kind = 'voice'
      and mime = 'audio/wav'
      and script_version is not null
      and duration_ms between 300 and 40000
      and sample_rate between 16000 and 96000
      and (
        (moment = 'script_line' and line_id is not null)
        or (moment = 'room_tone' and line_id is null)
      )
      and camera_id is null and track is null and t0_ms is null
    )
    or (
      kind = 'track'
      and mime = 'application/gzip'
      and moment = 'track_chunk'
      and camera_id is not null
      and track in ('face', 'pose', 'hands', 'marks')
      and t0_ms >= 0
      and duration_ms between 1 and 120000
      and script_version is null and line_id is null and sample_rate is null
    )
    or (
      kind in ('photo', 'recording')
      and moment not in ('script_line', 'room_tone', 'track_chunk')
      and script_version is null and line_id is null
      and duration_ms is null and sample_rate is null
      and track is null and t0_ms is null
    )
  );

-- Leitura das trilhas em ordem. Reextracoes ficam guardadas, o perfil usa a mais recente de cada trecho.
create index capture_items_track_idx
  on training.capture_items (session_id, camera_id, track, t0_ms, created_at)
  where kind = 'track';

-- 5. Perfil de estilo versionado. O JSON fica no bucket privado, a linha guarda versao e aprovacao.
create table training.style_profiles (
  "id" text not null,
  "user_id" text not null,
  "consent_id" text not null,
  "schema_version" text not null,
  "profile_version" text not null,
  "key" text not null,
  "size" integer not null check ("size" > 0),
  "created_at" bigint not null,
  "approved_at" bigint,
  "revoked_at" bigint,
  primary key ("id"),
  unique ("key"),
  unique ("user_id", "profile_version"),
  foreign key ("consent_id") references training.capture_consents ("id")
);
alter table training.style_profiles enable row level security;

revoke all on training.capture_sessions, training.capture_cameras, training.style_profiles
  from public, anon, authenticated;

-- 6. Bucket: aceitar trilha compactada e o JSON do perfil. Continua privado, limite de 50 MB por arquivo.
update storage.buckets
  set allowed_mime_types = array['image/jpeg', 'video/webm', 'video/mp4', 'audio/wav', 'application/gzip', 'application/json']
  where id = 'intelligence-capture';

