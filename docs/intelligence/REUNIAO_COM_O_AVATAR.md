# Reunião com o avatar (EVOLU Intelligence) no Training

Tela do Intelligence dentro do Training, com a identidade visual do Training, no formato de reunião virtual. A lógica do avatar continua no repositório `evoluagency/intelligence` (somente backend). O Training só mostra a tela e repassa as chamadas.

## Onde aparece

| Modo | Rota | Quem acessa | Saída |
|---|---|---|---|
| Aula | `/area/treinamentos/:id/aulas/:aulaId` (R04), botão **Entrar na sala** abaixo do player | participante autenticado | respostas por voz e chat |
| Entrevista | `/admin/entrevista-avatar` | só administração | rascunho (DRAFT) para download |

A sala abre em **tela cheia**, por cima da página, no formato das videochamadas: sala de espera clara (prévia da câmera com botões de microfone e câmera, "Pronto para participar?"), sala escura com o avatar em destaque, o quadro do usuário flutuando, legenda ao vivo, barra inferior com botões redondos e painel lateral de mensagens ou roteiro. Sair mostra a tela de saída e volta à aula (ou ao painel).

## Ligação Training → Intelligence

- O navegador só chama `/api/intelligence/*` (lista fechada em `lib/intelligence/gateway.ts`).
- A rota confere a origem, a sessão e o papel (`training-api /me`). Entrevista exige `admin`.
- O repasse vai para `INTELLIGENCE_AVATAR_URL` (variável **só de servidor**). Sem ela, a tela mostra "O avatar não está disponível agora" (503).
- Nenhuma chave de modelo passa pelo Training nem vai ao navegador. O modelo é chamado pelo Intelligence.
- Corpo limitado a 8 KB, só JSON, erros do serviço viram código curto sem detalhe interno.

## Mídia e privacidade (padrões adotados)

- **Câmera do participante (decisão do proprietário, 11/11):** opcional e real. Ligar exige aceitar a *Política de imagem da aula online* (`CAMERA_POLICY` em `meeting-text.ts`, versão `rascunho-0.1`, a revisar). Com a câmera ligada, a EVOLU pode ver e registrar a imagem e o comportamento visual. A sala mostra "Câmera ligada · política aceita".
- **Ainda não há envio:** o destino das imagens (armazenamento, formato, retenção, quem acessa) depende de decisão do proprietário. Até lá a imagem aparece só na tela do participante e o texto da política diz isso.
- O botão Gravar (arquivo local) continua só na entrevista.
- Entrevista: gravar é opcional, pede aceite explícito, mostra **Gravando** o tempo todo e salva o arquivo só no computador do capacitador.
- Avatar ilustrado neutro (sem foto) e voz do navegador até haver consentimento de imagem e voz.
- Reconhecimento de voz do navegador com aviso (no Chrome o áudio vai para o Google). O chat funciona sempre.

## Prévia local (sem login, dados fictícios)

```sh
# terminal 1, no repositório intelligence: backend com dublê (custo zero, sem rede)
node prototype/avatar/server.mjs --port 4173
# terminal 2, aqui
INTELLIGENCE_LOCAL_PREVIEW=1 INTELLIGENCE_AVATAR_URL=http://127.0.0.1:4173 pnpm dev
# http://localhost:3000/intelligence/previa             (aula na R04)
# http://localhost:3000/intelligence/previa?modo=entrevista
```

A prévia responde 404 em produção, mesmo com a variável. Em desenvolvimento, sem `INTELLIGENCE_LOCAL_PREVIEW=1`, a API exige login como no resto do portal.

## Arquivos

- `app/intelligence/meeting.tsx`, `meeting.css`, `meeting-text.ts`, `avatar.tsx`, `lesson-slot.tsx`
- `app/intelligence/previa/` (só local)
- `app/api/intelligence/[...path]/route.ts`, `lib/intelligence/gateway.ts`
- `tests/intelligence.test.ts`

## Pendências antes de publicar

- Hospedar o serviço do Intelligence e definir `INTELLIGENCE_AVATAR_URL` (exige autorização de deploy).
- O avatar usa a aula piloto do Intelligence, não o conteúdo da aula aberta no Training.
- O backend de protótipo guarda estado em memória e é de um usuário por vez.
