# EVOLU Training — Home orientada a conteúdo real

**Data:** 30/10/2026  
**Escopo:** página inicial pública, catálogos, treinamentos e visibilidade de módulos.  
**Branch:** `feat/training-dynamic-home-20261030` — não publicar sem validação.

## Princípio

A interface não cria catálogos, setores, treinamentos ou módulos fictícios. O cadastro administrativo é a única origem das informações relacionadas à formação.

Componentes estruturais mantidos: logo e identidade EVOLU, banner institucional, navegação, botões de acesso, instruções estáticas de uso, rodapé e ferramenta existente `/simulador`. Nenhum desses componentes cria um curso fictício.

## Regras de exibição

| Cadastro | Quando aparece na home | Dados exibidos |
|---|---|---|
| Catálogo / área | Existe pelo menos um curso cadastrado nele com `status='published'` e `show_on_home=1` | Título, descrição real (se informada), imagem do curso/catálogo disponível e quantidade real de cursos visíveis |
| Treinamento | Está publicado e foi explicitamente liberado pelo administrador para a vitrine | Título, descrição (quando cadastrada), horas, categoria, capa, lista de módulos |
| Módulo | Pertence a curso publicado e liberado para a vitrine | Somente título e posição; nunca aulas, provas, arquivos, links internos ou dados de aluno |
| Catálogo vazio / privado | Não aparece | Nenhuma seção ilustrativa |
| Curso em rascunho, revisão, arquivado, desativado ou sem autorização para home | Não aparece | Nenhum dado |
| Módulo inexistente | Não aparece | Nem contagem, nem lista fictícia |
| Falha de consulta | Informação de indisponibilidade apenas | Não renderizar conteúdo de exemplo nem assumir que o catálogo está vazio |

## Alimentação automática

1. O administrador registra o catálogo, os cursos e os módulos.
2. O curso somente entra na home após publicação e opção *Exibir na página inicial*.
3. Os dados são consultados no servidor a cada acesso à home (`force-dynamic`, `cache:'no-store'`).
4. Os catálogos são agrupados por registros reais. Não há lista fixa de áreas ou limite `slice(0,4)`.
5. Alterações em módulos e metadados de cursos que já estejam liberados são refletidas após serem salvas, conforme as regras de edição e publicação.
6. A retirada da autorização de vitrine remove imediatamente o curso da consulta pública; se era o último curso público da categoria, a categoria também desaparece.

## Privacidade

- Consulta SQL restringe duas vezes a divulgação de cursos e módulos a `published + show_on_home=1`.
- A API não retorna dados de empresa, vagas, colaboradores, prova, conteúdo integral da aula nem materiais privados.
- Os títulos dos módulos são **metadados públicos** apenas quando o curso está autorizado; não equivalem a abrir o material completo ao visitante.
- A entrada da plataforma e os endpoints privados continuam protegidos pela autenticação Supabase e pelos vínculos corporativos.
- O agrupador de categorias é compatível com a versão anterior da API durante deploy gradual; nomes e imagens permanecem provenientes dos registros reais.

## Arquivos atualizados

- `lib/training/public-catalog.ts` — consulta pública validada e títulos dos módulos.
- `lib/training/public-home.ts` — agrupamento real por catálogo, sem placeholders.
- `app/page.tsx` — renderização condicional de catálogos, cursos e módulos.
- `app/home-reference.css` — adaptação responsiva preservando identidade aprovada.
- `tests/training.test.ts` — testes de autorização, filtragem e ausência de conteúdo fictício.

## Critérios de aceite

- [x] Nenhum catálogo/curso/módulo fictício escrito na home.
- [x] Cursos sem autorização não aparecem na consulta pública.
- [x] Lista de módulos exige vínculo com curso publicado/opt-in.
- [x] Catálogos sem cursos públicos desaparecem da home.
- [x] Vitrine sem limite artificial de quatro treinamentos.
- [x] Banner, acesso, simulador e identidade mantidos.
- [ ] Executar testes automatizados e build completo em ambiente controlado.
- [ ] Publicar conjuntamente função Supabase Edge e site Vercel após aceite.
- [ ] Verificar no ambiente hospedado a criação/edição/publicação/revogação em tempo real.
- [ ] Inspecionar visualmente desktop/mobile com catálogos vazios, um curso e múltiplos cursos.

**Nenhuma migração de schema, novo serviço pago, Action ou Workflow é necessário para este ajuste.**
