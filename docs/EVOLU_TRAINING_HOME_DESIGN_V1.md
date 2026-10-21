# EVOLU Training — Página inicial e sistema visual v0.1
Data de referência: 21/10/2026 | Marco de homologação: 25/10/2026

## Propósito e arquitetura

A página `/` é a apresentação institucional da plataforma e do catálogo público autorizado. Ela não é o painel de aprendizagem. A rota `/area` abriga a aplicação existente; somente identidades autenticadas por ChatGPT Sites podem entrar, e a API ainda exige uma vaga ativa ou papel administrativo.

Fluxo: página inicial → apresentação do curso → `/area?course={id}` → autenticação nativa `/signin-with-chatgpt?return_to=...` (quando necessária) → curso autorizado na interface EVOLU Training. O aluno não visualiza uma interface de conversa do ChatGPT, não fornece senha dentro do site e não ganha permissão apenas por se autenticar.

## Seções da página inicial

1. **Cabeçalho:** identificação textual provisória do produto, menu para áreas de desenvolvimento, cursos, metodologia e acesso.
2. **Abertura editorial:** posicionamento da formação corporativa, acessos e elemento geométrico original em CSS (sem imagens não licenciadas).
3. **Áreas de desenvolvimento:** quatro frentes editoriais ilustrativas. **Não representam cursos abertos ou vagas disponíveis.**
4. **Treinamentos em destaque:** dados reais, apenas `status='published'` e `show_on_home=1`. Se não houver cursos liberados, apresentar estado vazio, sem inventar ofertas.
5. **Experiência de aprendizagem:** conteúdo, aplicação, avaliação e conclusão.
6. **Acesso corporativo:** botão de entrada, informações sobre vagas por empresa e rodapé.

## Sistema visual — identidade referenciada

- **Tipo:** Montserrat, pesos 300 a 800. Fonte carregada por CSS externo com fallback Arial/Helvetica; a conectividade/CSP da hospedagem precisa ser testada.
- **Cores:** tinta `#161917`, fundo `#F5F5F1`, linha `#D8D9D1`, verde-limão `#D7F45D`. Componentes de gestão ajustados para a mesma família cromática.
- **Composição:** editorial, grande respiro, grade modular, títulos curtos e contraste alto. Animações desnecessárias evitadas.
- **Responsividade:** layouts adaptativos para desktop, tablet e celular, com estados de foco e preferência de movimento reduzido.
- **Logotipo oficial EVOLU:** aplicado por meio dos arquivos originais do proprietário (`public/brand/evolu-white.png` e `public/brand/evolu-black.png`), com recorte do espaço externo e transparência, sem tipografia redesenhada. A denominação Training é separada do logo; veja `EVOLU_TRAINING_BRAND_SYSTEM_V1.md`.
- **Material fotográfico:** não há fotos na v0.1; se futuramente incluídas, utilizar imagens autorizadas e pertinentes.

## Governança de dados e acesso

- `0002_public_course_showcase.sql` acrescenta `courses.show_on_home INTEGER NOT NULL DEFAULT 0`, sem modificar migrações antigas e sem tornar públicos os cursos existentes.
- Só a administração pode marcar/desmarcar cursos **já publicados** para a vitrine, pela tela do próprio treinamento.
- A consulta pública retorna **somente** id, título, descrição, carga horária e categoria. Não contém empresas, alunos, vagas, arquivos, aulas, provas ou relatórios.
- O endpoint da aplicação continua exigindo identidade autenticada; e a autorização corporativa é independente da exibição pública do curso.
- A publicação do catálogo não significa matrícula, inscrição livre ou disponibilidade de vagas.

## Restrição de hospedagem a validar

O projeto está em **ChatGPT Sites com acesso privado**. Uma homepage programada para usuários não autenticados **não se torna publicamente acessível enquanto o controle de visitantes do Site bloquear o acesso antes de chegar ao aplicativo**. A abertura pública da vitrine precisa ser avaliada separadamente com os recursos suportados pelo provedor, preservando rotas e APIs fechadas. **Não alterar a visibilidade do Site sem validação.**

A rota `/signin-with-chatgpt` é o fluxo nativo do ChatGPT Sites e **não** representa um serviço OAuth genérico para qualquer domínio externo. Uma futura migração a outro host exigirá implementação aprovada de autenticação, nunca simulação de login ou captura direta de senha ChatGPT.

## Gates de aceite

- [ ] Teste de build/TypeScript no ambiente compatível.
- [ ] Aplicação incremental de `0001` e `0002` em banco local isolado, preservando cursos e ferramentas.
- [ ] Auditoria de catálogo: curso draft não aparece; publicado privado não aparece; marcado aparece; desmarcado sai; somente metadados autorizados são expostos.
- [ ] Verificação em desktop e celular: tipografia, contraste, CTAs, navegação por âncora e layout.
- [ ] Login real via ChatGPT Sites em `/area`, com retorno para o curso específico e acesso negado a aluno de outra empresa.
- [ ] Conferência da configuração de compartilhamento do Site e decisão explícita sobre vitrine pública.
- [ ] Aplicação do arquivo oficial de logotipo EVOLU.
- [ ] Liberação formal antes de merge, migrações hospedadas e publicação.

## Limites de custo

Somente alterações no PR Draft. Sem GitHub Actions, Jobs, Workflows, deploy automático ou serviços pagos. Sem cobrança, matrícula pública ou integração fiscal.
