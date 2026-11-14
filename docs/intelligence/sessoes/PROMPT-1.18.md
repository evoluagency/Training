# Mensagem inicial da sessão 1.18

Sessão "EVOLU Intelligence 1.18 (Avatar ao vivo: semana 2 do ciclo, resposta em fluxo e latência)". Continuação da 1.17. Não refaça o que já foi aprovado. Franquia do proprietário baixa: trabalhe de forma econômica.

Modelo sugerido: Sonnet 5.5. Opus só para decisão de arquitetura, segurança ou publicação.

Leia nesta ordem: CLAUDE.md e AGENTS.md, HANDOFF-1.17.md (prevalece sobre o 1.16), ARQUITETURA_CICLO_AO_VIVO.md (seção 9), lib/intelligence/live/*, app/intelligence/meeting.tsx.

Repositórios: Training só na branch feat/intelligence-avatar-meeting (conferir git.deploymentEnabled falso no vercel.json antes de cada push, sem PR). Intelligence: escrita negada.

Já ACEITOS: tudo dos HANDOFF 1.14 a 1.17. NÃO aceito (pedir com franquia e estimativa): modelo pago, nova training-api, Preview novo, AWS, serviço pago.

Primeiro: pergunte se o proprietário respondeu às decisões abertas da 1.17 (robô do Blender e Preview novo).

TAREFA:
1. Semana 2: resposta em fluxo vinda do dublê do Intelligence, frase a frase, ligada à voz existente, com AbortSignal (cancelar no corte do aluno). Painel de latência por etapa (meta: primeiro som, mediana até 2 s).
2. Ligar o mapa de cobertura (live/coverage.ts) à tela de captação do modo selfie, gravando a etiqueta na trilha marks.
3. Robô do Blender, só se o proprietário pedir.
4. HANDOFF-1.18 ao fim de cada etapa, PROMPT-1.19, commit [skip ci] e push.

Regras: NODE_USE_ENV_PROXY=1. Antes de cada push: tsc, lint sem erro novo (76 antigos), npm test (94 mais os novos), navegador sem tela com --use-fake-device-for-media-stream. Apagar .next/dev antes do tsc. Português do Brasil, direto, sem ponto e vírgula. Títulos de sessão: "EVOLU Intelligence 1.N (tema da etapa)".
