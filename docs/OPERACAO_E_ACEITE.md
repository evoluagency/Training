# Operação e aceite — Evolu Training

Objetivo: versão operacional até 25/10/2026 para o treinamento de 31/10/2026. Datas são marcos de entrega; não há execução agendada em segundo plano.

## Sequência de preparação

1. Abrir https://training.evolu.ink/acesso e entrar com o e-mail e a senha da conta proprietária na Supabase. Confirmar que o painel mostra Administração.
2. Cadastrar as empresas e definir o número de vagas.
3. Criar o catálogo, treinamento, módulos e aulas. Definir carga horária, tempo de prova, nota mínima, tentativas e emissão de certificado.
4. Anexar vídeos, PDFs e imagens. Em cada aula, indicar se os formatos são equivalentes ou complementares.
5. Cadastrar as questões e revisar as alternativas corretas antes de publicar. O conteúdo publicado fica congelado.
6. Vincular o treinamento às empresas autorizadas.
7. Reservar as vagas com nome para certificado, cargo, e-mail, WhatsApp opcional e perfil (participante/gestor).
8. Em Participantes, usar Configurar acesso para definir o acesso inicial e entregar a senha por canal privado. Nenhum convite ou mensagem é enviado automaticamente. A recuperação por e-mail exige as URLs corretas na Supabase; consultar RECUPERACAO_ACESSO.md.
9. Vincular o treinamento à empresa, abrir a aula do módulo desejado e cadastrar ali a planilha, arquivo ou link da aula. Escolher a empresa e, se necessário, o participante específico. A biblioteca Ferramentas continua aceitando itens gerais sem aula. Links externos obedecem às permissões do serviço de destino; a plataforma não amplia essas permissões.
10. Realizar a validação abaixo com uma conta real de participante antes do treinamento.

## Validação necessária até 25/10

| Verificação | Evidência necessária |
| --- | --- |
| Administrador | Login real abre o painel; criar empresa e catálogo persiste após recarregar. |
| Página inicial | Em celular e desktop: navegação, contraste e acesso por e-mail e senha. |
| Vitrine | Cursos rascunho e publicados sem aprovação ficam invisíveis; apenas cursos explicitamente marcados aparecem. |
| Redirecionamento | Ao clicar em curso listado, login leva a `/area?course=ID` e respeita o vínculo com a empresa. |
| Participante convidado | Conta com e-mail cadastrado abre somente os cursos da própria empresa. |
| Isolamento | Outra empresa e conta não convidada não acessam materiais, comentários ou resultados. |
| Vídeo/PDF/imagem | Abrir os formatos reais, avançar o vídeo e verificar download de arquivo. |
| Ferramenta da aula | Link e arquivo aparecem dentro da aula correta e apenas para a empresa autorizada. |
| Ferramenta individual | Destinatário acessa o arquivo; colega sem autorização não acessa; revogar o treinamento retira o acesso. |
| Prova | Iniciar, salvar respostas, recarregar, finalizar e conferir nota e limite de tentativas. |
| Prazo | Fechar e reabrir a página não reinicia o tempo. Após o prazo, considerar apenas respostas salvas. |
| NPS | Responder ou pular; uma nota baixa não altera a aprovação. |
| Certificado | Aprovação e etapa de pesquisa permitem emissão; reprovação não permite. Conferir nome, horas, curso e impressão. |
| Comentários | Participante publica dúvida; administrador responde na mesma empresa. |
| Gestor | Visualiza apenas relatórios da empresa vinculada. |
| Dispositivos | Ensaiar o fluxo em computador e celular dos participantes. |

## Informações ainda necessárias

- Empresa(s), quantidade de participantes e lista de e-mails autorizados.
- Nome, cargo e, se utilizado, WhatsApp de cada participante.
- Nome do treinamento, material final e organização dos módulos.
- Questões, alternativas corretas, tempo de prova, nota mínima e tentativas.
- Carga horária e identificação do emissor no certificado.
- Planilhas, links e definição de quem poderá acessar cada ferramenta.

## Evidências técnicas

Os testes automatizados cobrem acesso, vagas, isolamento, prazo, correção, NPS, emissão idempotente, comentários e ferramentas. A migração foi validada com PostgreSQL local e com login, autorização e upload/download privado no backend Supabase hospedado. Os testes de recuperação cobrem confirmação por POST, origem, links inválidos e sessão de recuperação em outro navegador.

O login externo, convites, reprodução dos vídeos reais e ensaio completo por uma conta de participante são condições para declarar a turma pronta. A confirmação de publicação não substitui esse aceite.

## Página inicial e identidade — revisão antes da publicação

A tela `/` recebe a landing editorial. O treinamento fica em `/area` e usa Supabase Auth por e-mail e senha. A página pública não concede acesso aos materiais privados; o vínculo com a empresa é verificado no servidor. Os cursos só podem aparecer na vitrine após publicação e aprovação manual do administrador, conforme [diretriz visual e técnica](EVOLU_TRAINING_HOME_DESIGN_V1.md). O logotipo oficial EVOLU e as nove imagens fornecidas estão no repositório e na publicação.
