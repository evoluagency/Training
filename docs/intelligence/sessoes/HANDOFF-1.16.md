# HANDOFF 1.16 — Avatar ao vivo: robô EVOLU Design No-1, arquitetura do ciclo e captação em dois modos

Data: 14/11/2026. Prevalece sobre o HANDOFF-1.15. Tarefas 1 a 5 do PROMPT-1.16 feitas no nível de desenho. Nada foi construído além do robô.

## Estado
- Training, branch feat/intelligence-avatar-meeting. vercel.json mantém git.deploymentEnabled falso para a branch.
- Intelligence: add_repo com push negado de novo (14/11), leitura liberada, clonado em 1905183. Resumo vigente lido: CP042_BACKEND_RELEASE_PASS, BACKEND_COMPLETE, VISUAL_PHASE_AUTHORIZED (11/11/2026). Os documentos desta sessão ficam no Training como cópia de trabalho.
- Nenhuma publicação, build, workflow ou modelo pago nesta sessão.

## Feito
1. Robô da sala (app/intelligence/avatar3d.tsx) refeito no desenho "EVOLU Design No-1" enviado pelo proprietário (referência em docs/intelligence/referencias/evolu-design-no-1.jpg): casco branco brilhante, olhos verdes acesos, pescoço de cabos, peitoral com "EVOLU DESIGN NO-1", barra de estado no peito, ombros com anel de estado e braços. Enquadramento passou de cabeça e ombros para busto. Continua feito em código (three), sem modelo externo. Boca, piscar, olhar e estados iguais aos de antes.
2. Validação local: tsc limpo, lint do arquivo sem erro, testes 80 de 80, conferido em navegador sem tela (tela larga e celular em pé).
   Limite: é uma aproximação geométrica da imagem, não o modelo fotorrealista. A versão fiel pede um modelo 3D feito em ferramenta própria (Blender, sem custo) ou gerado, e fica para decisão.

3. docs/intelligence/ARQUITETURA_CICLO_AO_VIVO.md (rascunho 0.1): ciclo ouvir, vez, responder, falar, animar, com interfaces e eventos. Orçamento de latência, interrupção nos dois sentidos, comparação entre cadeia separada e fala para fala (recomendação: cadeia separada), as duas camadas (palco com GPU e alunos no navegador) e o plano do mês 1 em quatro semanas, local e sem custo.
4. docs/intelligence/CAPTACAO_DOIS_MODOS.md (rascunho 0.1): modo selfie (voz e rosto juntos, etiqueta da tomada, mapa de cobertura, orientação em tempo real) e modo afastado (roteiro de sete blocos para corpo, roupa, gestos, mãos, rosto de perto e marcas). Ficha de aparência com versão. Substitui a "sessão B só de tronco".
5. Pesquisa rápida na internet (3 buscas, modo padrão): preços de avatar ao vivo pronto (Tavus perto de US$ 0,37 por minuto, HeyGen LiveAvatar perto de US$ 0,10 a 0,20, fontes divergentes) e fluxo de captação dos concorrentes (vídeo curto com roteiro e dicas, sem evidência de correção em tempo real). Não prova que ninguém faz.
6. PROMPT-1.17 escrito.
7. Robô fiel no Blender, primeira versão (pedido do proprietário em 14/11). Blender 5.3 roda no container como pacote Python gratuito (`bpy`, instalado fora do repositório). scripts/blender/evolu_design_no1.py modela o corpo inteiro por script e exporta public/intelligence/evolu-design-no-1.glb (cerca de 1 MB, 54 mil triângulos, sem textura). Peças rígidas em pivôs com nome fixo (Head, Jaw, Mouth, EyeL/R, LidL/R, Chest, ShoulderL/R, ElbowL/R, WristL/R) e materiais LedBar, LedRing e MouthGlow. avatar3d.tsx carrega o arquivo, com reflexos de estúdio gerados em código, e mantém o robô em código como reserva enquanto carrega ou se falhar. Enquadramento da cintura para cima. Validação: tsc limpo, lint do arquivo sem erro, testes 80 de 80, navegador sem tela em tela larga e celular em pé.
   Para gerar de novo: `python3 -m venv <pasta> && <pasta>/bin/pip install bpy && <pasta>/bin/python scripts/blender/evolu_design_no1.py public/intelligence/evolu-design-no-1.glb`.
   Limite: formas ainda simples (tronco liso, rosto de manequim). Faltam painéis recortados do casco, mãos detalhadas e acabamento fino, que pedem mais iterações no script ou ajuste manual no Blender.

## Decisões e direções do proprietário (14/11/2026, a detalhar na arquitetura)
- Captação pelo celular (ele usa um Xiaomi Poco, modelo exato a confirmar), câmera traseira, com outra pessoa segurando ou tripé. Considerar outros aparelhos, inclusive iPhone.
- Orientação ao vivo dentro do site durante a gravação (como o medidor de volume da voz): enquadramento, distância, luz, nitidez.
- Se possível, gravar corpo inteiro e rosto na mesma captação, mesmo com o piloto da cintura para cima.
- Guardar a aparência do capacitador (rosto, cabelo, barba, tatuagens, formato do corpo) e permitir que ele atualize depois.
- Roupas trocáveis no avatar, sem regravar. Possível canal de parceria ou patrocínio com marcas de roupa.
- Pergunta dele: depois de extraídos os dados, ainda é preciso guardar o vídeo?
- Placa de vídeo do notebook: ele não sabe informar. Orientado a ver no Gerenciador de Tarefas (Desempenho, GPU).

- Proposta dele (14/11): gravar voz e câmera juntas, numa sessão só, com os arquivos guardados separados (áudio num lugar, vídeo e trilha em outro). Mais intuitivo para o capacitador.

- Refinamento dele (14/11), que substitui a ideia de gravar voz à distância: DOIS modos de captação.
  - Modo selfie (celular perto, câmera frontal, no navegador): voz, entonação e expressões do rosto juntas. Cada frase vem com uma instrução de rosto (virar, olhar para cima, para baixo, olhar o horizonte). Avaliação em tempo real, como já é na voz.
  - Modo afastado (câmera traseira, outra pessoa ou tripé): só movimento do corpo e formato (silhueta, busto, braços). Sem voz e sem expressão facial.
  - Erro de execução não pede regravação, salvo voz ruim. O sistema registra o que foi feito de fato (exemplo: rosto virado mas olhos na câmera) e pede o ângulo que faltou numa frase seguinte.
  - Orientação falada ou escrita de enquadramento e áudio em tempo real (afaste, aproxime, áudio estourado, não vejo bem o rosto).
- Modelo exato do celular: o proprietário não tem como informar. Não cobrar de novo. O site mede no próprio aparelho o que a câmera entrega (resolução e quadros por segundo).

- CONFIRMADO (14/11): cadeia separada (ouvir, responder, falar, animar) é o caminho do ciclo ao vivo.
- CONFIRMADO (14/11): robô fiel à imagem, feito no Blender, entra no plano. O robô em código (commit 996d739) fica como versão provisória e como reserva.

## Recomendações do agente (para confirmar)
- Dois modos: adotar. Resolve o microfone (celular perto da boca) e dispensa a segunda tela. Viável com o extrator da sessão A: ele já entrega a rotação da cabeça e a direção dos olhos separadas, então dá para saber na hora se o rosto virou e o olho ficou na câmera. Em vez de aprovar ou reprovar, cada tomada recebe a etiqueta do que aconteceu e um mapa de cobertura decide a instrução das próximas frases.
- Cuidados: (1) manter boa parte das frases de frente e os giros moderados (até uns 30 graus), porque falar de lado muda o som que chega ao microfone, (2) a câmera frontal serve para expressão, mas a textura fina do rosto (pele, barba) fica melhor com um trecho curto de rosto feito pela câmera traseira no modo afastado, (3) "ninguém faz isso" ainda não foi pesquisado, não afirmar em material de venda antes de conferir.
- Sessão conjunta de voz e câmera: faz sentido e vira o padrão da sessão B. Ganho principal: boca, expressão e entonação já nascem sincronizadas. Condições: (1) microfone perto da boca (fone com fio ou segundo aparelho), porque o celular a 2 m grava eco da sala e piora a voz, (2) segunda tela (notebook) como monitor e leitor das frases, já que a câmera traseira esconde a tela do celular, (3) as 200 frases do bloco A continuam válidas, não regravar, (4) manter o modo só voz como reserva. Antes de adotar: teste de 10 frases comparando o áudio conjunto com o do bloco A.
- Vídeo bruto: manter por enquanto. A trilha de pontos (trilha-0.1) guarda movimento, não aparência. Tatuagem, barba, cabelo e pele só saem das imagens, e os modelos de aparência ainda vão melhorar, então reprocessar exige o bruto. Regra vigente já é não apagar nada nos testes. Rever a retenção quando o avatar com a aparência estiver aprovado.
- Celular com câmera traseira é o caminho certo para a aparência. A orientação ao vivo usa o mesmo extrator da sessão A (MediaPipe no navegador), rodando no próprio celular.
- Roupa trocável exige separar corpo e roupa na captação (uma tomada com roupa justa e lisa para o corpo). Entra no roteiro da sessão B.

## Pendente
- Robô do Blender: próximas iterações de fidelidade (painéis do peito e dos membros, rosto, mãos) e ligar ombros, cotovelos e punhos aos gestos.
- Construção: semana 1 do plano do mês 1 e funções do mapa de cobertura (PROMPT-1.17).
- Teste de 10 frases no modo selfie comparando o áudio com o bloco A.
- Licenças dos modelos de voz antes de escolher a voz final. Eco ou fone como requisito antes de ligar a interrupção.
- Preview novo para ver o robô e testar no celular: depende de aceite (plano gratuito da Vercel, 1 build de cerca de 40 s).
- Placa de vídeo do notebook (opcional, só define onde treinar sem custo).
- FULL_BODY_CAPTURE_PROPOSAL.md: não anexado até aqui.
- Pendências do HANDOFF-1.15 seguem valendo.
