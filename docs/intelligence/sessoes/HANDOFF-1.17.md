# HANDOFF 1.17 — Avatar ao vivo: semana 1 do ciclo e mapa de cobertura

Data: 14/11/2026. Prevalece sobre o HANDOFF-1.16. Tarefas 1, 2 e 4 do PROMPT-1.17 feitas. Tarefa 3 (robô do Blender, segunda iteração) não feita: depende do proprietário pedir.

## Estado
- Training, branch feat/intelligence-avatar-meeting. vercel.json mantém git.deploymentEnabled falso para a branch (conferido antes do push).
- Nenhuma publicação, build, workflow, Preview, modelo pago ou AWS nesta sessão.
- Container sem node_modules no início: instalado com pnpm 11.25.0 e lockfile congelado (pacotes gratuitos, fora do Git).

## Feito
1. lib/intelligence/live/events.ts: eventos do ciclo (voz.inicio, voz.fim, ouvir.parcial, ouvir.final, vez.fim, interrupcao.aluno, interrupcao.avatar, resposta.inicio, resposta.trecho, resposta.fim, fala.inicio, fala.fim) e interfaces Listener, Responder, Speaker, Animator.
2. lib/intelligence/live/turn.ts: máquina da vez como funções puras (idle, student, thinking, avatar). stepTurn devolve novo estado, efeitos (parar.fala, cancelar.resposta, registrar.corte, iniciar.resposta, ouvir.retomar) e eventos emitidos. silenceNeededMs: 350 ms após frase fechada, 600 ms padrão, 900 ms após frase aberta. runTurn reproduz uma conversa gravada.
3. lib/intelligence/live/vad.ts: detector de voz por energia (dBFS RMS), com histerese, ruído de fundo adaptativo, início após 200 ms e fim após 300 ms. Com o avatar falando, o limite sobe 10 dB para o eco não cortá-lo. startMicVad liga ao microfone com echoCancellation, noiseSuppression e autoGainControl.
4. Aluno corta o avatar: meeting.tsx liga o detector ao abrir o microfone. Voz real com o avatar falando silencia a fala (voz neural e do navegador) e volta a ouvir. Se o detector falhar, a sala segue como antes. Limite: a resposta já em curso na rede não é cancelada (a busca do Intelligence ainda não usa AbortSignal), fica para a semana 2.
5. lib/intelligence/live/coverage.ts: etiqueta da tomada (giro, inclinação, olhar, expressão, voz ok) e mapa de cobertura. Rosto nunca reprova, voz ruim não preenche o mapa. nextRequest escolhe a casa mais vazia, mantém cerca de metade das tomadas de frente e só pede giro forte se liberado. A etiqueta vira linha da trilha `marks` (labelToMarkRow, MARK_COLUMNS) e passa no validateTrack atual, sem servidor novo. Limiares em LIMITS são provisórios e precisam de calibração com o extrator real.
6. tests/live.test.ts: 14 testes novos, incluídos no `npm test`.

## Validação local
- tsc limpo. Lint: 76 erros antigos, nenhum novo. Testes: 94 de 94 (80 antigos mais 14).
- Navegador sem tela com microfone e câmera falsos em localhost (prévia com serviço de mentira): entrou na sala, abriu o microfone, o detector pediu o áudio com cancelamento de eco, sem erro de console. Não medi o corte em tempo real porque o navegador sem tela não tem voz sintetizada nem reconhecimento. Falta teste manual no celular e no notebook.

## Pendente
- DECIDIDO pelo proprietário (14/11): ciclo ao vivo primeiro, robô do Blender depois. Sem Preview novo por enquanto. Espelho ao vivo pedido e incluído no PROMPT-1.18.
- Semana 2: resposta em fluxo do dublê do Intelligence, frase a frase, com AbortSignal, painel de latência.
- Medir o tempo real do corte (meta 300 ms) em aparelho de verdade. Eco: fone ou eco cancelado continua requisito antes de liberar a interrupção para todos.
- Ligar o mapa de cobertura à tela de captação em modo selfie (hoje só funções e testes). Calibrar LIMITS com o extrator de rosto.
- Pendências do HANDOFF-1.16 seguem valendo (Blender, licenças de voz, teste de 10 frases, placa de vídeo opcional).

## Adendo: início da semana 2 (mesma sessão)
- lib/intelligence/live/latency.ts: etapas (resposta, voz, total), mediana e meta de 2 s, com teste. Total: 95 testes de 95.
- meeting.tsx: a busca ao Intelligence (`lesson/ask`, `interview/reply`) agora aceita AbortSignal. Se o aluno volta a falar enquanto o avatar pensa, a resposta é descartada (efeito cancelar.resposta da máquina da vez) e a sala volta a ouvir. Painel de latência na aba Roteiro (mediana, resposta, voz).
- Medido em navegador sem tela com serviço de mentira: resposta 1,2 s. O trecho de voz (2,7 s) é artefato do navegador sem voz (espera 2,5 s). Medir de novo em aparelho real.
- Frase a frase: a voz já sintetiza por trechos. Resposta realmente em fluxo exige rota de streaming no Intelligence (a lista de rotas do gateway é fechada, hoje devolve a fala inteira). Decisão para a 1.18 (exige acordo com o backend).

## Adendo: espelho ao vivo (tarefa 2 do PROMPT-1.18, feita ainda na 1.17)
- lib/intelligence/live/mirror.ts: mirrorPose converte as 52 expressões do MediaPipe e os ângulos da cabeça em pose do robô (boca, sorriso, bico, piscar, sobrancelhas, olhar, giro, aceno, inclinação). Função pura, com inversão de espelho (giro, inclinação e olhar horizontal), limites de 0,5 rad e valores ruins tratados. 2 testes novos. Total: 97 de 97.
- avatar3d.tsx: nova função setMirror no handle. A pose é suavizada no laço de desenho e assume cabeça, olhos, pálpebras, sobrancelhas e, com o avatar calado, a boca. Quando fala, a boca segue a voz. Sem rosto por 600 ms volta ao comportamento normal. Nomes de pivôs e materiais não mudaram.
- meeting.tsx: botão com ícone de rosto na barra, ativo só com a câmera ligada. Usa o extrator que já existe (MediaPipe local), 25 quadros por segundo, sem gravar nem enviar nada. Desligável a qualquer hora.
- Validação: tsc limpo, lint 76 erros antigos sem novo, 97 de 97. Navegador sem tela com câmera falsa: o leitor carregou, o botão ligou, sem erro. NÃO verificado o movimento do robô, porque a câmera falsa não tem rosto. Falta teste com rosto real (notebook ou celular) e ajuste fino de ganhos (olhar, boca, suavização).
- Nota: `next dev` direto não copia o WASM do MediaPipe. Usar `pnpm dev` ou rodar antes `node scripts/mediapipe-assets.mjs`.
- Próximos degraus do caminho "robô vira pessoa" ficam fora do mês 1: reconstrução da aparência após as sessões e expressões geradas pela fala (precisam de estimativa de GPU e custo antes, de preferência com Opus).
