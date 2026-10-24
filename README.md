# Evolu Training

Plataforma de treinamento corporativo com vagas por empresa. Código no GitHub, aplicação Next.js na Vercel e autenticação, banco e arquivos privados na Supabase. O acesso não depende do ChatGPT.

## Operação

- **Empresas:** cadastre a empresa, defina as vagas e libere os treinamentos.
- **Participantes:** reserve a vaga com nome, cargo e e-mail; use **Configurar acesso** para definir a senha inicial. Entregue a senha por canal privado.
- **Categorias:** cadastre os setores da empresa, como Financeiro, Contábil, Compras e Marketing. Cada curso pertence a uma categoria.
- **Treinamentos:** crie o curso na categoria desejada; organize módulos, aulas, formatos, ferramentas e questões. As ferramentas pertencem à aula selecionada.
- **Aluno:** aulas → avaliação com prazo no servidor → pesquisa opcional → certificado, quando elegível.
- **Administração:** relatórios, comentários por empresa, certificados e gestão dos acessos.

Não há inscrição pública. Pagamentos permanecem desativados.

## Desenvolvimento

Node.js 24 e pnpm 11.25.0. Configure as duas variáveis públicas indicadas em `.env.example`; não coloque chaves secretas no repositório.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm test
pnpm build
```

`vercel.json` configura Next.js e os comandos de instalação/build. O backend da Supabase está em `supabase/functions/training-api/`; as migrações PostgreSQL ficam em `supabase/migrations/`. Os testes locais preservam a comparação com o serviço anterior e também executam o percurso de conclusão em PostgreSQL.

## Acesso e arquivos

Autenticação independente por e-mail e senha. A autorização por empresa e participante é verificada no backend em cada operação. As tabelas ficam em esquema privado com RLS, e os objetos no bucket privado `training-files`.

Vídeos até 50 MB; materiais e ferramentas até 10 MB. Uploads autenticados seguem diretamente para a Supabase; downloads usam links assinados por 60 segundos após autorização. Não se mede atenção ou tempo efetivamente assistido.

O proprietário recebe uma chave privada inicial de uso único para definir a senha. Recuperação por e-mail exige configuração adequada de SMTP/URLs na Supabase. A administração também pode configurar o acesso do participante pela plataforma.

## Transição e limites

Veja [TRANSICAO_VERCEL_SUPABASE.md](docs/TRANSICAO_VERCEL_SUPABASE.md) para os registros migrados, arquitetura, validação e o estado da integração Git da Vercel. O projeto Supabase dedicado é `evolu-training`, em São Paulo. Os dados de empresas/alunos, uploads, senhas, sessões e a chave inicial não estão no GitHub.

O conteúdo publicado é congelado. Artigos vinculados ao LinkedIn, checkout, importação por Excel e edição/reordenação de conteúdo já publicado são pendências anteriores à migração. Os documentos de revisão visual em `docs/qa/` e os checkpoints antigos são históricos; o documento de transição descreve a arquitetura atual.

Meta operacional: 25/10/2026. Treinamento: 31/10/2026. Preparar o conteúdo real e validar a primeira turma antes de liberá-la.

## Editor de conteúdo — 24/10/2026

Acesse `https://training.evolu.ink/admin/treinamentos`. Os endereços estáveis antigos da Vercel redirecionam para o domínio próprio preservando página e parâmetros.

- A aba **Categorias** permite cadastrar e editar os setores e acessar seus cursos. No catálogo de treinamentos, os filtros por categoria organizam os cursos; o cartão completo abre a estrutura.
- Módulos e aulas têm formulários de edição com nome, texto opcional e ordem. Os formulários abrem em uma janela acessível, inclusive no celular.
- A organização é **Categoria → Curso → Módulos → Aulas e materiais**. A avaliação e o certificado pertencem ao curso. A categoria pode mudar sem alterar o conteúdo publicado ou a autorização por empresa.
- **Criar aula a partir de PDF** envia o arquivo e cria uma aula. **Adicionar material à aula** complementa a aula existente. PDFs até 10 MB. Os materiais continuam privados.
- No formulário **Editar aula**, o campo **Módulo da aula** permite mover a aula entre módulos do mesmo curso ainda editável, preservando materiais e ferramentas.
- Categorias e treinamentos têm capa configurável por upload (PNG/JPG/WebP até 5 MB), biblioteca ou URL HTTPS. O treinamento herda a capa da categoria quando não tem capa própria. Não há foto automática baseada no título.
- A lista de aulas e o painel de materiais se empilham quando não há espaço para duas colunas. Títulos e nomes de arquivos longos quebram a linha.
- Status: **Rascunho**, **Em revisão**, **Ativo**, **Desativado** e **Arquivado**. Ativar exige aulas, material e questões válidos; a publicação congela o conteúdo. Desativar remove o acesso do participante e a vitrine; reativar preserva a versão e os registros. Um treinamento publicado não pode voltar a rascunho para contornar esse bloqueio.
- Capas só são apresentadas publicamente quando o curso está ativo e explicitamente liberado na página inicial. O bucket permanece privado.

Validação: TypeScript, build Next.js e 45 testes locais, incluindo PostgreSQL, SQLite, armazenamento, bytes do PDF, autorização por empresa, categorias, movimentação de aulas e transições de status. A validação visual usa dados sintéticos em ambiente isolado. Os testes não criam cursos nem anexam documentos na base real.
