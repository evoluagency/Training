# Evolu Training

Plataforma privada de treinamentos corporativos, com vagas por empresa e acesso por conta ChatGPT autorizada. Cobranças permanecem desativadas.

## Estado atual — 22/10/2026

As nove imagens selecionadas pelo proprietário estão incorporadas à branch de revisão. O documento visual original, as sete referências e as evidências da revisão local estão versionados. TypeScript, build de produção, 29 testes e integridade das nove mídias passaram. As sete telas foram verificadas em larguras de 1440, 1024 e 390 px.

**O PR permanece Draft; a versão hospedada ainda não recebeu estas alterações.** A validação local usa dados fictícios e não comprova autenticação externa, migrações hospedadas ou aceite completo da turma. Consulte o [relatório atual de integração e pendências](docs/qa/INTEGRACAO_VISUAL_2026-10-22.md); ele atualiza os registros históricos de verificações e imagens pendentes.

## Página inicial, catálogo e acesso

- **Página inicial (`/`):** apresentação institucional, áreas de formação e treinamentos destacados pela administração.
- **Área protegida (`/area`):** interface própria do EVOLU Training; a autenticação utiliza o fluxo nativo de ChatGPT Sites. O participante não interage com uma tela de chat.
- **Exibição pública:** um treinamento publicado aparece na vitrine somente quando o administrador aciona **Exibir na página inicial**, dentro do treinamento. O padrão é oculto, inclusive para cursos já existentes.
- **Cartão do curso:** apresenta apenas título, resumo, categoria e duração; ao acessar, o aluno passa pela autenticação e continua sujeito à autorização de sua empresa.
- **Visibilidade do Site:** o ambiente ainda é privado. Para visitantes não autenticados enxergarem a página inicial, o provedor precisa permitir essa modalidade sem remover os controles da aplicação.
- **Identidade:** identidade editorial EVOLU verificada em materiais oficiais e na presença institucional: Montserrat, contraste preto/branco, verde-limão pontual e logotipos originais. O lettering oficial EVOLU foi incorporado a partir dos arquivos originais fornecidos, nas versões branca e preta, sem recriação tipográfica.

Diretrizes e gates: [Homepage e acesso](docs/EVOLU_TRAINING_HOME_DESIGN_V1.md) e [Sistema visual EVOLU Training](docs/EVOLU_TRAINING_BRAND_SYSTEM_V1.md).

## Onde cadastrar cada item

- **Treinamentos**: catálogo → novo treinamento → gerenciar treinamento → módulos → aulas → vídeo, imagem ou PDF. Na mesma tela, cadastre as questões, publique e vincule às empresas.
- **Empresas e vagas**: empresas clientes e capacidade de acesso.
- **Participantes**: pessoas que ocuparão as vagas.
- **Ferramentas**: biblioteca de planilhas, arquivos e links por empresa ou participante. Para associar uma ferramenta a uma aula, abra **Treinamentos → Módulo → Aula**, vincule primeiro a empresa e então adicione um link ou arquivo na própria aula.
- **Acompanhamento**: progresso, resultados e certificados.

## Recursos

- Empresas com limite de vagas; reserva, suspensão e reativação de participantes.
- Nome, cargo, e-mail da conta ChatGPT e WhatsApp opcional. O telefone é contato, não autenticação.
- Catálogos, treinamentos, módulos e aulas; vídeo MP4/WebM, PDF, PNG, JPG e WebP.
- Formatos equivalentes ou materiais complementares na mesma aula.
- Prova objetiva com prazo no servidor, respostas salvas, limite de tentativas e aprovação configurável.
- NPS opcional; nota da pesquisa não interfere na aprovação.
- Certificado com registro persistente, código único e impressão/salvamento em PDF pelo navegador.
- Ferramentas por empresa ou participante, com vínculo opcional à aula: links HTTPS, XLSX, XLS, CSV, PDF e imagens. Ferramentas vinculadas aparecem na aula e deixam de estar disponíveis após a revogação do curso.
- Comentários por treinamento e empresa, com respostas da administração.
- Relatório de progresso, notas e certificados; gestor restrito à própria empresa.

## Acesso e armazenamento

Sites controla a autenticação por ChatGPT e a lista privada de visitantes. A aplicação mantém a autorização por empresa no servidor. O administrador reserva uma vaga com o e-mail usado no ChatGPT; o proprietário também precisa liberar esse e-mail no compartilhamento privado do Site. Cadastrar uma vaga não envia convite automaticamente.

No primeiro acesso do administrador, o e-mail configurado na variável de runtime `TRAINING_ADMIN_EMAIL` permite vincular o administrador ao identificador estável do Sites. Não há cadastro público, senha própria ou promoção automática de outros visitantes.

D1 guarda os registros e R2 guarda arquivos privados. O servidor verifica autorização em cada acesso. Os arquivos enviados não entram no GitHub. Um participante pertence a uma empresa nesta versão. Vagas reservadas e ativas consomem capacidade; suspender libera a vaga e bloqueia o acesso da aplicação.

Limites por arquivo: vídeo até 100 MB; materiais e ferramentas até 10 MB. Uploads são transmitidos para R2. A reprodução é HTML5, com suporte a requisições de intervalo, sem transcodificação ou streaming adaptativo.

## Desenvolvimento

Runtime: Node.js 24, Vinext/React e Cloudflare Workers. As dependências estão fixadas em `pnpm-lock.yaml`. Use os helpers do plugin Sites para preparar, instalar, construir e publicar; o projeto preserva sua integração nativa.

```sh
node --experimental-transform-types --test tests/training.test.ts tests/storage-integration.test.ts
node node_modules/typescript/bin/tsc --noEmit
```

Os testes usam identidades fictícias e armazenamento local, sem chamadas de inferência ou serviços pagos. A integração de armazenamento usa Miniflare, D1 e R2 locais. Não comprova o login real de participantes externos.

As migrações incrementais `0001_link_resources_to_lessons` e `0002_public_course_showcase` adicionam o vínculo de ferramentas às aulas e a liberação opcional de cursos na vitrine (`show_on_home=0` por padrão), preservando os dados existentes. Migrations geradas em `drizzle/` devem ser aplicadas localmente antes de usar banco em preview. A publicação pelo Sites aplica as migrations no ambiente hospedado. Nunca alterar migrations já aplicadas. Credenciais e configuração privada ficam fora do repositório.

Não existem GitHub Actions, workflows, jobs, deploy automático pelo GitHub ou integração de pagamento neste projeto. A publicação é feita pelo fluxo do Sites.

## Preparação do treinamento

Meta operacional: **25/10/2026**. Treinamento: **31/10/2026**.

Consulte `docs/OPERACAO_E_ACEITE.md` para a preparação e validação da turma. O catálogo e as empresas iniciam vazios: o conteúdo real, as regras de avaliação e a lista de participantes ainda devem ser fornecidos pelo responsável.

## Limites atuais

- A conclusão das aulas é declarada pelo participante; o sistema não mede atenção ou tempo efetivo assistido.
- O curso publicado é congelado para preservar os registros da prova. Alterações de conteúdo publicado exigem uma nova versão do curso.
- O certificado é de conclusão deste treinamento, sem alegação de acreditação externa. Seu código pode ser consultado pelo participante, pelo gestor da empresa e pela administração.
- Comentários não disparam notificações por e-mail ou WhatsApp.
- A sincronização com GitHub não publica o site automaticamente. Dados de alunos e arquivos privados não devem ser incluídos no código.
