# Categorias por setor e editor responsivo — 24/10/2026

## Organização

Categoria representa um setor da empresa. Curso reúne módulos, aulas e materiais; avaliação e certificado continuam vinculados ao curso. A tela `/admin/categorias` cadastra e edita setores, apresenta a quantidade de cursos e abre o catálogo filtrado.

A implementação reutiliza a tabela de catálogos como categorias, preservando as referências existentes. O backend aceita os nomes antigos durante a publicação gradual. A categoria não concede acesso: participantes continuam vendo apenas cursos ativos liberados para sua empresa e filtros derivados desses cursos.

## Conteúdo e celular

O campo de categoria está disponível na criação e na estrutura do curso. No formulário de edição de aula é possível escolher outro módulo do mesmo curso editável. A operação altera somente o vínculo e a posição da aula; mantém a identidade dos materiais e ferramentas.

“Criar aula a partir de PDF” cria uma aula. “Adicionar material à aula” complementa a aula selecionada. A distinção evita transformar materiais complementares em aulas por engano.

O editor usa a largura disponível no painel para alternar entre uma e duas colunas. Em largura reduzida, aulas e materiais ficam empilhados, e nomes longos quebram a linha. O viewport móvel usa a largura do dispositivo e permite zoom.

## Validação

- TypeScript e build de produção Next.js aprovados.
- 45 testes aprovados, incluindo SQLite, PostgreSQL, armazenamento privado, isolamento entre empresas, categorias e movimentação de aulas com preservação do PDF.
- Percurso visual em ambiente local isolado: criar e editar categoria, trocar a categoria de um curso e mover uma aula para outro módulo.
- Em painel de 390 px, a lista e os materiais ficam empilhados e o nome longo da aula não se sobrepõe ao conteúdo.
- Na reorganização autorizada do conteúdo existente, os cinco PDFs foram associados aos respectivos módulos de Compras Estratégicas. A leitura posterior confirmou a preservação dos identificadores e metadados dos arquivos. O curso permaneceu em rascunho.

Não foram criados participantes, empresas ou documentos de teste na base de produção. A validação visual com dados sintéticos não substitui uma sessão autenticada de um participante real.
