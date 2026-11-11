# Reunião com o avatar (EVOLU Intelligence) no Training

Tela do Intelligence dentro do Training, com a identidade visual do Training, no formato de reunião virtual. A lógica do avatar continua no repositório `evoluagency/intelligence` (somente backend). O Training só mostra a tela e repassa as chamadas.

## Onde aparece

| Modo | Rota | Quem acessa | Saída |
|---|---|---|---|
| Aula | `/area/treinamentos/:id/aulas/:aulaId` (R04), botão **Entrar na sala** abaixo do player | participante autenticado | respostas por voz e chat |
| Entrevista | `/admin/entrevista-avatar` | só administração | rascunho (DRAFT) para download |

Na R04 a reunião ocupa o lugar do player, no centro. O chat e o roteiro ficam na lateral da reunião (abaixo dela quando falta largura). Sair devolve o player.

## Ligação Training → Intelligence

- O navegador só chama `/api/intelligence/*` (lista fechada em `lib/intelligence/gateway.ts`).
- A rota confere a origem, a sessão e o papel (`training-api /me`). Entrevista exige `admin`.
- O repasse vai para `INTELLIGENCE_AVATAR_URL` (variável **só de servidor**). Sem ela, a tela mostra "O avatar não está disponível agora" (503).
- Nenhuma chave de modelo passa pelo Training nem vai ao navegador. O modelo é chamado pelo Intelligence.
- Corpo limitado a 8 KB, só JSON, erros do serviço viram código curto sem detalhe interno.

## Mídia e privacidade (padrões adotados)

- Câmera do usuário só local. Nenhuma imagem vai ao servidor.
- O participante nunca é gravado (o botão Gravar não existe no modo aula).
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
