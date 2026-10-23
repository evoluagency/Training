# Evolu Training

Plataforma de treinamento corporativo com vagas por empresa. Código no GitHub, aplicação Next.js na Vercel e autenticação, banco e arquivos privados na Supabase. O acesso não depende do ChatGPT.

## Operação

- **Empresas:** cadastre a empresa, defina as vagas e libere os treinamentos.
- **Participantes:** reserve a vaga com nome, cargo e e-mail; use **Configurar acesso** para definir a senha inicial. Entregue a senha por canal privado.
- **Treinamentos:** crie o catálogo e o treinamento; organize módulos, aulas, formatos, ferramentas e questões. As ferramentas pertencem à aula selecionada.
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

O conteúdo publicado é congelado. Artigos vinculados ao LinkedIn, checkout, importação por Excel e edição/reordenação completa de conteúdo são pendências anteriores à migração. Os documentos de revisão visual em `docs/qa/` e os checkpoints antigos são históricos; o documento de transição descreve a arquitetura atual.

Meta operacional: 25/10/2026. Treinamento: 31/10/2026. Preparar o conteúdo real e validar a primeira turma antes de liberá-la.
