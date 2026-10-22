# EVOLU TRAINING — Especificação visual, funcional e estrutural

**Documento de referência para reprodução fiel das telas aprovadas**  
**Versão:** 1.0 · **Referência:** 21/10/2026 · **Produto:** EVOLU Training  
**Escopo:** site institucional, autenticação, ambiente do participante, administração e autoria de treinamentos.  
**Status:** especificação de implementação; **não** representa comprovação de publicação, testes completos ou aceitação da versão hospedada.

> **Regra central:** as sete imagens de prévia aprovadas são o **contrato visual** do EVOLU Training. A implementação deve reproduzir sua composição, hierarquia, navegação, densidade de informação, cores, tipografia, cards e distribuição dos elementos. Não redesenhar a interface como um template genérico de LMS, não trocar o design por componentes de terceiros e não representar como funções existentes o que ainda precisa ser desenvolvido. Em telas não ilustradas, derivar rigorosamente o mesmo sistema de design.

---

## 1. Referências visuais obrigatórias

A pasta `referencias/` do pacote acompanha este documento; essas imagens servem como **golden references** (comparação visual) e não como fundos de tela nem arquivos a serem colocados dentro do navegador.

| Ref. | Arquivo na pasta `referencias/` | Tela a reproduzir | Rota de referência |
|---|---|---|---|
| **R01** | `01_home_publica.png` | Home pública: hero preto, executivo/cidade, áreas, cursos, método, chamada final e rodapé | `/` |
| **R02** | `02_login.png` | Login em duas colunas; retrato editorial à esquerda e painel branco à direita | `/acesso` ou autenticação da plataforma |
| **R03** | `03_dashboard_aluno.png` | Dashboard do participante com sidebar preta, indicador circular, cursos, atividades e ferramentas | `/area` |
| **R04** | `04_aula_power_bi.png` | Player/aula: sidebar do curso, conteúdo no centro e índice/ferramentas na direita | `/area/treinamentos/:id/aulas/:aulaId` |
| **R05** | `05_dashboard_admin.png` | Painel administrativo: KPIs, gráfico de atividades, ações recentes, cursos e alertas | `/admin` |
| **R06** | `06_empresa_vagas.png` | Cadastro de empresa, vagas, módulos/treinamentos contratados, participante e acesso | `/admin/empresas/nova` |
| **R07** | `07_editor_modulos_aulas.png` | Editor de um treinamento, com módulos, aulas e ferramentas na mesma tela | `/admin/treinamentos/:id/estrutura` |

**Fidelidade:** utilizar as referências **R01–R07** como padrão prioritário quando houver conflito com telas ou estilos de código antigos. O objetivo é reproduzir a interface, **não** inserir as próprias capturas como imagens de fundo. A barra do navegador, eventuais domínios ilustrativos, pessoas, cursos e estatísticas mostradas nos mockups **não pertencem ao layout implementável**.

### 1.1 Hierarquia de autoridade visual

1. **Logotipo original da EVOLU** fornecido pelo proprietário (versões preta e branca); jamais substituir por texto estilizado, símbolo gerado ou reconstrução da marca.
2. **Sete previews R01–R07**, quanto à estrutura da interface, proporcionalidade, espaçamento e aparência.
3. **Peças reconstruídas** na pasta `midia/` do pacote, como arquivos de conteúdo visual a utilizar onde os previews colocam imagens.
4. **Design tokens** e regras escritos neste documento, para todas as páginas e estados não exibidos nos previews.

### 1.2 Decisões fechadas

- Marca exibida: **EVOLU**, com o identificador de produto **TRAINING** em tipografia separada; não inserir “.ink” nem “Agency” como parte do logotipo.
- Fonte padrão: **Montserrat**, inclusive títulos, campos, navegação, cabeçalhos, botões e tabelas.
- Idioma principal: português brasileiro.
- Estética: corporativa/editorial, alto contraste preto × branco/off-white, cinzas, verde-limão controlado, fotografias profissionais e visuais analíticos.
- Conteúdo dos cards **dinâmico**, nunca simulado por números fictícios em produção.
- Administração e aluno compartilham identidade visual, mas têm menus, funcionalidades e permissões diferentes.
- **Ferramentas pertencem a uma aula** quando forem conteúdo daquele módulo; a aba geral Ferramentas é biblioteca e acesso rápido, não substitui o vínculo pedagógico.
- A empresa controla as vagas e as autorizações; o catálogo público **não** é um sistema de matrícula aberta.
- A autenticação por ChatGPT deve ocorrer pelo **mecanismo real suportado pelo host**, sem imitação de login, coleta de senha ChatGPT ou interface de conversa.

---

## 2. Design system — reprodução do visual

### 2.1 Cores e papéis

| Token | Valor de referência | Uso obrigatório |
|---|---|---|
| `--ev-black` | `#090B0C` | Sidebar, cabeçalho público, áreas de destaque, fundos de cards editoriais |
| `--ev-black-2` | `#131719` | Painéis pretos secundários e sobreposição fotográfica |
| `--ev-paper` | `#F5F5F2` | Fundo dos ambientes internos |
| `--ev-white` | `#FFFFFF` | Superfície de cards, campos, painéis e tela de login |
| `--ev-lime` | `#D8FC63` | Ação primária, item de menu selecionado, pontos de dados, status e pequenos acentos |
| `--ev-ink` | `#151819` | Texto principal sobre superfícies claras |
| `--ev-muted` | `#6F746F` | Subtítulos, dados secundários e legendas |
| `--ev-line` | `#E3E5E0` | Separadores, contornos leves de cartões e inputs |
| `--ev-line-dark` | `#343A39` | Separadores e bordas sobre preto |
| `--ev-success-bg` | `#E8F9CD` | Indicador de item concluído/publicado em fundo claro |
| `--ev-warning-bg` | `#F5F3EB` | Estado pendente, nunca substituir por verde automaticamente |

**Não usar** gradientes multicoloridos, tons azul/púrpura característicos de dashboards genéricos, sombras flutuantes pesadas ou cantos excessivamente arredondados. O verde-limão é **acento**, não fundo da interface inteira.

### 2.2 Tipografia

- Fonte: Montserrat, pesos **300, 400, 500, 600, 700**.
- Hero público: 52–68 px no desktop, peso 700, entrelinha 1,06–1,13; palavras-chave com verde-limão **conforme R01**.
- Título de tela (dashboard, editor): 32–42 px, peso 700, entrelinha 1,14–1,2.
- Título de seção: 21–28 px, peso 600/700.
- Título de card: 15–20 px, peso 600/700.
- Corpo: 13–15 px, peso 400/500, entrelinha ~1,5.
- Legenda: 11–12 px, peso 400/500.
- Marcador editorial: 10–11 px, peso 600/700, **caixa alta e tracking**.
- Indicadores numéricos: 26–36 px, peso 700, espaçamento numérico consistente (`font-variant-numeric: tabular-nums`).
- **Não renderizar** o lettering EVOLU com CSS ou fontes; ele é sempre um arquivo de imagem oficial com escala proporcional.

### 2.3 Layout, dimensões e ritmo

As medidas abaixo são parâmetros de CSS em **viewport desktop de aproximadamente 1440 px**, não posições absolutas de pixels dentro da captura:

| Região | Referência aproximada | Comportamento |
|---|---|---|
| Container geral interno | `max-width: 1680px` | Centralizar em telas muito grandes |
| Sidebar administrativa/aluno | **218–250 px** | Fixa no desktop; drawer no mobile |
| Topbar administrativa | **72–82 px** | Busca ampla à esquerda, sino/avatar à direita |
| Header institucional | **70–86 px** | Logotipo, navegação, login e CTA verde |
| Margem interna horizontal | **24–36 px** | Tablet ~20 px; mobile ~16 px |
| Gap entre grandes painéis | **16–22 px** | Painéis alinhados em grid |
| Padding dos cards | **16–26 px** | Respeitar densidade das capturas |
| Raio do card | **6–10 px** | Mais reto do que interfaces de aplicativo social |
| Borda do card | `1px solid var(--ev-line)` | Sombra extremamente discreta ou ausente |
| Altura de item de menu | **42–50 px** | Item ativo com verde-limão sólido |
| Foto de capa do curso | proporção **16:9** ou recorte adequado ao card | `object-fit: cover` sem distorção |
| Barras de progresso | **5–8 px** | Base cinza + preenchimento verde-limão |
| Indicador de progresso circular | **95–120 px** | Circular em dashboard, valor real no centro |

Navegação esquerda: fundo preto; ícones de traço branco, títulos claros, item ativo lime com texto/ícone pretos. Área de conteúdo: papel quase branco, cards brancos e textos pretos.

### 2.4 Fotografia, gráficos e texto sobre imagem

- Usar arquivos da pasta `midia/`; não usar as capturas de tela como fotografias finais.
- Aplicar `object-fit: cover` e ponto focal apropriado por imagem. Não distorcer ou preencher proporções com deformação.
- Legibilidade no hero e nas capas: overlay preto em gradiente **via CSS**, apenas quando o texto estiver sobre a fotografia.
- **Título, botão, legenda, selo, progresso, play, logo e ícones são HTML/CSS**, nunca texto incorporado ao JPG/WebP.
- O gráfico escuro abstrato é **decorativo**, não deve ser confundido com gráfico analítico real.
- Dados de desempenho, evolução e progresso exigem fonte real ou estado vazio; não incluir “+2.500 profissionais”, “98% de satisfação”, “12 empresas”, etc. sem prova.

---

## 3. Mapa geral da navegação

```text
EVOLU TRAINING
│
├── /                                   Página inicial institucional [R01]
│   ├── #areas                          Áreas de formação
│   ├── #treinamentos                   Cursos publicados e destacados
│   ├── #como-funciona                  Metodologia / etapas
│   └── Acessar plataforma              Fluxo de autenticação [R02]
│
├── /acesso                              Apresentação de autenticação [R02]
│   └── Entrar com ChatGPT              Identificação real do provedor
│
├── /area                                Painel do participante [R03]
│   ├── /area/treinamentos               Meus treinamentos
│   ├── /area/treinamentos/:id            Resumo do treinamento
│   ├── /area/treinamentos/:id/aulas/:aulaId  Aula [R04]
│   ├── /area/ferramentas                Biblioteca de recursos autorizados
│   ├── /area/certificados               Certificados e verificação
│   ├── /area/avaliacoes                 Avaliações e tentativas
│   ├── /area/comentarios                 Interação contextual
│   ├── /area/perfil                      Perfil, cargo e WhatsApp
│   └── /area/ajuda                       Ajuda e dúvidas
│
└── /admin                               Painel administrativo [R05]
    ├── /admin/empresas                  Lista de empresas
    │   ├── /admin/empresas/nova         Cadastro + vagas [R06]
    │   └── /admin/empresas/:id          Detalhes/vagas/liberações
    ├── /admin/participantes             Gestão de participantes
    ├── /admin/treinamentos              Catálogos e treinamentos
    │   ├── /admin/treinamentos/novo      Assistente de criação
    │   └── /admin/treinamentos/:id/estrutura  Módulos/aulas/ferramentas [R07]
    ├── /admin/ferramentas               Biblioteca, vínculos e permissões
    ├── /admin/provas                     Avaliações e banco de questões
    ├── /admin/certificados              Regras, modelos e emissões
    ├── /admin/comentarios                Moderação e respostas
    ├── /admin/relatorios                 Desempenho por empresa/curso
    └── /admin/configuracoes              Dados institucionais, identidade, perfis e integrações
```

**Rotas são nomes de referência de produto**, não prova de que cada endereço já existe no código. Na implementação atual, pode haver caminhos técnicos diferentes. A interface reproduzida deve oferecer essas jornadas sem links falsos.

### 3.1 Perfis de acesso

| Papel | Acesso | Limites |
|---|---|---|
| Administrador EVOLU | Gestão global, empresas, vagas, cursos, autoria, relatórios | Privilégios controlados, trilha de auditoria |
| Editor/instrutor EVOLU (quando habilitado) | Criar conteúdo e responder comentários de treinamentos atribuídos | Não alterar administração financeira/contas nem permissões globais |
| Responsável/gestor da empresa | Consultar sua empresa, suas vagas e progresso permitido | Nunca acessar outra empresa |
| Participante | Cursos atribuídos, aulas, arquivos, provas, comentários e certificados próprios | Nunca enxergar curso/empresa sem liberação |
| Visitante | Home e metadados de cursos expostos na vitrine, **se host permitir** | Não acessar conteúdos, vagas ou dados pessoais |

---

## 4. TELA R01 — Home pública: composição exata da prévia

**Referência:** `referencias/01_home_publica.png`. Interface institucional com alternância de seções preta/branca, fotografias monocromáticas, verde-limão e rodapé preto.

### 4.1 Header preto

- Faixa preta de ponta a ponta, 70–86 px de altura.
- À esquerda: **arquivo oficial EVOLU branco**, com `TRAINING` separado e pequeno.
- Centro: links `Treinamentos`, `Para empresas`, `Sobre`, `Contato` (conforme prévia mais recente; todos operacionais ou removidos até haver destino real).
- À direita: ícone de busca **somente se houver busca funcional**, `Entrar` e botão verde **Acessar plataforma →**.
- Header sticky opcional somente se não prejudicar o layout aprovado; a referência em primeiro scroll é a prioridade.

### 4.2 Hero institucional

- Fundo e alinhamento seguindo R01: lado esquerdo preto com grande título; lado direito **imagem reconstruída de executivo diante da cidade**.
- Bloco de texto, em três linhas: “Conhecimento / que impulsiona / **resultados.**”, última palavra verde-limão.
- Eyebrow discreta superior, como “CONHECIMENTO QUE GERA IMPACTO REAL”.
- Subtítulo empresarial curto e específico: áreas de estratégia, dados, operações e inteligência de negócios; não extrapolar resultados.
- Dois botões: primário lime `Explorar treinamentos →` e secundário escuro com borda `Soluções para empresas`.
- Faixa inferior com **indicadores reais** *quando houver evidência*; em caso contrário, substituir por 3–4 benefícios concretos (`Conteúdo estruturado`, `Ferramentas por aula`, `Gestão corporativa`, `Avaliações e certificados`) mantendo **exatamente o espaço e a distribuição** da linha de KPIs da imagem.
- Largura de texto no hero ~40–46% e imagem ~54–60%; gradiente escuro para preservar a leitura.

### 4.3 Seção branca “Áreas de formação”

- Cabeçalho editorial à esquerda com título em duas linhas e apresentação curta.
- Ao lado, **quatro cards em linha no desktop**; cada card possui uma foto horizontal na faixa superior, ícone de linha preto, título, descrição concisa e seta pequena.
- Áreas: **Estratégia e Negócios**, **Dados e Business Intelligence**, **Operações e Processos**, **Liderança e Pessoas**.
- Não tratar as quatro áreas como cursos efetivamente disponíveis. Os cards podem filtrar o catálogo, desde que a função esteja ativa.

### 4.4 Seção preta “Treinamentos em destaque”

- Fundo preto, título e descrição à esquerda, curso/capas fotográficas à direita.
- **Quatro cards em linha** na referência desktop, sem scroll horizontal escondido quando há espaço suficiente.
- Capa escurecida com categoria em selo verde-contornado, título branco, linha de carga horária/forma de oferta **se cadastrada**, botão circular de abertura.
- Conteúdos ilustrados em R01: Planejamento Estratégico, Business Intelligence com Power BI, Gestão de Processos e Liderança. **Exibir apenas cursos reais publicados e aprovados para vitrine**.
- Cards têm a mesma altura, imagem escura `cover`, texto alinhado ao rodapé do card e espaçamento constante.
- Caso nenhum curso esteja autorizado à vitrine: manter estrutura da seção com mensagem institucional de catálogo em preparação, **não inventar cursos**.

### 4.5 Seção branca “Como funciona”

- Título e texto em coluna à esquerda.
- Quatro passos numerados horizontalmente: **01 Conheça o treinamento**, **02 Receba acesso corporativo**, **03 Estude e pratique**, **04 Avalie e conclua**.
- Usar rótulos e descrições coerentes com vagas fechadas por empresa; **não** anunciar inscrição pública livre ou pagamento como etapa obrigatória.
- Numeração pequena com acento lime, divisórias cinza sutis e alinhamento pela base superior.

### 4.6 Chamada final e footer

- Faixa horizontal escura com foto editorial de apoio, título `Acesse o EVOLU Training` e botão `Acessar plataforma →` à direita.
- Footer preto com logo oficial EVOLU branco, identificador Training, links ativos e informações institucionais.
- Redes sociais somente quando apontarem aos perfis oficiais da EVOLU, sem inventar URLs.

---

## 5. TELA R02 — Autenticação em duas colunas

**Referência:** `referencias/02_login.png`.

**Objetivo:** página de entrada com aparência EVOLU, usando autenticação oficial ChatGPT **sem interface de chat**.

### 5.1 Coluna esquerda (~60%)

- Fotografia vertical da mulher executiva, com parede escura e luz verde-limão discreta; preservar a pessoa no lado direito da fotografia.
- Logo oficial EVOLU branco com `TRAINING` separado no canto superior esquerdo.
- Eyebrow “CONHECIMENTO QUE IMPULSIONA RESULTADOS”.
- Título editorial conforme prévia: `Desenvolva hoje as competências que constroem o seu amanhã.` com destaque lime na última linha.
- Texto de apoio curto e marcadores inferiores “PESSOAS / CONHECIMENTO / RESULTADOS REAIS”.
- Toda escrita em camada HTML sobre a foto, com overlay escuro.

### 5.2 Coluna direita branca (~40%)

- No alto: seletor `Português`, apenas se houver suporte a idioma.
- Centro vertical: título **Acesse sua conta**; descrição: `Utilize sua conta ChatGPT autorizada para acessar a plataforma EVOLU Training.`
- Botão preto **Entrar com ChatGPT →**; ícone do provedor apenas se permitido pelas diretrizes de marca/SDK.
- Três linhas informativas com ícones: `Acesso rápido e seguro`, `Conteúdo personalizado`, `Treinamentos, progresso e certificados`.
- Card discreto inferior: `Não tem acesso? Solicite ao administrador da sua empresa.`
- Não exibir senha em formulário EVOLU como se fosse a senha do ChatGPT; não fabricar um fluxo OAuth independente da hospedagem.

### 5.3 Comportamento de autenticação

1. Visitante escolhe `Acessar plataforma`.
2. Se não identificado, inicia fluxo **nativo real** do host (ChatGPT Sites, onde compatível).
3. Após identificação, sistema procura vínculo de usuário com a organização/participante autorizado; **WhatsApp e cargo são atributos cadastrais, não credenciais suficientes para assumir identidade**.
4. Papel `admin` → `/admin`; participante → `/area`; não autorizado → tela EVOLU de solicitação de acesso.
5. Login deve aceitar `return_to` validado somente para rotas internas de origem, sem open redirect.
6. Ao sair, sessão deve ser revogada conforme as capacidades do host.

**Atenção:** se o host privado bloquear visitantes antes do aplicativo, a capa institucional não será pública automaticamente. Isso é uma dependência de hospedagem e configuração de compartilhamento, não de CSS.

---

## 6. TELA R03 — Dashboard do aluno

**Referência:** `referencias/03_dashboard_aluno.png`.

### 6.1 Sidebar preta fixa

- Logo oficial EVOLU branco no topo, `TRAINING` pequeno separado.
- Itens principais com ícones: `Início`, `Meus treinamentos`, `Ferramentas`, `Certificados`, `Acompanhamento`.
- Divisor horizontal e itens secundários: `Meu perfil`, `Configurações` (limitado ao perfil do aluno), `Ajuda e suporte`.
- Item selecionado: fundo verde-limão, texto/ícone pretos. Outros itens brancos/cinza sobre preto.
- Rodapé da sidebar: pequeno **painel editorial fotográfico vertical** com mensagem institucional e seta.

### 6.2 Topbar

- Campo de busca amplo e discreto à esquerda: `Buscar treinamentos, conteúdos ou ferramentas...` (somente se houver busca real).
- À direita: notificações (quando implementadas), avatar e nome do participante, papel `Participante`, menu de conta.

### 6.3 Cabeçalho de boas-vindas

- Saudação dinâmica: `Olá, {primeiroNome}.` (evitar dados fictícios).
- Texto complementar de continuidade, em cinza.
- À direita um cartão integrado com donut verde de **percentual geral** e números de cursos `em andamento`, `concluídos` e `não iniciados` calculados de registros reais.
- Sem dados: `Seu progresso aparecerá quando houver treinamentos atribuídos.`

### 6.4 Meus treinamentos

- Linha editorial `MEUS TREINAMENTOS` / `VER TODOS →`.
- Grid com **três cards por linha no desktop**.
- Capa escura com imagem, categoria em pill contornada de lime, título branco, resumo em 2 linhas e status no canto superior.
- Parte inferior branca: barra de progresso lime, percentual, duração, módulos concluídos/total e seta circular de ação.
- O card abre o último ponto estudado ou o resumo do curso, conforme histórico real.

### 6.5 Faixa inferior de três painéis

1. **Próximas atividades**: cronologia (datas, atividades e botão de acesso), somente se o calendário/prazo existir.
2. **Ferramentas vinculadas**: recursos liberados, agrupados por aula ou curso; botão abre/download com permissão e registro de acesso.
3. **Conquistas recentes**: atividades concluídas, certificados e marcos reais.

Os três painéis são **colunas lado a lado** no desktop, com borda cinza tênue, mesmo alinhamento superior e alturas equilibradas. Não preencher vazios com fatos inventados.

---

## 7. TELA R04 — Visualização da aula / player

**Referência:** `referencias/04_aula_power_bi.png`.

### 7.1 Estrutura de três colunas

1. **Esquerda (sidebar escura):** voltar, card de capa do curso com status e progresso; menu `Visão geral`, `Aulas`, `Materiais`, `Fórum da turma`, `Certificado`, `Minha evolução`; lista de módulos abaixo; suporte no rodapé.
2. **Centro (conteúdo claro):** breadcrumbs, título longo da aula em duas linhas, descrição, metadados (duração, modalidade, módulo, acesso por empresa), player 16:9, abas editoriais e navegação entre aulas.
3. **Direita (painéis claros):** índice expandível dos módulos, `Ferramentas da aula`, `Minhas anotações`.

No desktop as três colunas são simultâneas, conforme o preview. Painel direito ~27–30% da área após a sidebar; coluna de vídeo é a mais larga.

### 7.2 Player

- Player com poster 16:9, fundo/arte fotográfica do treinamento, ícone Play e controles de vídeo próprios do player real.
- Não colocar texto de botão/play diretamente no poster; usar HTML/media player.
- Exibir duração apenas quando cadastrada ou extraída com segurança da mídia.
- Controle de progresso real, com proteção contra marcação artificial de conclusão sem os critérios pedagógicos.

### 7.3 Conteúdo textual, aulas e ferramentas

- Abas `Sobre a aula`, `Pontos principais`, `Transcrição` **se a transcrição estiver disponível**.
- Bloco final `Ao final desta aula, você será capaz de...` com objetivos estruturados.
- Botões no rodapé `← AULA ANTERIOR` e `PRÓXIMA AULA →`, sujeitos a bloqueios de progressão.
- Painel lateral `Conteúdo do curso` em lista de módulos e aulas, marcando concluídas, atual e bloqueadas, com duração.
- **Ferramentas da aula:** listar PDF, XLSX, planilhas, links e anexos **do `lessonId` da aula atual**, não uma biblioteca irrestrita. Mostrar nome, tipo, tamanho (se arquivo), ícone e ação abrir/baixar.
- Anotações pessoais, se implementadas: texto privado por `userId` + `lessonId`, botão salvar, contador e persistência. Não mostrar editor decorativo não funcional.
- Comentários do curso ou aula: escopo por empresa/turma; permitir mediação pela equipe EVOLU sem expor debates entre clientes não autorizados.

---

## 8. TELA R05 — Painel administrativo

**Referência:** `referencias/05_dashboard_admin.png`.

### 8.1 Navegação lateral e topbar

- Mesmo sidebar preto, mas itens administrativos: `Visão geral`, `Empresas`, `Participantes`, `Treinamentos`, `Módulos e aulas`, `Ferramentas`, `Avaliações/Provas`, `Certificados`, `Comentários`, `Relatórios`, `Configurações`.
- Item ativo no verde-limão com ícone preto.
- Cartão editorial no rodapé da sidebar, coerente com R05.
- Topbar igual à área do aluno: busca, notificações (se reais), avatar e papel `Administrador`.

### 8.2 Cabeçalho e cartões de KPI

- Eyebrow `EVOLU TRAINING` e título grande `Painel administrativo`.
- Subtítulo `Acompanhe o desempenho da plataforma, gerencie conteúdos e o desenvolvimento das empresas e pessoas.`
- Seletor de período no topo direito; filtro aplica-se aos indicadores dependentes do período.
- **Quatro cartões horizontais** no desktop: `Empresas ativas`, `Participantes`, `Treinamentos`, `Engajamento médio`.
- Cada cartão tem ícone simples, rótulo pequeno, número em fonte grande, variação e sparkline **somente se o dado existir**.

### 8.3 Segunda linha: gráfico + feed

- Painel esquerdo maior (~60–65%): `Atividade na plataforma`, gráfico de linhas com eixos, legendas (`Acessos`, `Conclusões`, `Novos participantes`) e filtro de período. O gráfico deve usar dados reais; não usar imagem decorativa de gráfico.
- Painel direito (~35–40%): `Ações recentes` com ícone, evento, referência e tempo relativo.

### 8.4 Terceira linha: cursos + pendências

- Esquerda: lista de `Treinamentos publicados`, miniatura, nome, quantidade de módulos/aulas, estado e menu de ações.
- Direita: `Alertas e pendências` sobre certificados, vagas, revisões e integrações, apenas se houver esses estados no banco.
- Links `Ver todos →` e ações rápidas abrem as páginas correspondentes.

---

## 9. TELA R06 — Cadastro de empresa e vagas

**Referência:** `referencias/06_empresa_vagas.png`.

### 9.1 Layout

- Sidebar administrativa preta, menu `Empresas` em verde-limão.
- Título grande `Cadastro de empresa e vagas`; subtítulo explicativo.
- Região principal em **duas colunas**: formulário amplo (~70–75%) e painel lateral branco de orientações (~25–30%).
- Formulário em card branco com título `Dados da empresa`; grid interno de **2 colunas por linha**.

### 9.2 Campos de empresa

| Campo | Regras |
|---|---|
| Nome da empresa / razão social | Obrigatório; único em conjunto com CNPJ |
| CNPJ | Obrigatório se pessoa jurídica brasileira; validar 14 dígitos; não aceitar duplicação |
| Nome do responsável | Obrigatório |
| E-mail do responsável | Validar formato; não tratar endereço como autorização automática |
| WhatsApp do responsável | Prefixo +55 quando aplicável; armazenar formato E.164 |
| Quantidade de vagas | Inteiro positivo; definir regra de consumo das vagas por participante |
| Treinamentos / módulos contratados | Multi-select conforme oferta do cliente; apenas treinamentos existentes |
| Status | Ativa, suspensa, encerrada; refletir em permissões |
| Mensagem de boas-vindas | Só habilitar se houver envio de e-mails disponível e autorizado |
| Autenticação ChatGPT | Identificar o método disponível; não fazer falsa gestão de contas ChatGPT |

Na tela aprovada, esses campos são apresentados em linhas curtas e espaçadas; botões `Cancelar` (outline) e `Salvar empresa →` (verde-limão) no canto inferior direito.

### 9.3 Painel direito — Acesso dos participantes

- Card branco, título `Acesso dos participantes via conta ChatGPT`.
- Três blocos com ícones e explicações: acesso seguro, conteúdo personalizado, gestão centralizada.
- Card de ajuda na parte inferior `Como funciona?`, com link real para instruções.
- Informar explicitamente que o proprietário da organização define acesso, **mas o login por ChatGPT não concede a vaga por si só**.

### 9.4 Participantes da empresa, logo abaixo do formulário

- Cabeçalho `Participantes da empresa`.
- Botão outline `Importar lista (Excel)` e botão verde `+ Adicionar participante`.
- Tabela com `Nome`, `E-mail`, `Cargo`, `WhatsApp`, `Status`, `Acesso`, `Ações` (mesmo ritmo da prévia).
- Criar/editar participante: nome, e-mail de convite, WhatsApp, cargo **obrigatório**, empresa, status e treinamento atribuído.
- Vincular identidade autenticada ao registro correto e permitir revogar o acesso, inclusive antes do encerramento da empresa.
- Importação Excel: template, validação, preview, detecção de duplicados e confirmação antes de salvar; **não criar workflows nem ações automáticas externas**.
- Ao atingir número de vagas, bloquear novos vínculos ativos e explicar o motivo sem apagar o cadastro.

---

## 10. TELA R07 — Editor de treinamento, módulos, aulas e ferramentas

**Referência:** `referencias/07_editor_modulos_aulas.png`. Esta é a **tela estrutural central do produto** e não deve ser fragmentada em cadastros desconectados.

### 10.1 Cabeçalho superior

- Breadcrumb: `Treinamentos › {Nome do treinamento} › Estrutura do treinamento`.
- Miniatura do curso à esquerda, título em destaque e descrição curta.
- À direita do título: **Status de publicação** e **Visibilidade na página inicial**, em interruptores separados. `Publicado` não implica `Visível na home`.
- Abas horizontais com ícones: `Estrutura` (selecionada), `Configurações`, `Certificado e prova`, `Pré-visualizar`.

### 10.2 Três colunas simultâneas

| Coluna | Largura relativa desktop | Conteúdo |
|---|---:|---|
| **Módulos do treinamento** | ~29% | Lista ordenada, duração e quantidade de aulas; botão verde `+ Novo módulo`; selecionar/reordenar |
| **Aulas do módulo selecionado** | ~34% | Lista numerada, título, duração, publicado/rascunho; botão verde `+ Nova aula` |
| **Ferramentas da aula selecionada** | ~37% | Título da aula; `Enviar arquivo`, `Adicionar link`; PDF, XLSX e URL associados à aula |

**Interação essencial:** quando o administrador seleciona **Módulo 2 → Aula 3**, a terceira coluna deve atualizar **para as ferramentas da Aula 3 do Módulo 2**. Não mostrar ferramentas de outra aula ou de outra empresa. Esta vinculação é um requisito funcional de aceite.

### 10.3 Ações de criação/edição

- `+ Novo módulo`: nome, descrição, ordem, duração estimada e visibilidade.
- `+ Nova aula`: nome, resumo, formato (vídeo/texto/PDF/imagem), conteúdo rico, posição, duração, objetivos, anexos, liberação/rascunho.
- Selecionar aula: preencher o painel direito e disponibilizar editor detalhado sem sair do contexto do treinamento.
- `Enviar arquivo`: selecionar tipo (PDF, XLSX, CSV, imagem), título do recurso, aula, empresa ou participante autorizado (quando necessário), armazenamento privado, verificação de tipo e tamanho.
- `Adicionar link`: título, URL HTTPS, finalidade, aula, permissões; renderizar apenas link autorizado.
- Reordenar módulos e aulas por drag handle **com alternativa por teclado**, salvando ordem no banco.
- `Salvar alterações`: aplicar mudanças com feedback real, erro recuperável e prevenção de edição perdida.
- `Pré-visualizar`: simular a experiência de participante **sem trocar ou ampliar permissões reais**.

### 10.4 Faixa inferior “Configurações do treinamento”

Reproduzir os três controles da imagem, lado a lado:

1. **Visibilidade na página inicial** — só possível para curso publicado e explicitamente autorizado pela administração.
2. **Certificado de conclusão** — habilitar modelo e critérios de emissão.
3. **Prova final** — vincular avaliação final e regras de tentativas.

A faixa mantém botões `Cancelar alterações` e `Salvar alterações` à direita, como na prévia. Mudanças de status que alterem acesso precisam de confirmação e auditoria.

---

## 11. Páginas complementares necessárias (derivadas do mesmo design)

As telas abaixo não foram exibidas isoladamente nas sete capturas, mas são necessárias para que seus menus sejam utilizáveis. **Não constituem autorização para mudar a linguagem visual.**

### 11.1 Lista e criação de treinamentos

- Sidebar/admin e topbar idênticas a R05–R07.
- Cabeçalho `Treinamentos` com filtro por categoria, empresa, status e botão `+ Novo treinamento` lime.
- Criação em assistente, **sem aparência de software diferente**, com etapas `Informações` → `Módulos e aulas` → `Ferramentas` → `Publicação`.
- Informações: título, descrição, categoria, objetivo, público, duração estimada, capa, pré-requisitos, status.
- Capa: carregar mídia da biblioteca, visualizar recorte 16:9, manter título em HTML.
- Publicação: verificar ao menos um módulo/aula válida, critérios de acesso, conteúdo e avaliações; curso visível no site público somente com `showOnHome=true`.

### 11.2 Ferramentas gerais

- Colunas de lista: título, tipo, treinamento, módulo, aula, empresa, público autorizado, modificação, ação.
- Filtros reais por empresa, curso e aula, sem vazamento entre organizações.
- Item vinculado a aula aparece tanto na biblioteca geral **autorizada** quanto dentro da aula correta (R04 e R07).
- Arquivo geral sem vínculo pedagógico é permitido apenas quando explicitamente desejado pela administração.

### 11.3 Provas e avaliações

- Biblioteca de questões, configuração de duração, nota mínima, número de tentativas, embaralhamento quando previsto, gatilhos de aprovação.
- O participante visualiza tempo restante **no servidor**, não só no navegador.
- Finalizar com registro imutável da tentativa, correção, nota e bloqueios; resultado e certificado seguem as regras do treinamento.

### 11.4 Certificados

- Modelo institucional EVOLU com **logo oficial** e dados verificáveis: participante, nome do curso, carga horária, conclusão e identificador único.
- Separar `elegível`, `emitido`, `revogado` e `pendente de validação`.
- Download apenas pelo próprio participante ou administrador autorizado; nunca gerar certificado por clique sem cumprir critérios.

### 11.5 Comentários

- Comentários associados a curso ou aula, com contexto de empresa/turma.
- Interface clean: avatar, nome, hora, corpo, respostas e moderação; mesma tipografia e bordas dos demais cards.
- O comentário nunca deve ficar visível entre empresas se o contexto for privado.

### 11.6 Relatórios

- Filtrar por empresa, treinamento, período e situação do aluno.
- Estatísticas reais: matrículas/vagas, acessos, progresso, tentativas, aprovação, conclusão e NPS após prova.
- Seguir a estrutura de KPIs, gráficos e tabelas do dashboard R05.
- Exportação quando implementada de forma permitida, sem rotinas automáticas pagas.

### 11.7 Configurações (painel de administração)

- `Dados institucionais` (nome público EVOLU Training, contatos, termos).
- `Marca e aparência` **bloqueada às regras da EVOLU**: arquivo oficial, cores e fonte; não permitir customizações arbitrárias por participante.
- `Perfis e permissões` por administrador/gestor/instrutor/aluno.
- `Acesso e identidade`: provedor efetivo, vínculo de conta autorizada, histórico de revogação.
- `Catálogo`: visibilidade pública, política de cursos, disponibilidade por organização.
- `Certificados`, `Avaliações`, `Notificações`, `Privacidade e retenção`, `Integrações` (apenas aquelas realmente disponíveis).
- Campos de integração com outras plataformas **desativados/rotulados como não configurados** enquanto não houver backend e autorização.

---

## 12. Modelo de dados mínimo e relações

```text
Organization/Company
  ├── CompanySeatPolicy (quantidade de vagas)
  ├── CompanyCourseGrant (curso liberado e eventual cota específica)
  ├── CompanyMember (nome, cargo, WhatsApp, e-mail, status)
  │    └── ExternalIdentityLink (identificador estável da autenticação)
  └── CompanyManager (responsável, papéis)

Catalog / Course
  ├── categoria, título, resumo, capa, carga horária
  ├── status: draft | published | archived
  ├── showOnHome: false por padrão
  ├── Module (posição, descrição)
  │    └── Lesson (posição, conteúdo, tipo, duração, status)
  │         ├── LessonResource (PDF, XLSX, imagem, link HTTPS)
  │         ├── LessonNote (privada por participante)
  │         ├── LessonDiscussion (isolamento por turma/empresa)
  │         └── LessonProgress (participante, conclusão)
  ├── Assessment (critérios, questões, tempo, tentativas)
  │    └── Attempt / Answer / Result
  ├── NpsResponse (pós-prova, se habilitado)
  └── Certificate (emissão/revogação verificável)
```

### 12.1 Invariantes

1. O número de vagas ativas nunca pode superar o limite da empresa, conforme a política contratual adotada.
2. Um aluno de uma empresa não acessa dados acadêmicos privados de outra empresa.
3. Uma ferramenta vinculada a uma aula exige `lessonId` válido e empresa autorizada ao curso correspondente; participante individual deve pertencer à empresa.
4. Revogar acesso ao curso bloqueia também downloads e links internos autorizados relacionados a esse curso.
5. `published` e `showOnHome` são campos distintos; **default `showOnHome=false`**.
6. Recurso/arquivo privado é distribuído por endpoint autenticado, não URL pública permanente.
7. O login identifica o usuário; **não** cria automaticamente matrícula/vaga.
8. Entrega de certificado depende de conclusão e critérios formais do curso.
9. Progresso e tempo de prova são validados no backend, não derivados somente da aparência da tela.
10. Ações administrativas com impacto nas permissões precisam de autoria, data e registro auditável.

---

## 13. Manifesto de imagens — associação com os componentes

Os caminhos abaixo são relativos à raiz de um futuro projeto web, por exemplo `public/media/training/`. Os arquivos otimizados dentro do pacote estão em `midia/`. Os **nomes são estáveis** para facilitar a integração; o sistema nunca deve buscar um “banner aleatório” para preencher um componente.

### 13.1 Imagens reconstruídas, preferenciais

| Componente | Arquivo em `midia/` | Tamanho alvo | Ponto focal / camada |
|---|---|---|---|
| Hero da home R01 | `home_executivo_cidade_1920x900.webp` | 1920×900 | Executivo à direita; texto à esquerda, gradiente preto CSS |
| Foto do login R02 | `login_retrato_executiva_900x1200.webp` | 900×1200 | Mulher à direita; texto branco na área escura à esquerda |
| Capa ambiente de trabalho | `escritorio_notebook_1280x720.webp` | 1280×720 | Notebook, café, sem logo falso |
| Curso Dados / BI | `dados_grafico_1280x720.webp` | 1280×720 | Visual gráfico decorativo, sem métricas inventadas |
| Curso Operações / Processos | `processos_arquitetura_1280x720.webp` | 1280×720 | Fachada curva, geometria nítida |
| Capa Liderança | `lideranca_duas_executivas_1280x720.webp` | 1280×720 | Duas profissionais em ambiente de escritório |
| Capa Estratégia | `estrategia_reuniao_1280x720.webp` | 1280×720 | Reunião de negócios em escritório |
| Capa temática complementar | `reflexao_executiva_1280x720.webp` | 1280×720 | Retrato profissional, lado esquerdo escuro |
| Poster de aula | `aula_concreto_1280x720.webp` | 1280×720 | Ambiente arquitetônico para o player; play em HTML |

### 13.2 Imagens complementares já separadas

Da pasta `midia/originais_anteriores/` ou da coleção inicial de assets, conforme disponibilidade no pacote:

| Área da interface | Arquivo de referência no pacote | Dimensão |
|---|---|---|
| Categoria Estratégia | `03_categoria_estrategia_960x600.webp` | 960×600 |
| Categoria Dados | `04_categoria_dados_960x600.webp` | 960×600 |
| Categoria Operações | `05_categoria_operacoes_960x600.webp` | 960×600 |
| Categoria Liderança | `06_categoria_lideranca_960x600.webp` | 960×600 |
| Curso Planejamento | `07_curso_planejamento_1280x720.webp` | 1280×720 |
| Curso BI/Power BI | `08_curso_business_intelligence_1280x720.webp` | 1280×720 |
| Curso Gestão de Processos | `09_curso_gestao_processos_1280x720.webp` | 1280×720 |
| Curso Liderança | `10_curso_lideranca_1280x720.webp` | 1280×720 |
| Curso IA | `11_curso_ia_negocios_1280x720.webp` | 1280×720 |
| Curso Marketing | `12_curso_marketing_1280x720.webp` | 1280×720 |
| Curso Finanças | `13_curso_financas_1280x720.webp` | 1280×720 |
| Curso Produtividade | `14_curso_produtividade_1280x720.webp` | 1280×720 |
| Sidebar editorial | `15_sidebar_montanha_640x960.webp` | 640×960 |
| Rodapé com chamada | `16_rodape_chamada_1920x480.webp` | 1920×480 |
| Poster reserva de aula | `17_aula_video_poster_1280x720.webp` | 1280×720 |

**Preferência de qualidade:** usar primeiro as imagens reconstruídas (melhor definição), e as complementares antigas apenas quando a nitidez for suficiente no tamanho final. A interface deve selecionar a imagem por `course.coverAsset` ou categoria; a mesma foto não deve ser repetida em todos os cards.

### 13.3 Logotipos

- `marca/EVOLU_logo_oficial_branco.png`: header preto, login escuro e sidebar.
- `marca/EVOLU_logo_oficial_preto.png`: fundos off-white, materiais internos claros e certificados.
- Manter proporções originais; `object-fit: contain`; nunca esticar, sombrear ou recolorir o arquivo. Texto `TRAINING` separadamente.

### 13.4 Requisitos de desempenho das imagens

- Prioridade WebP; PNG para identidade com transparência; JPEG pode ser fallback.
- `loading="lazy"` nos cards fora da dobra; foto hero com prioridade adequada.
- Prover `width`, `height`, `sizes`, `srcset` quando a plataforma suportar.
- `alt` descritivo somente quando imagem for informativa; deixar `alt=""` para fundos puramente decorativos.
- Não embutir textos de UI na imagem. Verificar legibilidade após recorte e responsividade.
- Não copiar texto/domínio/contadores das prévias para as fotos finais.

---

## 14. Interações, estados e comportamento obrigatório

### 14.1 Estados de interface

Todo componente de cadastro e carregamento deve ter: **loading**, **sucesso**, **erro recuperável**, **sem dados** e **sem permissão**. Sem mensagens de sucesso antes da resposta do servidor. Não mostrar ação verde aparentemente clicável sem funcionalidade.

### 14.2 Fluxo administrativo fim a fim

```text
Administrador entra
  → Visão geral [R05]
  → Empresas → Nova empresa [R06]
  → Salva empresa e quantidade de vagas
  → Adiciona participantes (cargo e WhatsApp)
  → Treinamentos → Novo treinamento
  → Configura informações e capa
  → Estrutura [R07] → módulo → aula → vídeo/material
  → Na MESMA aula anexa Excel, PDF e link
  → Configura avaliação, NPS e certificado
  → Libera curso à empresa e participantes autorizados
  → Publica curso
  → Opcionalmente exibe na vitrine pública
  → Verifica progresso e relatórios em R05
```

### 14.3 Fluxo do aluno fim a fim

```text
Visitante/participante entra pela home [R01]
  → Autenticação real [R02]
  → Vínculo de empresa e vaga é confirmado
  → Dashboard do aluno [R03]
  → Abre treinamento atribuído
  → Navega módulos/aulas [R04]
  → Estuda e usa ferramenta vinculada à aula
  → Responde avaliação com tempo e regra de aprovação
  → Responde NPS quando aplicável
  → Certificado após atender a critérios
```

### 14.4 Regras para CTAs

| Elemento | Ação |
|---|---|
| `Acessar plataforma` | Abre fluxo de login ou área conforme sessão |
| `Explorar treinamentos` | Rola/abre catálogo público de cursos destacados |
| Card de curso | Abre detalhes e login se necessário, nunca conteúdos privados sem autorização |
| `+ Nova empresa` | Abre formulário R06 |
| `+ Novo módulo` | Cria módulo e retorna à R07 com seleção ativa |
| `+ Nova aula` | Cria aula dentro do módulo selecionado |
| `Enviar arquivo` | Upload protegido para a aula selecionada |
| `Adicionar link` | Salva URL HTTPS vinculada à mesma aula |
| `Salvar alterações` | Persiste alterações no servidor e retorna confirmação verificável |
| `Publicar` | Valida conteúdo mínimo e muda status após aceite do servidor |
| `Exibir na página inicial` | Ajusta visibilidade da vitrine somente para cursos publicados |
| `Continuar aula` | Abre último progresso conhecido |
| `Baixar PDF/Excel` | Entrega arquivo autenticado e autorizado |

---

## 15. Responsividade — manter a identidade das telas

| Viewport | Layout |
|---|---|
| **≥1280 px** | Reprodução desktop R01–R07: sidebar à esquerda, múltiplas colunas e cards nos mesmos agrupamentos dos previews |
| **1024–1279 px** | Sidebar ~210 px, grids adaptados, editor R07 com painéis redimensionáveis sem perda de contexto |
| **768–1023 px** | Navegação recolhível; dashboard 2 cards por linha; gráficos full-width; R07 mantém seletor módulo/aula e ferramentas em painel sequencial |
| **≤767 px** | Header compacto e drawer; cards em 1 coluna, ações acessíveis; foto hero com recorte próprio; login em fluxo vertical; ferramentas da aula abaixo do player ou em aba fixa |

**Crítico:** o painel triplo de R07 não pode se tornar três páginas independentes por padrão. Em mobile, o usuário escolhe módulo e aula em uma navegação sequencial, mantendo estado de seleção e o vínculo das ferramentas. No desktop, conservar as três colunas **sempre que houver largura**.

### 15.1 Desktop screenshot comparison

- Referência principal visual: viewport aproximado **1440×900** e largura natural da prévia **1448×1086**, descontando a barra de navegador ilustrativa.
- Capturar o site real com o mesmo viewport e comparar **posição relativa** de header, sidebar, cards, colunas, hierarquia e tipografia.
- Não comparar a presença de um retrato/curso fictício como critério de funcionalidade; comparar a composição e os elementos reais ocupando o mesmo espaço.
- Não considerar reprodução fiel um layout que apenas compartilhe as cores da marca.

---

## 16. Especificação de componentes para implementação

```text
AppShell
├── PublicLayout
│   ├── InstitutionalHeader
│   ├── HeroWithImage
│   ├── AreasGrid
│   ├── FeaturedCoursesGrid
│   ├── HowItWorksTimeline
│   ├── DarkCtaStrip
│   └── InstitutionalFooter
├── AuthLayout
│   ├── EditorialPhotoPanel
│   └── ChatGPTSignInPanel
├── LearnerLayout
│   ├── DarkSidebar / LearnerNavigation
│   ├── GlobalTopbar
│   ├── ProgressOverview / DonutProgress
│   ├── CourseCardGrid
│   ├── UpcomingActivities
│   ├── LinkedLessonResources
│   └── RecentAchievements
├── LessonLayout
│   ├── CourseSidebar
│   ├── LessonHeader
│   ├── MediaPlayer
│   ├── LessonTabs / LearningObjectives
│   ├── LessonNavigator
│   ├── CourseOutline
│   ├── LessonResources
│   └── PersonalNotes
└── AdminLayout
    ├── DarkSidebar / AdminNavigation
    ├── GlobalTopbar
    ├── KpiGrid / ActivityChart / RecentActions
    ├── CompanyAndSeatsForm
    ├── ParticipantList
    ├── TrainingCreationWizard
    ├── ThreeColumnTrainingEditor
    │   ├── ModuleList
    │   ├── LessonList
    │   └── LessonResourcePanel
    └── CourseSettingsStrip
```

**Regras de composição:** uma única biblioteca de `Button`, `Card`, `Input`, `Select`, `Status`, `Progress`, `Badge`, `Modal`, `FileUpload`, `Icon` e `EmptyState`, com tokens de marca globais. As áreas públicas e internas podem ter variações claras/escuras, mas **não** tema divergente.

---

## 17. Plano de entrega sem desviar do layout aprovado

| Ordem | Entrega | Critério |
|---|---|---|
| P0 | Preservar referência R01–R07 e logotipos oficiais | Arquivos presentes, sem recriação de marca |
| P1 | Definir tokens, sidebar, topbar, cards e grids | Uma única identidade visual em todas as rotas |
| P2 | Home e login R01/R02 | Mesma composição e CTAs operacionais |
| P3 | Dashboard aluno e viewer R03/R04 | Mesmas colunas, campos e status conectados a dados |
| P4 | Dashboard administrativo R05 | KPIs/gráfico/listas reais, sem números de mockup |
| P5 | Empresas/vagas/participantes R06 | Formulário funcional, validações e controle de lotação |
| P6 | Editor de módulos, aulas e ferramentas R07 | Vínculo direto `treinamento → módulo → aula → recurso` |
| P7 | Avaliações, comentários, NPS e certificados | Funcionalidade comprovável ponta a ponta |
| P8 | Testes, revisão visual, acessibilidade e aceite | Screenshots equivalentes às refs e regras seguras |

### 17.1 Critérios de aceite (obrigatórios)

- [ ] **R01:** seções, proporção do hero, cards, paleta, botões e footer correspondem à prévia.
- [ ] **R02:** fotografia e formulário ocupam duas colunas; login real, sem interface de conversa.
- [ ] **R03:** sidebar preta, progresso circular, 3 cards e 3 painéis inferiores no desktop.
- [ ] **R04:** estrutura de 3 colunas, player, índice e ferramentas da aula **atual**.
- [ ] **R05:** 4 KPIs, gráfico + ações recentes, cursos + alertas.
- [ ] **R06:** formulário em 2 colunas, painel direito e tabela de participantes abaixo.
- [ ] **R07:** módulos, aulas e ferramentas simultâneos; selecionar outra aula altera o terceiro painel.
- [ ] Logotipos oficiais branco/preto renderizados sem distorção; `TRAINING` separado.
- [ ] Montserrat e cores consistentes; verde-limão só em destaque/ações.
- [ ] Cadastro e importação usam validação e nunca excedem vagas.
- [ ] Empresa B não acessa conteúdo, comentários ou anexos da empresa A.
- [ ] Curso não autorizado ou rascunho não aparece na vitrine.
- [ ] Curso visível na vitrine não concede acesso ao conteúdo pago/fechado.
- [ ] Prova cronometra e corrige no servidor; certificado só sai quando elegível.
- [ ] Mobile e tablet preservam navegação e vínculos funcionais.
- [ ] Testes reais de backend, autenticação, browser e arquivos realizados no ambiente isolado.
- [ ] Capturas reais em 1440/1024/390 px comparadas às referências visuais, com ajustes de layout.
- [ ] Sem execução de GitHub Actions, Jobs ou Workflows, sem deploy pago e sem consumo de créditos não autorizado.
- [ ] Merge, migrações hospedadas e publicação só após revisão técnica e autorização.

### 17.2 Atenções de segurança/integração

- **Acesso:** ChatGPT Sites possui regras próprias; a home institucional será pública somente se a hospedagem permitir acesso anônimo com proteção robusta das rotas internas. Não prometer abertura pública por mera mudança de página.
- **Banco:** migrações preservam dados históricos; `showOnHome=false` é o padrão, sem liberação automática.
- **Uploads:** PDF, XLSX/CSV e imagens devem ter tamanho, MIME e extensão válidos, armazenados com permissão fechada e verificados no download.
- **Links externos:** validar HTTPS e alertar que o próprio serviço de destino possui controles de acesso.
- **Custos:** não adicionar Actions, Jobs, Workflows, CI ou provedores de cobrança; não implantar recursos pagos.
- **Dados pessoais:** armazenar o mínimo necessário, ocultar telefone/e-mail em interfaces não autorizadas; papel de cada usuário deriva do backend.

---

## 18. Checklist de arquivos para o projeto

```text
EVOLU_Training_Especificacao_V1/
├── EVOLU_TRAINING_ESTRUTURA_VISUAL_FUNCIONAL_V1.md
├── referencias/           # screenshots R01...R07 (somente comparação)
├── midia/                 # imagens de conteúdo otimizadas e sem texto de interface
│   ├── home_executivo_cidade_1920x900.webp
│   ├── login_retrato_executiva_900x1200.webp
│   ├── escritorio_notebook_1280x720.webp
│   ├── dados_grafico_1280x720.webp
│   ├── processos_arquitetura_1280x720.webp
│   ├── lideranca_duas_executivas_1280x720.webp
│   ├── estrategia_reuniao_1280x720.webp
│   ├── reflexao_executiva_1280x720.webp
│   └── aula_concreto_1280x720.webp
├── midia/originais_anteriores/   # capas e fundos complementares já produzidos
└── marca/
    ├── EVOLU_logo_oficial_branco.png
    └── EVOLU_logo_oficial_preto.png
```

**Nota sobre arquivo `.md` isolado:** as referências Markdown de imagens apontam para caminhos relativos que estarão íntegros no pacote ZIP; ao distribuir apenas este `.md`, essas fotos não acompanham automaticamente o documento. O texto da especificação permanece válido sem o pacote.

---

## 19. Restrições explícitas — o que não fazer

- Não tratar a prévia como uma imagem única para desenhar o site por cima.
- Não substituir os sete layouts por um template genérico de cursos, WordPress, LMS ou painel administrativo padrão.
- Não recriar a marca EVOLU e não integrar a palavra `TRAINING` dentro do lettering original.
- Não preencher números de empresas, alunos, engajamento, progresso ou satisfação com os valores fictícios dos mockups.
- Não mostrar vagas livres, inscrições públicas ou pagamento quando o contrato é empresa × vagas fechadas.
- Não separar as ferramentas do contexto de aulas no editor (R07).
- Não copiar imagem de uma marca homônima ou usar fotografia com logo falso incorporado.
- Não colocar texto de botão, legenda ou rótulo dentro de uma fotografia.
- Não utilizar WhatsApp isolado como autenticação suficiente.
- Não afirmar funcionalidades prontas sem backend, testes e autorização.
- Não executar CI/Actions/Jobs/Workflows nem deploys pagos.

**Resultado esperado:** EVOLU Training com **aparência praticamente igual às referências R01–R07** e comportamento real de plataforma de formação corporativa, mantendo o logotipo oficial, o conteúdo dinâmico e o isolamento entre empresas. Os dados da operação substituirão os exemplos dos mockups **sem alterar a composição visual**.
