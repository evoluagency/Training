-- PROPOSTA (nao aplicada). Fica fora de supabase/migrations ate o aceite explicito do proprietario.
-- Captacao da entrevista do proprietario (D23, D25, D29) e registro do aceite da politica de imagem.
-- Mesmo padrao do Training: tabelas no esquema training com RLS ligada e sem acesso de anon/authenticated.
-- Leitura e escrita so pela funcao training-api (servidor), que confere sessao e papel.

-- Bucket privado separado do training-files (retencao e acesso proprios). Limite de 50 MB por arquivo.
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('intelligence-capture','intelligence-capture',false,52428800,ARRAY['image/jpeg','video/webm','video/mp4'])
ON CONFLICT (id) DO NOTHING;

-- Aceite da politica de imagem: quem, quando, qual versao e o que foi aceito. Revogacao registrada, nunca apagada.
CREATE TABLE training.capture_consents (
  "id" text NOT NULL,
  "user_id" text NOT NULL,
  "email" text NOT NULL,
  "mode" text NOT NULL CHECK ("mode" IN ('lesson','interview')),
  "policy_version" text NOT NULL,
  "camera" boolean NOT NULL DEFAULT false,
  "photos" boolean NOT NULL DEFAULT false,
  "recording" boolean NOT NULL DEFAULT false,
  "accepted_at" bigint NOT NULL,
  "revoked_at" bigint,
  PRIMARY KEY ("id")
);
CREATE INDEX capture_consents_user ON training.capture_consents ("user_id","accepted_at");
ALTER TABLE training.capture_consents ENABLE ROW LEVEL SECURITY;

-- Itens captados (fotos em momentos relevantes e gravacao), sempre ligados a um aceite valido.
CREATE TABLE training.capture_items (
  "id" text NOT NULL,
  "consent_id" text NOT NULL,
  "session_id" text NOT NULL,
  "kind" text NOT NULL CHECK ("kind" IN ('photo','recording')),
  "moment" text NOT NULL CHECK ("moment" IN ('answer_start','expression','interval','session')),
  "key" text NOT NULL,
  "mime" text NOT NULL,
  "size" integer NOT NULL CHECK ("size" > 0),
  "created_at" bigint NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("key"),
  FOREIGN KEY ("consent_id") REFERENCES training.capture_consents ("id")
);
CREATE INDEX capture_items_session ON training.capture_items ("session_id","created_at");
ALTER TABLE training.capture_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON training.capture_consents, training.capture_items FROM PUBLIC, anon, authenticated;
-- Sem politicas de storage para anon/authenticated: o bucket so e acessado pela funcao do servidor.
