# EVOLU Training — Sistema de identidade visual v1
Data: 21/10/2026 · Escopo: site institucional, catálogo de cursos, autenticação e área do aluno

## Referências verificadas e origem

- Perfil Instagram oficial informado pelo responsável: **@evolu.ink**. Conexão social Metricool da marca **evolu.ink** confirmada, com Instagram conectado.
- Página institucional no LinkedIn: **https://www.linkedin.com/company/evoluagency/**, mesma EVOLU.
- Identidade editorial já aprovada pelo responsável: `Guia_Editorial_EVOLU_v1.md` e materiais próprios da marca como `Visao_Geral_Carrossel_EVOLU.png` e `Banner corporativo EVOLU com globo digital.png`.
- Originais do lettering EVOLU fornecidos pelo responsável em 11/10/2026: versões preta e branca (`1000228174.png` e `1000228173.png`).
- Não usar resultados de busca referentes a outras marcas homônimas (Evolu-e, Evolu promoções, Evoluum etc.).
- A leitura direta da grade do Instagram pode exigir autenticação; **não afirmar inspeção exaustiva de todas as postagens**. O sistema abaixo deriva também dos originais e do guia editorial anteriormente aprovados.

## Assinatura e aplicação da marca

- O lettering **EVOLU** é uma marca gráfica oficial. **Nunca redesenhar o logo com texto CSS/HTML**, alterar glifos ou criar uma variante AI; também não acrescentar ponto final ou extensão de domínio.
- Arquivos de marca incorporados: `public/brand/evolu-white.png` e `public/brand/evolu-black.png`. São derivados por recorte e tratamento de transparência a partir dos originais fornecidos (não vetorização ou recriação). Devem manter forma, proporção e área de segurança.
- Use o branco em fundos escuros e o preto em fundos claros. O texto `Training` aparece *separado* após o lettering, nunca como parte integrante do logo.
- Favicon atual continua abstrato do produto Training; não deve ser tratado como logotipo registrado da EVOLU.

## Linguagem visual

| Elemento | Regra |
| --- | --- |
| Fonte | Montserrat em títulos, corpo, navegação e interface |
| Preto base | `#090B0C` (fundos escuros e áreas institucionais) |
| Off-white | `#F5F5F2` / `#FBFBF8` |
| Branco de texto | `#FFFFFF` e texto secundário `#C9CBC6` |
| Verde-limão de destaque | `#D8FC63`, usado de forma pontual em etiquetas, navegação ativa, CTAs e sinais em diagramas |
| Divisórias | Cinza escuro em seções pretas, cinza claro nas seções off-white |
| Títulos | Montserrat sem serifa, peso 600–700, contraste alto e linhas curtas |
| Etiquetas | Montserrat 9–11 px, caixa alta, rastreio amplo, chips lima/pretos com contraste |
| Imagens | Fotografias reais/licenciadas (negócios, pessoas em situação de trabalho, tecnologia, indústria, cidades), com eventual tratamento monocromático. Nunca afirmar imagens geradas como documentação real |
| Arte complementar | Linhas de dados, grids e conexões discretas, com função editorial, não ornamento aleatório |
| Cartões | Composição modular, cantos quase retos, hierarquia forte e sem sombras exageradas |
| Responsividade | Preservar legibilidade e densidade informativa em celular; foco visível e movimento reduzido |

## Sistema de composição

1. Header institucional escuro, logo original branco e identificador Training separado.
2. Hero em preto, headline Montserrat de alto contraste e acento verde em etiqueta; área gráfica analítica baseada em conexões de dados, sem seta gigante genérica.
3. Seções editoriais claras, com bordas e ritmo de respiro.
4. Catálogo escuro para criar alternância visual, com cartões nomeados e metadados de cursos reais.
5. Área do aluno: barra lateral preta, logotipo oficial branco, estado selecionado verde-limão. Conteúdo de estudo em papel claro para preservar leitura prolongada.
6. Rodapé claro com o logotipo oficial preto.

## Voz e texto do site

- Linguagem objetiva, empresarial, específica e instrutiva.
- Evitar frases feitas, promessas de resultado sem evidência e conclusão artificial de efeito.
- Não usar textos genéricos de marketing para descrever o treinamento; cada curso deve apresentar público, escopo, carga horária, objetivos e aplicação.
- Não confundir as **áreas temáticas** com cursos efetivamente vendidos/publicados.

## Privacidade e produto

A apresentação visual não modifica autenticação ou autorização. Página inicial pode ter visitantes anônimos **somente se a hospedagem permitir**. `/area` continua protegida por identidade ChatGPT Sites e os dados acadêmicos exigem vaga da empresa. O conteúdo do catálogo só fica visível se curso publicado e aprovado pelo administrador (`show_on_home=1`).

## Pendências e critérios de aceite

- [x] Logotipos oficiais preto e branco integrados ao código-fonte na branch Draft.
- [x] Tipografia e cores de referência aplicadas ao layout institucional e navegação interna.
- [x] Arte analítica da hero substitui seta genérica.
- [ ] Renderizar e conferir visualmente desktop, tablet e celular no runtime real.
- [ ] Validar que as fontes remotas carregam com CSP do ambiente hospedado e que fallback preserva hierarquia.
- [ ] Conferir logotipo em tamanhos reais e densidades de tela, contraste e área de segurança.
- [ ] Executar suíte de testes, auditoria de acessibilidade e regressões.
- [ ] Aprovar identidade e navegação antes de merge/deploy.
- [ ] Validar catálogo e login no domínio hospedado; PR Draft não é publicação.

**Política de custo:** nenhuma alteração de deploy, orçamento, Actions, Jobs, Workflows ou serviços pagos é autorizada por esta identidade.
