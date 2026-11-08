# EVOLU Training — autoridade de sessão para Intelligence (CP041)

Escopo exclusivamente backend. Nova Edge Function independente da training-api, sem mudanças em Auth, frontend, schemas ou migrations.

A função recebe POST autenticado por assinatura Ed25519 da Intelligence: path fixo /functions/v1/intelligence-session-authority; headers x-evolu-service, x-evolu-timestamp, x-evolu-nonce, x-evolu-signature (base64url). O texto assinado é composto por v1, intelligence, POST, path, timestamp_ms, nonce e JSON do corpo, unidos por newline. O corpo contém somente issuer, subject (UUID), sessionId (UUID). A janela é de dez segundos e o endpoint não tem CORS.

A consulta SQL confere simultaneamente auth.sessions.id, auth.sessions.user_id e validade not_after. Retorna somente {active: true|false}, sem identificadores ou dados pessoais. Assinatura inválida = HTTP 401; serviço indisponível = HTTP 503; nenhuma falha pode resultar em acesso aprovado. A consulta é somente leitura e reconsulta a sessão a cada chamada, sem cache. O nonce não constitui deduplicação distribuída; replay dentro da janela curta volta a consultar o estado real.

Estado atualizado em 08/11/2026: a chave Ed25519 inicial, proveniente de preparação, foi **revogada**. A nova chave pública de verificação foi fixada no código da função e publicada na versão 2; fingerprint SHA-256 `4366b052bd4399e06154e323955a95906de7a76fffc28663ef4513e392743ea3`. A variável privada do Preview na Vercel teve seu valor antigo neutralizado. O novo segredo não pôde ser instalado pela integração conectada devido a bloqueio de segurança; deve ser inserido exclusivamente pelo responsável no Secret da branch. A variável SUPABASE_DB_URL permanece gerenciada pelo Supabase Training.

A função independente foi implantada no Supabase Training como **intelligence-session-authority v2**, estado ACTIVE, com verify_jwt=false e validação obrigatória Ed25519 antes da consulta SQL. A função training-api v7 permaneceu sem alterações; nenhuma migration ou deploy Vercel foi executado. O endpoint é técnico servidor-servidor, não rota pública de usuário.

Aceite real pendente: instalar a nova chave privada no Preview e invocar a função publicada com assinatura válida e sessão real recém-emitida e repetir após logout, demonstrando autenticação, resultado booleano e falha fechada. O status ACTIVE e a inspeção do código publicado não comprovam execução de POST assinado; a consulta externa não estava disponível nesta sessão. O backend da Intelligence continua fechado até o backup gerenciado real e o E2E protegido.
