# Teste local do espelho ao vivo (sem Preview, sem custo)

Para quem desenvolve e testa. Não aparece para o usuário da sala.

## Antes
- Node 22 ou mais novo e o repositório Training na branch `feat/intelligence-avatar-meeting`, atualizado (`git pull`).
- Uma câmera (a do notebook serve) e boa luz no rosto.
- Chrome ou Edge.

## Passos (PowerShell no Windows)
1. Na pasta do Training: `npx pnpm@11.25.0 install --frozen-lockfile` (só na primeira vez).
2. Terminal 1, o serviço de mentira: `node scripts/intelligence-stub.mjs`
3. Terminal 2, o site:
   ```
   $env:INTELLIGENCE_LOCAL_PREVIEW="1"
   $env:INTELLIGENCE_AVATAR_URL="http://127.0.0.1:4173"
   npx pnpm@11.25.0 dev
   ```
   No Mac ou Linux: `INTELLIGENCE_LOCAL_PREVIEW=1 INTELLIGENCE_AVATAR_URL=http://127.0.0.1:4173 pnpm dev`. O `pnpm dev` já copia os arquivos do leitor de rosto.
4. Abra `http://localhost:3000/intelligence/previa`. Use `localhost`, não o número do IP, senão o navegador bloqueia a câmera.
5. Clique em "Entrar na sala", depois "Participar agora". Na janela da câmera, marque o aceite e clique em "Ligar a câmera". Permita a câmera no navegador. Se perguntar da captação, escolha "Continuar sem captação".
6. Na barra de baixo, clique no ícone de rosto (dica: "Espelho: o robô imita você"). Na primeira vez aparece "Carregando o leitor de rosto…" por alguns segundos.

## O que conferir
- Vire a cabeça, incline, abra a boca, sorria, pisque, levante as sobrancelhas, olhe para os lados. O robô deve acompanhar, como num espelho (você vira para a sua direita, ele vira para o lado que você veria no reflexo).
- Cubra a câmera ou saia do quadro: em cerca de meio segundo o robô volta ao comportamento normal.
- Faça uma pergunta no chat. Quando o robô falar, a boca segue a voz e o resto continua espelhando.
- Desligue o espelho no mesmo botão: o robô volta ao normal.

## O que anotar para o ajuste fino
Tremor ou lentidão, olhar exagerado ou fraco, boca que abre pouco ou demais, sorriso fraco, lado trocado, e se o notebook esquenta ou o vídeo trava. Informe o aparelho e o navegador.

## Se algo falhar
- "Não consegui carregar o leitor de rosto": rode `node scripts/mediapipe-assets.mjs` e abra de novo.
- Botão do espelho desligado (cinza): a câmera não está ligada.
- Página 404 na prévia: faltou `INTELLIGENCE_LOCAL_PREVIEW=1` ou você abriu pelo endereço de produção. A prévia só existe local.
- Nada é gravado nem enviado pelo espelho. Fechar o terminal encerra tudo.
