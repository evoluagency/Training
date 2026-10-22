# EVOLU Training — Implementação baseada nas sete referências R01–R07

**Referência contratual:** EVOLU_TRAINING_ESTRUTURA_VISUAL_FUNCIONAL_V1.md (arquivo fornecido pelo proprietário).
**Branch:** `feat/training-lesson-linked-tools-20261021`. **Produção:** inalterada; PR Draft.

## Entregas no código

| Referência | Endereço | Arquivo | Estado |
|---|---|---|---|
| R01 Home | `/` | `app/page.tsx`, `app/home-reference.css` | Estrutura e conteúdo dinâmico implementados |
| R02 Login | `/acesso` | `app/acesso/page.tsx`, `app/acesso/access.css` | Tela própria, login via ChatGPT Sites |
| R03 Área do aluno | `/area` | `app/visual-portal.tsx`, `app/portal.css` | Grid de 3 cards + 3 painéis, progresso real |
| R04 Aula | `/area/treinamentos/:id/aulas/:lessonId` | `app/visual-portal.tsx` | 3 colunas, vídeo, materiais por aula, notas privadas |
| R05 Administração | `/admin` | `app/visual-portal.tsx` | 4 KPIs reais, cursos, pendências; série temporal depende de dados |
| R06 Empresa e vagas | `/admin/empresas/nova` | `app/visual-portal.tsx` | CNPJ, contatos, vagas, turmas/treinamentos |
| R07 Editor | `/admin/treinamentos/:id/estrutura` | `app/visual-portal.tsx` | Módulos/aulas/ferramentas em 3 colunas |

Outras rotas: `/entrada` identifica o papel com `/api/training/me` e encaminha para `/admin` ou `/area`. `/area/classico` conserva as funções existentes de prova, comentários, NPS e certificado enquanto o visual correspondente é integrado.

## Proteções mantidas

- API exige identidade do host. Autorização não deriva apenas de WhatsApp, CNPJ, e-mail ou item público da vitrine.
- Os treinamentos exibidos na vitrine permanecem limitados a cursos publicados com `show_on_home=1`.
- Recursos vinculados a aulas exigem curso liberado à empresa; downloads verificam o destinatário e a revogação de acesso.
- Anotações privadas em `lesson_notes` dependem de membro autorizado e da aula em curso liberado.
- CNPJ com checksum, unicidade de empresa e limite de ocupação por vagas.
- A plataforma não registra números de desempenho inexistentes nem aplica uma linha de gráfico fictícia. Gráfico histórico de acessos permanece sem dados até existir instrumentação aprovada.

## Migrações incrementais sem modificar históricos

1. `0001_link_resources_to_lessons.sql`: vínculo opcional do recurso com aula.
2. `0002_public_course_showcase.sql`: opt-in da vitrine, padrão oculto.
3. `0003_company_profile.sql`: CNPJ único, responsável, e-mail e WhatsApp.
4. `0004_learner_notes.sql`: anotações privadas membro × aula.

As migrações foram adicionadas ao jornal e aos testes do repositório. **Não foram executadas em nenhum banco hospedado.**

## Arquivos de imagem — pendência explícita de integração

Os nove WebP reconstruídos estão no artefato entregue ao proprietário: `EVOLU_TRAINING_MIDIAS_PARA_REPOSITORIO.zip`.
Devem ser copiados à pasta `public/training-media/` do repositório antes de visualizar a fidelidade fotográfica. Os caminhos esperados estão em `public/training-media/README.md`. Apenas os logotipos oficiais já existem no GitHub.

Uma rota ou página com fotografias ainda não copiadas pode mostrar fundo escuro de fallback: **isso não constitui entrega visual concluída**.

## Testes e aceite

- Inspeção estática das rotas, componentes, validações e importações concluída, incluindo fechamento de delimitadores e tags JSX dos arquivos principais.
- Migrações 0003/0004 verificadas também em SQLite isolado quanto a integridade básica de dados e restrições.
- **Não houve** compilação completa TypeScript, build Next, execução real de Node/Miniflare, migração D1 hospedada, upload para R2, comparação por screenshot 1440/1024/390 ou teste autenticado no site.
- O PR permanece Draft; não houve merge/deploy.
- **Nenhum** GitHub Action, Job ou Workflow foi iniciado. Nenhum serviço pago foi provisionado.

O aceite só pode ser dado após colocar as imagens no repositório, executar testes em ambiente local isolado e comparar cada uma das sete telas com as referências.
