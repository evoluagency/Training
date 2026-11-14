# Mensagem inicial da sessão 1.18

Sessão "EVOLU Intelligence 1.18 (Avatar ao vivo: semana 2 do ciclo, resposta em fluxo e latência)". Continuação da 1.17. Não refaça o que já foi aprovado. Franquia do proprietário baixa: trabalhe de forma econômica.

Modelo sugerido: Sonnet 5.5. Opus só para decisão de arquitetura, segurança ou publicação.

Leia nesta ordem: CLAUDE.md e AGENTS.md, HANDOFF-1.17.md (prevalece sobre o 1.16), ARQUITETURA_CICLO_AO_VIVO.md (seção 9), lib/intelligence/live/*, app/intelligence/meeting.tsx.

Repositórios: Training só na branch feat/intelligence-avatar-meeting (conferir git.deploymentEnabled falso no vercel.json antes de cada push, sem PR). Intelligence: escrita negada.

Já ACEITOS: tudo dos HANDOFF 1.14 a 1.17. NÃO aceito (pedir com franquia e estimativa): modelo pago, nova training-api, Preview novo, AWS, serviço pago.

Decisões do proprietário (14/11): ciclo ao vivo primeiro, Blender depois, sem Preview novo por enquanto. Não perguntar de novo.

TAREFA:
1. Semana 2 (já feito na 1.17: AbortSignal na busca, painel de latência, latency.ts. Falta streaming real, que pede rota nova no Intelligence, e medir em aparelho real): resposta em fluxo vinda do dublê do Intelligence, frase a frase, ligada à voz existente, com AbortSignal (cancelar no corte do aluno). Painel de latência por etapa (meta: primeiro som, mediana até 2 s).
2. Espelho ao vivo (pedido do proprietário em 14/11): o robô imita a expressão da pessoa durante a conversa. Usar o extrator de rosto que já existe (app/intelligence/face-extractor.ts, MediaPipe no navegador, local e sem custo): giro e inclinação da cabeça, direção dos olhos e coeficientes de expressão (boca, sorriso, sobrancelhas, piscar) ligados aos pivôs do robô (Head, Jaw, Mouth, EyeL/R, LidL/R) em avatar3d.tsx, com suavização para não tremer. Mapeamento como função pura com testes (lib/intelligence/live/mirror.ts). Só roda com a câmera ligada e o consentimento já existente, sem gravar nada novo. Desligável por botão. Não mudar nomes de pivôs nem de materiais. Conferir em navegador sem tela com câmera falsa e mandar capturas.
   Contexto: é o primeiro degrau do caminho "robô vira pessoa" (espelho ao vivo, depois reconstrução da aparência após as sessões, depois expressões geradas pela fala). Os dois últimos degraus ficam fora do mês 1 e exigem estimativa de GPU e custo antes de qualquer gasto, de preferência registrados numa conversa com Opus.
3. Ligar o mapa de cobertura (live/coverage.ts) à tela de captação do modo selfie, gravando a etiqueta na trilha marks.
4. Robô do Blender, só se o proprietário pedir.
5. HANDOFF-1.18 ao fim de cada etapa, PROMPT-1.19, commit [skip ci] e push.

Regras: NODE_USE_ENV_PROXY=1. Antes de cada push: tsc, lint sem erro novo (76 antigos), npm test (94 mais os novos), navegador sem tela com --use-fake-device-for-media-stream. Apagar .next/dev antes do tsc. Português do Brasil, direto, sem ponto e vírgula. Títulos de sessão: "EVOLU Intelligence 1.N (tema da etapa)".
