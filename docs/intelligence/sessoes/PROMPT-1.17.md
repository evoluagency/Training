# Mensagem inicial da sessão 1.17

Sessão "EVOLU Intelligence 1.17 (Avatar ao vivo: semana 1 do ciclo, mapa de cobertura e robô fiel no Blender)". Continuação da 1.16. Não refaça o que já foi aprovado.

Modelo sugerido: Sonnet 5.5 para a construção (código com desenho já definido). Fable 5.2 ou Opus 5.5 só se surgir decisão de arquitetura, segurança ou publicação.

Leia antes de agir, nesta ordem:
1. CLAUDE.md e AGENTS.md
2. HANDOFF-1.16.md (prevalece sobre o 1.15), em docs/intelligence/sessoes/ no Training
3. docs/intelligence/ARQUITETURA_CICLO_AO_VIVO.md e docs/intelligence/CAPTACAO_DOIS_MODOS.md
4. no Training: app/intelligence/meeting.tsx, avatar3d.tsx, avatar-motion.ts, voice-studio.tsx, motion-studio.tsx

Repositórios:
- evoluagency/Training: só a branch feat/intelligence-avatar-meeting. Antes de cada push, conferir git.deploymentEnabled falso no vercel.json. Não criar PR.
- evoluagency/intelligence: escrita negada. add_repo com "read" funciona (branch docs/digital-instructor-architecture-v0-1). Não tentar "push" de novo sem o proprietário pedir.

Já ACEITOS (não pedir de novo): tudo dos HANDOFF 1.14 a 1.16, training-api v10, Preview do 8d301ca, backend concluído e fase visual autorizada (Resumo vigente do BACKEND_COMPLETION_GATE, 11/11/2026).

Decisões vigentes do proprietário:
- Avatar ao vivo em cadeia separada (ouvir, responder, falar, animar) com motores trocáveis. Confirmado em 14/11.
- Captação em dois modos: selfie (voz e rosto juntos, com mapa de cobertura, sem reprovar por erro de rosto) e afastado (corpo e formato, sem voz).
- Robô da sala no desenho EVOLU Design No-1. A versão em código (avatar3d.tsx) é provisória. O proprietário quer a versão fiel à imagem feita no Blender (confirmado em 14/11).
- Não perguntar de novo o modelo do celular. A placa de vídeo do notebook é opcional.
- Nenhum uso de AWS até o produto estar pronto para venda. Não apagar nada nos testes.

NÃO aceito ainda (pedir com franquia e estimativa antes): modelo de IA pago além da franquia gratuita do conector da Vercel, nova versão da training-api, Preview novo, AWS, serviço pago.

TAREFA, em ordem:
1. Semana 1 do plano (seção 9 da arquitetura): interfaces e eventos do ciclo em lib/intelligence/live/, máquina de estados da vez como funções puras com testes, detector de voz no navegador, aluno corta o avatar.
2. Etiqueta da tomada e mapa de cobertura do modo selfie como funções puras com testes (seção 2 da captação), guardando a etiqueta na trilha `marks` para não exigir servidor novo.
3. Robô fiel no Blender, sem custo. Referência: docs/intelligence/referencias/evolu-design-no-1.jpg.
   - Conferir primeiro se o Blender roda no container por script (pacote Python `bpy`, gratuito). Se não rodar, entregar o script e o passo a passo para o proprietário rodar no Blender do computador dele.
   - Modelo por script, da cintura para cima no enquadramento da sala, corpo inteiro no arquivo: casco branco em painéis, mecânica grafite aparente, cabos verdes, olhos acesos, marca no peito.
   - Articulações que a sala já anima: cabeça, mandíbula, olhos, pálpebras, sobrancelhas, mais ombros, cotovelos e mãos para os gestos.
   - Exportar em glTF binário (.glb) com compressão, alvo de até 3 MB, guardado em public/intelligence/. Carregar no avatar3d.tsx com o carregador do three, mantendo o robô em código como reserva se o arquivo falhar.
   - Avisar o proprietário do limite: modelo feito por script a partir de uma imagem só chega perto, não fica idêntico. O acabamento fino pede ajuste manual no Blender.
   - Conferir em navegador sem tela (tela larga e celular em pé) e mandar as capturas.
4. Atualizar o HANDOFF-1.17 ao fim de cada etapa e escrever o PROMPT-1.18, com commit [skip ci] e push.

Regras:
- Nenhuma chamada a modelo pago, workflow, Codespace, AWS, serviço novo ou deploy sem informar a franquia e a estimativa e receber aceite. Nunca pedir nem exibir chave.
- Node precisa de NODE_USE_ENV_PROXY=1. Validação local antes de cada push: tsc, lint sem erro novo (76 antigos), testes 80 de 80 mais os novos, navegador sem tela com --use-fake-device-for-media-stream em localhost.
- Depois de rodar o servidor de desenvolvimento, apagar .next/dev antes do tsc.
- Commits com [skip ci]. Respostas em português do Brasil, diretas, sem ponto e vírgula.
- Títulos de sessão no padrão "EVOLU Intelligence 1.N (tema da etapa)".
