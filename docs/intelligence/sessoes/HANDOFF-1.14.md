# HANDOFF 1.14 — Sessão A de captação: servidor, roteiro de expressões, página e extração do rosto

Data: 12/11/2026. Prevalece sobre o HANDOFF-1.13.

## Estado dos repositórios
- Training, branch feat/intelligence-avatar-meeting: commits a4ac3cc (servidor, roteiro, espelho 0008) e 8d301ca (página, MediaPipe, sala). vercel.json mantém git.deploymentEnabled falso para a branch. Nenhum deploy, Preview ou publicação de função.
- Intelligence, branch docs/digital-instructor-architecture-v0-1: sem mudança. Documentos 1.12 a 1.14 e a proposta continuam fora do repositório (estão com o proprietário).

## Feito
1. drizzle/0008_intelligence_motion_capture.sql: espelho SQLite da 20261112175107 (GLOB no lugar de regex). Teste pglite com as 5 migrações reais, inclusive nos dois testes antigos de captação e voz (o servidor novo grava a coluna motion).
2. Servidor (lib/training/service.ts, lib/intelligence/motion-track.ts):
   - capture-consent mode motion: só administração, exige camera e motion, recusa voice, photos e recording (o vídeo fica com o capacitador). GET ?mode=motion devolve motion.
   - capture-session (POST, cria mov-<uuid> com etapa tirada do roteiro), capture-session/:id/end, capture-camera (upsert, browser ou device_file com local, nome, SHA-256 e bytes, até 4 câmeras), capture-session-progress (por câmera e trilha: trechos, tempo coberto, último início, reextrações, sem chave nem URL).
   - capture-upload kind=track moment=track_chunk: application/gzip até 4 MB, descompactado até 32 MB, esquema evolu.motion-track 0.1, trilha, sessão, câmera e t0 iguais ao envio, durationMs 1 a 120000, primeira coluna t em ms dentro do trecho e em ordem, só inteiros, até 240 quadros/s, extrator com SHA-256 do modelo (opcional só em marks), marcas com step dentro do roteiro. Chave capture/motion/<usuário>/<sessão>/<câmera>/<trilha>/<t0>-<id>.json.gz. Reextrações ficam guardadas.
3. lib/intelligence/roteiro-expressoes-0.1.json (63 passos, cerca de 10 min ativos, 15 com pausas) e expression-script-ids.ts para o servidor. Blocos: P preparo e palmas, N neutro, G 8 giros, O olhar em 8 direções, X 16 expressões isoladas (3 vezes, 2 s), S 6 sons e 10 frases, R 8 reações de aula, L fala livre 2 min, F palmas finais. Escrito a partir do resumo da proposta: conferir com o §2 quando a proposta for anexada.
4. MediaPipe: @mediapipe/tasks-vision 1.2.2 (publicada em 03/11/2026, passa na regra de 7 dias, a 1.2.3 só a partir de 18/11). Apache 2.0, sem URL de telemetria no pacote.
   - Modelo public/intelligence/mediapipe/face_landmarker.task (float16/1), 3.758.596 bytes, SHA-256 64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff. Contém BlazeFace curta distância, Face Mesh V2 e Blendshape V2. Os três cartões: Apache 2.0, uso previsto inclui avatar 3D controlado pelas expressões, fora de escopo reconhecimento de identidade e vigilância (não usamos). Limite: perde o rosto com giro acima de 80° ou menos de 50% visível.
   - WASM vision_wasm_internal.js f2b9c171…db5b e .wasm f5bd2514…64ab, copiados de node_modules por scripts/mediapipe-assets.mjs no dev e no build (confere versão e SHA-256, fora do git). Licença em LICENSE-Apache-2.0.txt. Manifesto em lib/intelligence/mediapipe-assets.ts.
5. Página /admin/captacao-avatar ("Captação do avatar" no menu): termo imagem-rascunho-0.1, câmera com prévia e aviso de imagem preta, roteiro passo a passo (espaço começa ou encerra, R repete, S pula), marcas (início, fim, repetição, pulo, palmas), extração ao vivo (52 expressões 0 a 255, rotação em centésimos de grau, cerca de 30 quadros/s), trilhas de 60 s em série com nova tentativa e download do que falhar, fim com registro do arquivo do celular (nome, bytes, SHA-256 informado pelo proprietário com certutil ou shasum). Sala da entrevista: escolha da câmera (vale para a gravação) e aviso de imagem preta. Prévia ?modo=captacao com API fictícia que confere cada trecho com o leitor do servidor.
6. Validação local: tsc limpo, lint com os mesmos 76 erros antigos, testes 80 de 80 (72 antigos e 8 novos). Navegador sem tela em localhost:3100 com 2 câmeras fictícias (troca de câmera na captação e na sala) e com uma foto de teste do MediaPipe como vídeo por 65 s: expressões ao vivo, 2 trechos de rosto e 1 de marcas aceitos, 390 px sem rolagem horizontal. Defeito achado e corrigido: o seletor fechava a câmera ao sair do preparo.

## Decisões desta sessão (revisar se quiser)
- Modo motion recusa fotos e gravação de vídeo no servidor.
- A sessão só nasce de um roteiro conhecido. Hoje só a etapa face tem roteiro, B e C ficam recusadas até haver roteiro.
- SHA-256 do arquivo do celular é digitado pelo proprietário.
- Colunas da trilha de rosto: t, as 52 categorias do MediaPipe (com _neutral), yaw, pitch, roll. Marcas: t, step (índice do passo), event (1 início, 2 fim, 3 repetição, 4 pulo, 5 palmas). Conferir com o §5 da proposta.

## Pendente
- Aceites: training-api v10 (as rotas novas só existem no servidor depois dela) e Preview da branch (plano gratuito da Vercel, um build).
- Conferir roteiro e formato com FULL_BODY_CAPTURE_PROPOSAL.md §2, §5, §6, §9 e §10.
- Revisões abertas e a pergunta da placa NVIDIA.
- Commitar no intelligence os documentos 1.12 a 1.15 quando houver escrita.
