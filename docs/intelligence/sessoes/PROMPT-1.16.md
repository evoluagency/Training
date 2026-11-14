# Mensagem inicial da sessão 1.16

Sessão "EVOLU Intelligence 1.16 (Avatar ao vivo: arquitetura do ciclo em tempo real e sessão B da cintura para cima)". Continuação da 1.15. Não refaça o que já foi aprovado.

Modelo sugerido: Fable 5.2 (arquitetura e risco). Opus 5.5 para publicação e operações. Sonnet 5.5 para tarefas mecânicas.

Leia antes de agir, nesta ordem:
1. CLAUDE.md e AGENTS.md
2. o "Resumo vigente" de docs/practice-engine/BACKEND_COMPLETION_GATE.md
3. HANDOFF-1.15.md (prevalece sobre o 1.14): no Training, branch feat/intelligence-avatar-meeting, em docs/intelligence/sessoes/ (cópia de trabalho, porque a escrita no intelligence segue negada)
4. FULL_BODY_CAPTURE_PROPOSAL.md, se o proprietário anexar
5. no Training: docs/intelligence/REUNIAO_COM_O_AVATAR.md, lib/intelligence/motion-track.ts, app/intelligence/motion-studio.tsx, voice-studio.tsx e lib/training/service.ts (rotas capture-*)

Repositórios:
- evoluagency/intelligence (só backend e documentação): add_repo com "push" uma vez. Se negar, usar "read" e entregar arquivos ao proprietário. Só a branch docs/digital-instructor-architecture-v0-1.
- evoluagency/Training: só a branch feat/intelligence-avatar-meeting (último commit 8d301ca). Antes de cada push, conferir git.deploymentEnabled falso no vercel.json. Não criar PR.

Já ACEITOS (não pedir de novo): tudo do HANDOFF-1.14 e 1.15, training-api v10 publicada, Preview do 8d301ca, e-mail Zoho em evolu.ink, migração 20261112175107 (não reaplicar).

Decisões vigentes do proprietário:
- Piloto da cintura para cima. Avatar AO VIVO, em tempo real, o mais realista possível. Vídeo pronto não é o mercado.
- Lançamento: o proprietário apresenta o produto no palco conversando ao vivo com a própria versão de IA.
- Resposta começando em 1 a 2 s, interrupção nos dois sentidos. O modelo de respostas pode ser trocado.
- Lançar o quanto antes.
- Nenhum uso de AWS até o produto estar pronto para venda (exceção para treino em GPU só com aceite). Retenção: não apagar nada nos testes.

NÃO aceito ainda (pedir com franquia e estimativa antes): qualquer modelo de IA pago por uso além da franquia gratuita do conector da Vercel, nova versão da training-api, Preview novo, AWS, serviço pago, bypass de automação da Vercel, desligar o minimumReleaseAge do pnpm.

TAREFA, em ordem:
1. Perguntar ao proprietário, se ainda não respondeu: modelo e memória da placa de vídeo, e se anexa a proposta de captação.
2. Desenhar a arquitetura do ciclo ao vivo (documento no intelligence, ou arquivo entregue): ouvir, detectar fim de fala e interrupção, responder com o conteúdo do capacitador e o motor de prática, falar com a voz própria em fluxo, animar o avatar (expressões da sessão A, gestos da sessão B, boca pelos fonemas). Comparar cadeia separada e modelo de fala para fala, com latência, custo por minuto de conversa e controle da voz própria. Separar a demonstração do lançamento (máquina com GPU) da versão dos alunos (navegador). Motores trocáveis.
3. Desenhar a sessão B da cintura para cima com roteiro próprio (gestos de aula, mãos, postura), reaproveitando a página e o servidor da sessão A.
4. Plano de construção do mês 1: ciclo ao vivo de ponta a ponta com avatar simples, validado localmente, sem custo.
5. Atualizar o HANDOFF-1.16 ao fim de cada etapa e escrever o PROMPT-1.17, salvos em docs/intelligence/sessoes/ no Training (e no intelligence se houver escrita), com commit e push.

Regras:
- Nenhuma chamada a modelo pago, workflow, Codespace, AWS, serviço novo ou deploy fora do já aceito sem informar a franquia e a estimativa e receber aceite. Nunca pedir nem exibir chave (usar o formulário seguro de credencial).
- Node precisa de NODE_USE_ENV_PROXY=1. Validação local antes de cada push: tsc, lint sem erro novo (76 antigos), testes 80 de 80 mais os novos, navegador sem tela com --use-fake-device-for-media-stream=device-count=2 em localhost.
- Commits com [skip ci].
- No fim de cada etapa, sugerir o modelo da próxima.
- Respostas em português do Brasil, diretas, sem ponto e vírgula.
