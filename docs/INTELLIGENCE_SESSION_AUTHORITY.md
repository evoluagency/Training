# EVOLU Training — autoridade de sessão para Intelligence (CP041)

Escopo exclusivamente backend. Nova Edge Function independente da training-api, sem mudanças em Auth, frontend, schemas ou migrations.

A função recebe POST autenticado por assinatura Ed25519 da Intelligence: path fixo /functions/v1/intelligence-session-authority; headers x-evolu-service, x-evolu-timestamp, x-evolu-nonce, x-evolu-signature (base64url). O texto assinado é composto por v1, intelligence, POST, path, timestamp_ms, nonce e JSON do corpo, unidos por newline. O corpo contém somente issuer, subject (UUID), sessionId (UUID). A janela é de dez segundos e o endpoint não tem CORS.

A consulta SQL confere simultaneamente auth.sessions.id, auth.sessions.user_id e validade not_after. Retorna somente {active: true|false}, sem identificadores ou dados pessoais. Assinatura inválida = HTTP 401; serviço indisponível = HTTP 503; nenhuma falha pode resultar em acesso aprovado. A consulta é somente leitura e reconsulta a sessão a cada chamada, sem cache. O nonce não constitui deduplicação distribuída; replay dentro da janela curta volta a consultar o estado real.

Secrets ainda necessários: Training Supabase EVOLU_INTELLIGENCE_SESSION_ED25519_PUBLIC_JWK (apenas JWK pública Ed25519). A variável SUPABASE_DB_URL já serve a training-api e precisa estar disponível na nova função. Intelligence Vercel Preview guarda a chave privada correspondente apenas em Secret server-only, nunca em código, navegador, workflow ou conversa.

Não implantar antes de provisionar a chave pública e revisar permissões. A futura função deve usar verify_jwt=false SOMENTE porque a autenticação técnica Ed25519 é obrigatória antes de SQL; ela não é uma rota pública de usuário. Este commit não realiza deploy. O Training continua em produção sem alterações.

Aceite real pendente: configurar chaves, invocar a função com sessão real recém-emitida e repetir depois de logout. Testes offline não substituem prova do ambiente gerenciado.
