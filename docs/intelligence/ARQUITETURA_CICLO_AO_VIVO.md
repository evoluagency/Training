# Arquitetura do ciclo ao vivo do avatar (rascunho 0.1)

Data: 14/11/2026. Sessão 1.16. Cópia de trabalho no Training porque a escrita no repositório intelligence segue negada. Quando houver escrita, este documento vai para lá.

Valores de custo e de latência abaixo são ordens de grandeza para comparar caminhos. Nenhum foi contratado nem medido aqui. Conferir o preço vigente antes de qualquer aceite.

## 1. Objetivo

Conversa de verdade com o avatar do capacitador:

- resposta começando em 1 a 2 segundos depois que a pessoa para de falar
- interrupção nos dois sentidos (o aluno corta o avatar, e o avatar pode cortar o aluno quando fizer sentido)
- voz própria do capacitador
- avatar animado em tempo real (boca, expressões, gestos)
- motores trocáveis, para aproveitar a evolução dos modelos

## 2. O ciclo

```
microfone
  → OUVIR      detecção de voz + fala para texto em fluxo (parciais e final)
  → VEZ        decide fim de fala, interrupção e quando o avatar pode cortar
  → RESPONDER  Intelligence: conteúdo do capacitador + motor de prática, texto em fluxo
  → FALAR      voz própria em fluxo, frase a frase, com os tempos dos fonemas
  → ANIMAR     boca pelos fonemas, expressões (sessão selfie), gestos (sessão afastada)
alto-falante e tela
```

Cada caixa é um motor atrás de uma interface fixa. Trocar o motor não muda as outras caixas.

| Interface | Entrada | Saída | Motor de hoje (sem custo) |
|---|---|---|---|
| Ouvir | áudio do microfone | `ouvir.parcial`, `ouvir.final`, `voz.inicio`, `voz.fim` | reconhecimento do navegador. Alternativa local: Whisper em WASM ou WebGPU |
| Vez | eventos de voz + estado do avatar | `vez.fim`, `interrupcao.aluno`, `interrupcao.avatar` | regras em código (funções puras, testáveis) |
| Responder | texto do aluno + contexto da aula | `resposta.trecho` (texto em fluxo), `resposta.fim` | dublê determinístico do protótipo do Intelligence |
| Falar | frases | `fala.audio` (PCM) + `fala.fonemas` (fonema e tempo) | voz neural no navegador (piper), já na sala |
| Animar | fonemas, deixas de expressão e gesto | quadros do avatar | robô EVOLU Design No-1 (three) |

Os eventos são objetos JSON pequenos com carimbo de tempo. Com isso dá para medir a latência de cada etapa e gravar uma conversa para reproduzir em teste.

## 3. Orçamento de latência (meta: primeiro som em até 1,5 s)

| Etapa | Faixa esperada | Como reduzir |
|---|---|---|
| Perceber o fim da fala | 300 a 600 ms | silêncio curto somado a sinal do texto (frase completa, pergunta) |
| Texto final da fala | 100 a 300 ms | usar as parciais, não esperar o final para começar a pensar |
| Primeira frase da resposta | 300 a 700 ms | modelo rápido, resposta em fluxo, primeira frase curta |
| Primeiro som da voz | 150 a 400 ms | sintetizar frase a frase (a sala já faz), abertura curta |
| **Total** | **0,9 a 2,0 s** | |

Recursos extras: começar a preparar a resposta com a parcial e descartar se a pessoa continuar, e usar sinais de escuta ("certo", aceno de cabeça) enquanto a resposta chega.

## 4. Interrupção

**Aluno corta o avatar.** O detector de voz continua ligado enquanto o avatar fala. Ao detectar fala real por mais de uns 200 ms: parar o áudio, cancelar a resposta e a síntese em curso, registrar no histórico só o que foi dito de fato, e voltar a ouvir. Meta: silêncio em até 300 ms. Hoje a sala não escuta enquanto o avatar fala, então isso é trabalho novo. Exige cancelamento de eco, senão o avatar se interrompe com a própria voz.

**Avatar corta o aluno.** Regra conservadora, sempre começando por um sinal curto antes de tomar a palavra. Casos previstos: o aluno saiu do assunto por muito tempo, o tempo do exercício acabou, ou o motor de prática detectou um erro que vale corrigir na hora. Cada caso é uma regra explícita, desligável por aula.

## 5. Cadeia separada ou modelo de fala para fala

| Critério | Cadeia separada (ouvir, responder, falar) | Modelo de fala para fala |
|---|---|---|
| Latência | 1 a 2 s | 0,3 a 0,8 s |
| Troca de turno e interrupção | precisa ser construída (seção 4) | já vem pronta e natural |
| Voz própria do capacitador | sim, a voz é uma peça separada | em geral não. Usam vozes prontas do fornecedor |
| Controle do conteúdo | total. O texto passa pelo Intelligence, pelo motor de prática e fica auditável | menor. O modelo responde direto do áudio |
| Custo por minuto de conversa | de zero (tudo local) a alguns centavos de dólar com serviços pagos | em geral de alguns centavos a algumas dezenas de centavos de dólar |
| Troca de motor | cada peça troca sozinha | troca tudo de uma vez |

**Recomendação: cadeia separada.** A voz própria e o controle do conteúdo são o produto. A latência cabe na meta de 1 a 2 s. A interface "Ouvir + Vez" fica desenhada de modo que um modelo de fala para fala possa entrar no lugar no futuro, se passar a aceitar voz própria.

Referência de mercado para avatar ao vivo pronto, pela pesquisa de 14/11 (fontes divergentes, conferir): Tavus em torno de US$ 0,37 por minuto de conversa, HeyGen LiveAvatar em torno de US$ 0,10 a 0,20. Uma aula de 30 minutos custaria de US$ 3 a 11 por aluno. Isso confirma a decisão de desenhar o avatar no navegador do aluno.

## 6. Duas camadas do mesmo produto

**(a) Demonstração do lançamento, no palco.** Uma máquina controlada com placa de vídeo forte. Tudo o que der roda local: fala para texto, voz própria treinada com as 600 frases, e o avatar com a aparência do proprietário. O modelo de respostas pode ser local ou pelo conector, com aceite. Riscos do palco a tratar no ensaio: o som do palco entrando no microfone (usar microfone de cabeça e cancelamento de eco), internet instável (ter tudo local ou um roteiro de reserva) e uma conversa de reserva gravada.

**(b) Versão dos alunos, no navegador.** Detecção de voz, voz e avatar rodam no aparelho do aluno, sem custo de servidor por aluno. O único custo por uso é o modelo de respostas. Começa pela franquia gratuita do conector da Vercel e só passa disso com aceite e estimativa.

As duas camadas usam as mesmas interfaces. A diferença é só qual motor está ligado em cada caixa.

## 7. Animação do avatar

- **Boca:** pelos fonemas e tempos que a voz entrega. Hoje a sala usa o volume do áudio e a vogal da palavra. O passo seguinte é mapear fonema para formato de boca. Volume segue como reserva.
- **Expressões:** a sessão selfie gera uma biblioteca de trechos de expressão (os 52 coeficientes do rosto) com etiqueta. A resposta traz deixas simples (por exemplo: sorrir, dúvida, ênfase) e o avatar toca o trecho correspondente por cima da fala.
- **Gestos:** a sessão afastada gera uma biblioteca de gestos de aula (apontar, enumerar, abrir as mãos). Mesmo mecanismo de deixas.
- **Repouso:** respiração, piscar e olhar, como o robô já faz.

## 8. Pendências que mudam o desenho

1. **Placa de vídeo da máquina da demonstração.** Sem essa informação não dá para dizer se o avatar realista roda nela. Alternativa: máquina emprestada no dia, ou exceção de AWS com aceite.
2. **Licenças dos modelos de voz.** Vários modelos de clonagem de voz têm licença não comercial. As já apontadas (piper e espeak-ng em GPL-3) seguem em revisão. Escolher a voz final só depois dessa conferência.
3. **Eco.** Definir fone ou cancelamento de eco como requisito da sala antes de ligar a interrupção.

## 9. Plano do mês 1 (local, sem custo)

Meta: ciclo ao vivo de ponta a ponta com o robô, validado em localhost.

| Semana | Entrega | Como validar |
|---|---|---|
| 1 | Interfaces e eventos do ciclo. Máquina de estados da vez (funções puras). Detector de voz no navegador. Aluno corta o avatar | testes de unidade da máquina de estados. Navegador sem tela com áudio falso |
| 2 | Resposta em fluxo vinda do protótipo do Intelligence (dublê), frase a frase, ligada à voz que já existe. Painel de latência por etapa | medir primeiro som com o dublê. Meta: mediana até 2 s |
| 3 | Boca pelos fonemas. Deixas de expressão e gesto no robô (os braços já existem). Regras de o avatar cortar o aluno | testes das regras. Conferência visual em captura |
| 4 | Teste de ponta a ponta automatizado com conversa gravada. Roteiro de ensaio da demonstração. Decisão sobre motores pagos, se houver, com estimativa | relatório de latência. Interrupção parando em até 300 ms |

Critérios de saída: custo zero, tsc limpo, lint sem erro novo, testes antigos e novos passando, e os dois números acima medidos.

O que fica para depois do mês 1: avatar com a aparência do proprietário, voz própria treinada, publicação.

## Fontes da pesquisa de 14/11/2026

- [HeyGen: instant avatar](https://www.heygen.com/tool/instant-avatar-maker)
- [Tavus: comparação de preços](https://www.tavus.io/post/heygen-pricing-breakdown-best-alternatives)
- [Sitepal: tabela de preços de avatares ao vivo](https://www.sitepal.com/blog/?cat=19)
- [gsplat-talkinghead: avatar por gaussian splatting no navegador](https://radiancefields.com/gsplat-talkinghead-brings-lip-synced-gaussian-splat-avatars-to-ai-voice-agents)
- [WebSplatter: gaussian splatting no navegador com WebGPU](https://arxiv.org/html/2602.03207)
- [CVPR 2026: avatares de alta fidelidade em celular](https://openaccess.thecvf.com/content/CVPR2026/papers/Zhan_High-Fidelity_Mobile_Avatars_with_Pruned_Local_Blendshapes_CVPR_2026_paper.pdf)
