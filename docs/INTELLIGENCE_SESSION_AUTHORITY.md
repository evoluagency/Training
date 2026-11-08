# EVOLU Training — autoridade de sessão para Intelligence (CP041)

Escopo exclusivamente backend. Nova Edge Function independente da training-api, sem mudanças em Auth, frontend, schemas ou migrations.

A função recebe POST autenticado por assinatura Ed25519 da Intelligence: path fixo /functions/v1/intelligence-session-authority; headers x-evolu-service, x-evolu-timestamp, x-evolu-nonce, x-evolu-signature (base64url). O texto assinado é composto por v1, intelligence, POST, path, timestamp_ms, nonce e JSON do corpo, unidos por newline. O corpo contém somente issuer, subject (UUID), sessionId (UUID). A janela é de dez segundos e o endpoint não tem CORS.

A consulta SQL confere simultaneamente auth.sessions.id, auth.sessions.user_id e validade not_after. Retorna somente {active: true|false}, sem identificadores ou dados pessoais. Assinatura inválida = HTTP 401; serviço indisponível = HTTP 503; nenhuma falha pode resultar em acesso aprovado. A consulta é somente leitura e reconsulta a sessão a cada chamada, sem cache. O nonce não constitui deduplicação distribuída; replay dentro da janela curta volta a consultar o estado real.

Provisionamento efetivado em 08/11/2026: chave pública Ed25519 fixada no código da nova função (não é segredo; rotação exigirá nova revisão e nova publicação). Chave privada correspondente configurada como variável **sensitive**, exclusivamente na branch de Preview da Vercel Intelligence, sem ser copiada ao repositório ou à produção. A variável SUPABASE_DB_URL permanece administrada pelo próprio Supabase Training.

A nova função independente **foi implantada** em Supabase Training como intelligence-session-authority v1, estado ACTIVE, com verify_jwt=false e validação obrigatória Ed25519 antes da consulta SQL. A função training-api v7 permaneceu sem alterações; nenhuma migration ou deploy Vercel foi executado. O endpoint é técnico servidor-servidor, não rota pública de usuário.

Aceite real pendente: invocar a função publicada com assinatura válida e sessão real recém-emitida e repetir após logout, demonstrando autenticação, resultado booleano e falha fechada. O status ACTIVE e a inspeção do código publicado não comprovam execução de POST assinado; a consulta externa não estava disponível nesta sessão. O backend da Intelligence continua fechado até o backup gerenciado real e o E2E protegido.
