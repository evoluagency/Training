# Mensagem inicial da sessão 1.15

Sessão "EVOLU Intelligence 1.15 (Sessão A de captação: publicação, teste real e conferência com a proposta)". Continuação da 1.14. Não refaça o que já foi aprovado.

Modelo sugerido: Opus 5.5 (publicação e teste com login real). Sonnet 5.5 para conferir roteiro e textos.

Leia antes de agir, nesta ordem:
1. CLAUDE.md e AGENTS.md
2. o "Resumo vigente" de docs/practice-engine/BACKEND_COMPLETION_GATE.md
3. docs/digital-instructor/HANDOFF-1.14.md (prevalece sobre o 1.13). Se não estiver no intelligence, use o texto abaixo
4. docs/digital-instructor/capture/FULL_BODY_CAPTURE_PROPOSAL.md (§2, §5, §6, §9, §10). Se não estiver, peça ao proprietário na primeira mensagem
5. no Training: lib/training/service.ts (rotas capture-*), lib/intelligence/motion-track.ts, roteiro-expressoes-0.1.json, app/intelligence/motion-studio.tsx e motion-capture.ts

Repositórios:
- evoluagency/intelligence (só backend e documentação): chame add_repo (owner "evoluagency", repo "intelligence", access "push") uma vez. Nas 1.12 a 1.14 foi negado com escrita e liberado com leitura. Se negar, não contornar: use "read" e entregue os arquivos ao proprietário. Só a branch docs/digital-instructor-architecture-v0-1.
- evoluagency/Training: só a branch feat/intelligence-avatar-meeting (último commit da 1.14: 8d301ca). Antes de cada push, confira que o vercel.json mantém "git.deploymentEnabled" falso para a branch. Não crie PR.

Já ACEITOS (não pedir de novo): tudo o que o HANDOFF-1.13 lista, migração de movimento 20261112175107 (aplicada, não reaplicar), @mediapipe/tasks-vision 1.2.2 com modelo e WASM servidos pelo Training, e o código local da 1.14.

Decisões vigentes: nenhum uso de AWS até o produto estar pronto para venda. Retenção: não apagar nada no primeiro teste.

NÃO aceito ainda (pedir com franquia e estimativa antes): publicar a training-api v10, Preview novo, AWS, serviço pago, bypass de automação da Vercel criado por agente, desligar o minimumReleaseAge do pnpm.

TAREFA, em ordem:
1. Conferir roteiro-expressoes-0.1 e o formato trilha-0.1 (colunas de rosto e de marcas) com a proposta. Divergência de texto exige versão nova do roteiro (0.2), nunca editar a 0.1 já usada.
2. Com aceite: publicar a training-api v10 e o Preview da branch (plano gratuito). Conferir que o build roda scripts/mediapipe-assets.mjs.
3. Teste do proprietário com login real em /admin/captacao-avatar: termo, câmera, alguns passos, trechos no bucket privado (só conferir chaves e contagem, sem baixar conteúdo), registro do arquivo do celular.
4. Commitar no intelligence (se houver escrita) HANDOFF-1.12 a 1.14, PROMPT-1.13 a 1.15, a proposta e o SQL da proposta, com [skip ci].
5. Repetir as revisões abertas: timbre das amostras, políticas rascunho-0.1, captacao-rascunho-0.1, voz-rascunho-0.1 e imagem-rascunho-0.1, licenças (espeak-ng GPL-3, piper-tts GPL-3, num2words LGPL, voz faber derivada da lessac, MediaPipe Apache 2.0), leitura do roteiro de voz, placa NVIDIA no computador do proprietário.
6. Só depois: desenho da sessão B (corpo) com roteiro próprio.

Regras:
- Nenhuma chamada a modelo, workflow, Codespace, AWS, serviço novo ou deploy fora do já aceito sem informar a franquia e a estimativa e receber aceite. Nunca pedir nem exibir chave.
- Node precisa de NODE_USE_ENV_PROXY=1. PostgreSQL local de teste em diretório próprio do usuário postgres (ex. /var/tmp).
- Validação local antes de cada push: tsc, lint sem erro novo (o Training tem 76 antigos), testes 80 de 80 mais os novos, navegador sem tela com --use-fake-device-for-media-stream=device-count=2 (prévia em localhost, não 127.0.0.1). Informe a porta dos servidores locais.
- Commits com [skip ci]. Crie o HANDOFF-1.15 e atualize ao fim de cada etapa. Ao fim, escreva o PROMPT-1.16.md no mesmo formato.
- No fim de cada etapa, sugerir o modelo da próxima: Fable 5.2 para arquitetura e risco, Opus 5.5 para decisões e operações, Sonnet 5.5 para tarefas mecânicas.
- Respostas em português do Brasil, diretas, sem ponto e vírgula.
