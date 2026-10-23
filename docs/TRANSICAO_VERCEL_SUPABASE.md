# Transição da Evolu Training — 23/10/2026

## Arquitetura

- Código, nove imagens, logotipos oficiais, documento visual e referências: GitHub `evoluagency/Training`.
- Aplicação: Next.js 16 na Vercel, projeto `evolu-training`, equipe `evolu2`.
- Identidade: Supabase Auth, por e-mail e senha. Nenhuma conta ChatGPT é necessária.
- Banco: PostgreSQL em esquema privado `training`, no projeto Supabase `evolu-training` (`ljuqbkwsnouthzwrzszy`, São Paulo).
- Arquivos privados: bucket `training-files` na Supabase Storage.
- Regras de negócio: Edge Function `training-api`, com validação real da sessão e autorização por empresa/participante.

As tabelas privadas não são expostas diretamente ao navegador. Todas têm RLS habilitada e acesso direto revogado para os papéis públicos. A função usa as credenciais privadas injetadas pela Supabase; nenhuma chave secreta vai para o cliente ou para o GitHub. A configuração `verify_jwt=false` desativa apenas a checagem antiga do gateway: a função valida explicitamente cada token pelo serviço Auth. As únicas rotas sem sessão são saúde, catálogo público filtrado e configuração inicial protegida por chave aleatória de uso único.

## Dados preservados

| Dado do ambiente anterior | Quantidade |
|---|---:|
| Administração | 1 |
| Empresa | 1 |
| Catálogo | 1 |
| Treinamento em rascunho | 1 |
| Módulos | 5 |
| Participantes, aulas e questões | 0 |
| Tentativas, pesquisas, certificados e comentários | 0 |
| Arquivos privados de aulas/ferramentas | 0 |

Os identificadores de empresas, catálogos, cursos e módulos são preservados. A identidade antiga do administrador é vinculada à nova conta verificada na configuração inicial. Não há registros de alunos nem vídeos/PDFs particulares a transportar nesta etapa. As nove imagens editoriais já estão em `public/training-media/`.

Os registros reais foram importados diretamente para o banco privado. O repositório público não contém a exportação, senhas, sessões, chaves secretas ou a chave de configuração inicial.

## Acesso

O proprietário recebe um link privado de configuração inicial e escolhe sua senha. O segredo fica no fragmento da URL e não é enviado como parte do endereço ao servidor. Após o uso, sua validade é removida no banco.

A administração reserva a vaga em **Participantes** e usa **Configurar acesso** para definir a senha inicial da conta. A senha deve ser entregue ao participante por canal privado. Não há inscrição pública nem envio automático de convites. A recuperação por e-mail depende das configurações de SMTP/URLs autorizadas no projeto Supabase; enquanto isso, a administração pode redefinir o acesso pela tela de participantes.

## Páginas conectadas

- Acesso → encaminhamento conforme o papel → administração ou aprendizagem.
- Empresas → vagas/participantes da empresa → treinamentos liberados.
- Treinamentos → módulos → aulas → vídeos/PDFs/imagens e ferramentas contextualizadas.
- Aula → avaliação cronometrada → pesquisa opcional → emissão e impressão do certificado.
- Menus próprios para avaliações, comentários e certificados, com informação real.
- Administração → provas, certificados, comentários, relatórios e configurações.
- URLs desconhecidas apresentam uma página de retorno, sem telas vazias.

Os limites e regras anteriores continuam no servidor: vagas, isolamento por empresa, prazo de prova, tentativas, aprovação, pesquisa e elegibilidade do certificado. O conteúdo publicado permanece congelado para preservar seus registros.

## Arquivos e limites

Uploads seguem diretamente do navegador para a função autenticada da Supabase, evitando o limite de corpo das funções Vercel. Vídeos: até **50 MB** por arquivo na configuração gratuita atual; PDFs, imagens e ferramentas: até **10 MB**. Formatos: MP4/WebM, PDF, PNG/JPEG/WebP e XLSX/XLS/CSV nas ferramentas.

Downloads são autorizados no servidor e redirecionados para URLs assinadas com validade de 60 segundos. Esses links podem continuar válidos até o vencimento após revogação; uma nova consulta ao endpoint sempre verifica a autorização atual.

## Validação

- Build Next.js e TypeScript concluídos.
- 32 testes locais: regras de negócio, armazenamento, migração/SQL PostgreSQL e percurso completo da avaliação ao certificado.
- Verificação no backend hospedado: login por senha, papel administrativo, leitura dos registros importados e rejeição de reutilização da chave inicial.
- Upload PDF e download privado por URL assinada testados no backend hospedado, com comparação dos bytes.
- Integridade das nove imagens confirmada.
- Banco com 18 tabelas privadas protegidas, sem tabelas sem RLS; bucket privado. O advisor informa a ausência intencional de políticas nas tabelas privadas: o acesso é exclusivo do backend autorizado.

## Publicação na Vercel

Variáveis exigidas, também descritas em `.env.example`:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Somente valores públicos são necessários na Vercel. A versão do gerenciador está fixada e os comandos de instalação/build estão em `vercel.json`.

A conexão Vercel da equipe EVOLU não permitiu criar projetos (403). Na equipe `evolu2`, que já hospeda os outros projetos do proprietário, a criação foi permitida. A vinculação Git foi recusada com `repo_no_access`, pois essa integração não possui acesso de escrita ao repositório `evoluagency/Training`. A alternativa de publicação envia os arquivos do mesmo commit à Vercel, preservando o código no GitHub e sem conceder acesso adicional a terceiros. **Deploy automático por push exige autorizar posteriormente o repositório na integração Git da Vercel.**

Não há GitHub Actions, Jobs ou Workflows adicionados. A publicação na Vercel e a função Supabase são realizadas pelo fluxo de implantação correspondente.

## Preservação do ambiente anterior

O ambiente Sites só deve deixar de servir a plataforma após a nova publicação ser validada. A retirada pode manter um aviso/redirecionamento ao novo endereço, sem executar a aplicação antiga. Não excluir o projeto antigo nem seus bancos como parte de uma tentativa de implantação que falhou.

## Pendências de produto já existentes

A migração não acrescenta checkout, página de artigos/integração editorial com LinkedIn, importação de participantes por Excel ou edição/reordenação completa de cursos publicados. Pagamentos permanecem desativados. O conteúdo real das aulas, as questões, os participantes e a revisão de aceite da primeira turma ainda precisam ser preparados pelo responsável.
