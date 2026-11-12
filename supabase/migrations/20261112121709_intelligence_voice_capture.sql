-- Aplicada no Supabase do Training em 12/11/2026 (versao 20261112121709) com aceite do proprietario, sessao 1.11.
-- Texto de intelligence docs/digital-instructor/voice/proposal-20261112-voice-capture.sql sem begin/commit.
-- Nao cria tabela, nao altera RLS nem permissoes. Modo voz = so audio, item de voz = uma frase do roteiro em WAV PCM 16 bits mono.

-- 1. Aceite do termo de voz (modalidade B do CONSENT_TERM_DRAFT.md) como modo proprio.
alter table training.capture_consents drop constraint capture_consents_mode_check;
alter table training.capture_consents
  add constraint capture_consents_mode_check check (mode in ('lesson', 'interview', 'voice'));

alter table training.capture_consents add column voice boolean not null default false;

-- Modo voz: so audio. Os outros modos nunca marcam voz.
alter table training.capture_consents
  add constraint capture_consents_voice_only_check check (
    (mode = 'voice' and voice and not camera and not photos and not recording)
    or (mode <> 'voice' and not voice)
  );

-- 2. Item de voz: uma frase do roteiro por arquivo WAV (PCM 16 bits, mono).
alter table training.capture_items drop constraint capture_items_kind_check;
alter table training.capture_items
  add constraint capture_items_kind_check check (kind in ('photo', 'recording', 'voice'));

alter table training.capture_items drop constraint capture_items_moment_check;
alter table training.capture_items
  add constraint capture_items_moment_check check (
    moment in ('answer_start', 'expression', 'interval', 'session', 'script_line', 'room_tone')
  );

alter table training.capture_items
  add column script_version text,
  add column line_id text,
  add column duration_ms integer,
  add column sample_rate integer;

-- Campos de voz obrigatorios no item de voz e proibidos nos outros.
-- room_tone = 5 s de silencio do ambiente no inicio de cada sessao de gravacao.
alter table training.capture_items
  add constraint capture_items_voice_fields_check check (
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
    )
    or (
      kind <> 'voice'
      and moment not in ('script_line', 'room_tone')
      and script_version is null
      and line_id is null
      and duration_ms is null
      and sample_rate is null
    )
  );

-- Progresso por frase (regravacoes ficam guardadas, o treino usa a mais recente aprovada).
create index capture_items_voice_line_idx
  on training.capture_items (consent_id, script_version, line_id, created_at)
  where kind = 'voice';

-- 3. Bucket: aceitar WAV. Limite de 50 MB por arquivo continua (a rota limita a 4 MB).
update storage.buckets
  set allowed_mime_types = array['image/jpeg', 'video/webm', 'video/mp4', 'audio/wav']
  where id = 'intelligence-capture';

