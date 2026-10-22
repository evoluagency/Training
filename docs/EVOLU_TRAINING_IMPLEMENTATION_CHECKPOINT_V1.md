# EVOLU Training — Implementação baseada nas sete referências R01–R07

> Registro histórico. A integração das nove imagens selecionadas e a execução local de TypeScript, build, testes e inspeção das telas foram concluídas posteriormente em 22/10/2026. O [relatório de integração visual](qa/INTEGRACAO_VISUAL_2026-10-22.md) é o estado atual dessas verificações. As limitações de autenticação e implantação hospedadas continuam em aberto.

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

## Continuação — 22/10/2026

### Implementações complementares

- Cadastro empresarial detalhado agora pode ser editado. Ao alterar vagas, o `UPDATE` em SQLite inclui condição de ocupação ativa no próprio comando, evitando redução de capacidade em corrida com novas reservas.
- Lista de participantes permite suspender ou reativar, pelo endpoint protegido com checagem de vagas.
- Gestor corporativo tem rota `/area/relatorios`, ligada à consulta já restrita à empresa pelo backend.
- Administração oferece `/admin/provas` (visão dos treinamentos e regras), `/admin/certificados` (registros emitidos), `/admin/comentarios` (resumo de até 200 mensagens e resposta por empresa/curso) e `/admin/configuracoes` (governança em leitura).
- Endpoint `GET /api/training/comments-summary` só atende administradores. As respostas usam o serviço de comentários com autorização de curso e empresa; não expõem outras organizações.
- Nova tela `/area/ajuda` explica acesso, materiais, avaliações e canal de comentários. Rota `/admin/treinamentos/novo` mostra o assistente de criação.
- Links legados `/area?course=:id` preservam o identificador validado do curso após autenticação.
- Publicação de curso exige confirmação explícita no navegador.
- Testes de regressão adicionados para capacidade/ocupação, resumo administrativo de comentários, isolamento de anotações e opt-in de cursos na vitrine.

### Mídias — preparadas, não incorporadas ao GitHub

- O pacote `EVOLU_TRAINING_MIDIAS_PARA_REPOSITORIO.zip` contém **9 arquivos WebP** com resolução conferida.
- `public/training-media/manifesto.json` guarda tamanho e SHA-256 dos nove arquivos; `node scripts/verify-training-media.mjs` verifica integridade local após a cópia.
- Foi gerado e testado fora do repositório um patch binário Git (`EVOLU_Training_9_Midias_git_binary.patch`). A aplicação em uma pasta Git isolada restaurou 9/9 imagens, com hashes íntegros. **Esse patch ainda precisa ser aplicado à branch por ambiente com acesso de escrita a arquivos binários.** Não houve push de imagens, merge ou deploy.

### Evidências e limites de QA

- Verificações de código feitas via inspeção remota do GitHub (rotas, referências, autorização, fechamento de delimitadores e contagem de tags JSX), em vez de compilação.
- Validação local do pacote e do patch binário: **9/9 arquivos íntegros**. Isso **não** confirma renderização no navegador nem disponibilidade em produção.
- Tipagem TS, testes Node, Miniflare/D1/R2, screenshots 1440/1024/390 e autenticação no host continuam **pendentes**.
- O PR continua Draft, sem alteração na branch principal, sem Actions/Jobs/Workflows ou custos de implantação.

### Gates para aceitar R01–R07

1. Aplicar o patch binário das nove imagens na branch com acesso autorizado; executar `node scripts/verify-training-media.mjs` localmente.
2. Executar `pnpm check`, `pnpm test` e build em ambiente previamente qualificado e sem custo incremental, com consentimento para execução.
3. Comparar as sete páginas com as imagens golden references e corrigir eventuais diferenças visuais (não foram renderizadas nesta etapa).
4. Validar privacidade de empresas, login ChatGPT e restrição de visibilidade da vitrine no domínio real.
5. Obter aceite formal antes de qualquer publicação em produção.

## Revisão de integração e fluxos — 22/10/2026 (continuação)

1. **Login e deep links:** as páginas de catch-all da administração e de aprendizagem preservam o destino validado no login via ChatGPT Sites. O fluxo legado de prova/certificado preserva o parâmetro `course` validado. Retornos são relativos e os segmentos são validados (somente alfanuméricos e hífen).
2. **Consistência de curso:** o componente de aula ignora respostas HTTP antigas após mudança de curso, limpa os dados ao trocar de rota e só apresenta o conteúdo quando `detail.course.id` coincide com o curso da URL. As anotações são carregadas somente para o curso e a aula ativos.
3. **Painel administrativo real:** novo endpoint `GET /api/training/activity` protegido por `admin()`, com sete dias UTC. Conta exclusivamente eventos já persistidos (aulas concluídas, provas enviadas e certificados emitidos). A UI mostra sete barras e até oito eventos recentes, com estado de falha distinto de atividade igual a zero. Não é um gráfico de acessos/visitantes.
4. **Testes acrescentados:** acesso administrativo ao endpoint, série contínua de sete dias, estado inicial sem eventos e contagem após conclusão real de aula.
5. **Validação SQL isolada:** as duas consultas de atividade foram executadas em SQLite de memória com tabelas equivalentes e eventos de teste; o agrupamento diário e a lista recente produziram resultados válidos.
6. **Mídias:** o patch local `EVOLU_Training_9_Midias_git_binary.patch` foi aplicado novamente em um Git temporário isolado; **9/9** WebP passaram em comparação SHA-256 com o ZIP original. Arquivos ainda não enviados ao GitHub.
7. **Limitação fundamental:** o ambiente disponível não tem o projeto completo com `node_modules`, e o acesso de rede do runtime à origem GitHub falhou. Portanto compilação TS/Next, testes integrados, banco D1/R2 hospedado e inspeção visual autenticada continuam pendentes, sem alegações de execução.

**Regra de preservação:** branch Draft, `main` e produção intocadas. Nenhum workflow, GitHub Action, deploy, migração hospedada ou recurso pago disparado.
