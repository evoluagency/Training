# EVOLU Training — integração visual e verificação local

Data: 22/10/2026. Branch: `feat/training-lesson-linked-tools-20261021`, PR #1 (Draft).

## Resultado desta revisão

As nove imagens enviadas pelo proprietário foram incorporadas às páginas existentes. A implementação já permite revisar a apresentação, o acesso, a área do aluno, a aula, o painel administrativo, o cadastro de empresa e o editor de módulos/aulas. Esta é uma versão em revisão; não é declaração de prontidão operacional para a turma de 31/10.

O [documento visual original](../visual/EVOLU_TRAINING_ESTRUTURA_VISUAL_FUNCIONAL_V1.md) e suas [sete referências](../visual/referencias/) foram preservados byte a byte. Os registros anteriores sobre imagens ausentes e impossibilidade de executar os testes são históricos e foram superados nesta revisão.

### Imagens

- Nove WebP locais em `public/training-media/`, total de 566.194 bytes, com dimensões, origem e SHA-256 no manifesto.
- A seleção mais recente substitui a seleção do ZIP/patch anterior. Não houve regeneração das fotografias.
- Hero: executivo e cidade. Login: retrato da executiva. Áreas de formação: estratégia, dados, processos e liderança. Demais imagens: escritório, reflexão e aula.
- O nome histórico do arquivo de hero contém `1920x900`; sua resolução real é **1536 × 864**, preservada sem ampliação artificial.
- Logotipos oficiais e fluxo nativo de identidade foram preservados.

### Correções

- Respostas HTTP são tratadas por um helper tipado, resolvendo os erros de compilação da interface e do redirecionamento de acesso. Falhas sem JSON recebem mensagem compreensível.
- Formulários de catálogo, módulo, aula, link, liberação e questão permanecem abertos após erro da API, preservando o preenchimento.
- O percentual médio do painel não é multiplicado por 100 duas vezes.
- O avanço de aula respeita a posição do módulo e depois a posição da aula, inclusive quando cada módulo reinicia sua numeração em 1.
- Ajustes de margens na home/login, contraste sobre a fotografia principal, cor das barras de progresso e altura dos painéis empilhados do editor.

## Evidências de execução

| Verificação | Resultado |
|---|---|
| TypeScript (`tsc --noEmit --incremental false`) | Passou |
| Build de produção pelo helper oficial do Sites | Passou, 10 rotas |
| Node + integração Miniflare/D1/R2 | 29 testes passaram; zero falhas |
| `node scripts/verify-training-media.mjs` | 9/9 imagens íntegras |
| Mídias no build | 9/9 idênticas aos arquivos de origem |
| Documento e sete referências originais | Cópias idênticas |
| R01–R07 em 1440, 1024 e 390 px | 21 verificações sem transbordamento horizontal nem elementos `img` quebrados |

Os [registros de largura](responsive-checks.json) incluem largura solicitada, largura útil, largura de rolagem e imagens quebradas. A barra de rolagem vertical pode consumir 15 px da largura útil.

### Capturas

| Tela | Captura local |
|---|---|
| R01 — Página inicial | [1440 px](screenshots/r01-1440.jpg) |
| R02 — Acesso | [1440 px](screenshots/r02-1440.jpg) |
| R03 — Área do aluno | [1440 px](screenshots/r03-1440.jpg) |
| R04 — Aula | [1440 px](screenshots/r04-1440.jpg) |
| R05 — Administração | [1440 px](screenshots/r05-1440.jpg) |
| R06 — Empresa e vagas | [1440 px](screenshots/r06-1440.jpg) |
| R07 — Editor | [1440 px](screenshots/r07-1440.jpg), [390 px](screenshots/r07-390.jpg) |

As capturas mostram a área visível de uma página de teste que contém a aplicação em iframe. Bordas cinzas, barras externas e eventuais cortes no topo pertencem a essa página de teste. As medições de transbordamento foram feitas **dentro da aplicação**, não na página externa. Não são capturas de produção nem uma comparação automática pixel a pixel com as referências.

### Interações verificadas no navegador

- Alternar entre aulas troca as ferramentas exibidas: o material da primeira aula e a planilha vinculada ao módulo 2 permanecem nos respectivos contextos.
- Anotação privada foi salva e recuperada ao retornar à aula, sem aparecer na outra aula.
- Uma questão com índice de resposta inválido foi rejeitada pela API; o formulário e seu enunciado permaneceram disponíveis para correção.
- Painel administrativo apresentou 19% para os dados de teste, sem a inflação anterior para 1900%.
- Editor empilha módulos, aulas e ferramentas em largura de 390 px; menu lateral foi acionado por teclado.

O navegador utilizou uma cópia descartável com identidade fictícia e o serviço real da aplicação sobre D1/R2 locais. Havia uma empresa fictícia, dois participantes e quatro cursos de teste. O adaptador de identidade e as fixtures não fazem parte do código enviado ao GitHub. Não houve alteração de dados operacionais nem teste de autenticação do host por essa simulação. Não houve validação em aparelho móvel físico ou Safari.

## O que ainda falta para liberar a primeira turma

1. Validar no ambiente hospedado o login real de administrador e participante, o compartilhamento privado e o isolamento entre empresas; aplicar as migrações pendentes somente no fluxo autorizado de publicação.
2. Cadastrar e revisar o conteúdo real, os formatos equivalentes, as ferramentas de cada aula, as questões, o tempo de prova e as regras de aprovação/certificado.
3. Executar o percurso completo com uma conta de participante autorizada: acesso → aula e ferramenta → prova cronometrada → NPS → certificado.
4. Conferir a lista de participantes, cargos, contatos, vagas e treinamentos liberados, com os responsáveis pelas empresas.

### Pendências funcionais frente ao documento completo

- Importação de participantes por Excel com modelo, prévia e tratamento de duplicidades ainda não implementada.
- Edição/reordenação completa de módulos e aulas e seleção manual de capa ainda não implementadas na nova interface.
- Prova, NPS, certificado e comentários do aluno continuam acessíveis pelo fluxo clássico; a integração visual completa desses fluxos está pendente. A administração já possui resumo e respostas de comentários.
- O visualizador central da aula prioriza vídeo e capa; PDF/imagem também estão disponíveis como materiais, mas a experiência de alternar formatos no painel central ainda precisa ser concluída.
- Página editorial de artigos vinculados ao LinkedIn pendente; existe link institucional externo.
- Pagamentos seguem desativados; não há provedor de checkout configurado.
- Perfil e configurações têm opções limitadas, principalmente em leitura.

## Publicação e preservação

Esta revisão altera somente a branch do PR Draft. Não modifica `main`, o site hospedado, o compartilhamento privado ou bancos hospedados. Não adiciona nem executa GitHub Actions, Jobs ou Workflows e não provisiona serviços pagos.

O item 17.1 do documento fornecido estabelece: “Merge, migrações hospedadas e publicação só após revisão técnica e autorização.” O aceite da primeira turma permanece pendente enquanto os passos operacionais acima não forem realizados. A meta é 25/10/2026; o treinamento está previsto para 31/10/2026.
