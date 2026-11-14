# HANDOFF 1.15 — Sessão A de captação: publicação, e-mail próprio e virada para o avatar ao vivo

Datas: 12 a 14/11/2026. Prevalece sobre o HANDOFF-1.14.

## Estado dos repositórios e serviços
- Training, branch feat/intelligence-avatar-meeting: sem commit novo nesta sessão (8d301ca). vercel.json mantém git.deploymentEnabled falso para a branch.
- Intelligence: add_repo com push negado de novo (12/11), leitura liberada (branch docs/digital-instructor-architecture-v0-1 em 1905183). Documentos 1.12 a 1.15, PROMPT-1.13 a 1.16, FULL_BODY_CAPTURE_PROPOSAL.md e proposal-20261112-motion-capture.sql continuam com o proprietário. Commitar quando houver escrita, com [skip ci].
- Supabase Training (ljuqbkwsnouthzwrzszy): training-api v10 ativa.
- Vercel (equipe EVOLU, projeto training): Preview dpl_4ETpwiodxHJPed7N92bNYYNiZNos do 8d301ca, endereço training-git-feat-intelligence-avatar-meeting-evolu.vercel.app.
- Ambiente "EVOLU Intelligence": segredo de rede para api.supabase.com (token pessoal do proprietário, nunca visto pelo agente). Revogar no painel do Supabase quando não for mais publicar.

## Feito
1. Validação local no 8d301ca: tsc limpo, lint com os mesmos 76 erros antigos, testes 80 de 80.
2. training-api v10 publicada (aceite do proprietário, plano gratuito do Supabase, 1 publicação, sem custo). Mesmos caminhos da v9 mais lib/intelligence/expression-script-ids.ts e motion-track.ts, verify_jwt falso como na v9. Enviada pela API de gerenciamento com os bytes exatos do commit. Conferência depois: os 11 arquivos publicados iguais ao 8d301ca. Fumaça: health 200, public-catalog 200, capture-session-progress 401 sem login.
3. Preview publicado (aceite em 13/11, plano gratuito da Vercel, 1 build de 40 s, READY). Log: "mediapipe: WASM 1.2.2 e modelo conferidos." O container do agente não alcança o host do Preview (proxy recusa), conferência pelo log.
4. Voz (só contagem no banco): 200 frases do bloco A (201 itens, 15,7 min, 48 kHz) e 5 testes de sala. O proprietário segue gravando no mesmo local. Faltam 400 (B 250, C 60, D 40, E 30, F 20). Mínimo recomendado: B, C e E.
5. E-mail próprio sem custo: Zoho Mail (Forever Free) em evolu.ink, DNS na Vercel. Registros: TXT zoho-verification, MX mx.zoho.com 10, mx2 20, mx3 50, SPF "v=spf1 include:zohomail.com ~all", DKIM zmail._domainkey, DMARC "_dmarc v=DMARC1; p=none". Antigo MX do Google renomeado para google-antigo.evolu.ink (a conexão não apaga registro, pode ser apagado no painel). Google Workspace apagado pelo proprietário. Envio e recebimento normais, confirmado pelo proprietário em 14/11.
6. AWS Activate: tela 1 orientada (empresas, desenvolvimento inicial, navegador, IA central, autofinanciado, menos de 25% na AWS). Descrição pronta em PT e EN (até 250 caracteres). Envio é do proprietário, com e-mail @evolu.ink e site training.evolu.ink. Avisos dados: nível Founders costuma ser US$ 1.000, créditos com validade.
7. Roteiro de expressões: cópia legível em Training/.conferencia/roteiro-expressoes-0.1.md (fora do git, em .git/info/exclude).

## Decisões do proprietário (14/11/2026)
- Primeiro piloto: avatar da cintura para cima (rosto, tronco, braços e mãos). A sessão B passa a ser só tronco, braços e mãos.
- O piloto é o avatar AO VIVO, em tempo real. Vídeo pronto por IA não é o mercado alvo ("eu quero o próximo").
- Objetivo de lançamento: o proprietário apresenta o produto ao vivo conversando com a própria versão de IA, no palco. O mais realista possível.
- Conversa de verdade: resposta começando em 1 a 2 s, interrupção nos dois sentidos (o aluno interrompe o avatar e o avatar pode interromper o aluno quando fizer sentido).
- O modelo de IA das respostas pode ser trocado para o que melhor fizer isso.
- Lançar o quanto antes, sem esperar 1 ano. O piloto forma a base de potenciais clientes.
- Ideia futura registrada: curso de IA para negócios (o proprietário cursa faculdade de IA para negócios).

## Recomendações do agente (para a 1.16 confirmar)
- Duas camadas do mesmo produto: (a) a demonstração do lançamento roda numa máquina controlada com GPU forte, permitindo o máximo de realismo, (b) a versão dos alunos roda o avatar no navegador, sem custo de servidor por aluno.
- Ciclo ao vivo: ouvir (fala para texto, com detecção de fim de fala e de interrupção) → responder (conteúdo do capacitador e motor de prática do Intelligence) → falar (voz própria em fluxo, começando antes de a resposta terminar) → animar (expressões da sessão A, gestos da sessão B, boca pelos fonemas da voz).
- Avaliar modelos de fala para fala com turnos naturais contra a cadeia separada (que mantém a voz própria). Decidir na 1.16 com estimativa de custo.
- Motores de voz, resposta e avatar trocáveis, para aproveitar a evolução da IA.
- Calendário sugerido: mês 1 ciclo ao vivo de ponta a ponta com avatar simples, meses 2 e 3 avatar com a aparência do proprietário e o lançamento, meses 4 a 6 pilotos com clientes.

## Pendente
- Placa de vídeo do computador do proprietário (modelo e memória). Define onde treinar voz e avatar sem custo.
- Custo recorrente do modelo de respostas: começar pela franquia gratuita do conector da Vercel e pedir aceite com estimativa antes de passar disso.
- AWS: conferir no painel (Billing, Credits) a validade dos US$ 100 e da conta gratuita. Decidir se abre exceção à regra "sem AWS até a venda" só para treino em GPU. Cota de GPU de conta nova costuma ser zero.
- FULL_BODY_CAPTURE_PROPOSAL.md: anexar. Conferir roteiro-expressoes-0.1 e trilha-0.1 (§2, §5, §6, §9, §10) e adaptar a proposta para cintura para cima e ao vivo.
- Teste curto da sessão A no Preview com login real (termo, câmera, passos, trechos, arquivo do celular).
- Revisões abertas: timbre, políticas rascunho-0.1, captacao-rascunho-0.1, voz-rascunho-0.1, imagem-rascunho-0.1 (advogado), licenças GPL-3 (espeak-ng, piper-tts), num2words LGPL, voz faber derivada da lessac, roteiro de voz (masculino genérico).
