# Operação e aceite — Evolu Training

Objetivo: versão operacional até 25/10/2026 para o treinamento de 31/10/2026. Datas são marcos de entrega; não há execução agendada em segundo plano.

## Sequência de preparação

1. Entrar no Site privado com a conta proprietária. Confirmar que o painel mostra Administração.
2. Cadastrar as empresas e definir o número de vagas.
3. Criar o catálogo, treinamento, módulos e aulas. Definir carga horária, tempo de prova, nota mínima, tentativas e emissão de certificado.
4. Anexar vídeos, PDFs e imagens. Em cada aula, indicar se os formatos são equivalentes ou complementares.
5. Cadastrar as questões e revisar as alternativas corretas antes de publicar. O conteúdo publicado fica congelado.
6. Vincular o treinamento às empresas autorizadas.
7. Reservar as vagas com nome para certificado, cargo, e-mail do ChatGPT, WhatsApp opcional e perfil (participante/gestor).
8. O proprietário deve liberar os e-mails também na lista privada de visitantes do Site. Nenhum convite ou mensagem é enviado pelo formulário da aplicação.
9. Vincular o treinamento à empresa, abrir a aula do módulo desejado e cadastrar ali a planilha, arquivo ou link da aula. Escolher a empresa e, se necessário, o participante específico. A biblioteca Ferramentas continua aceitando itens gerais sem aula. Links externos obedecem às permissões do serviço de destino; a plataforma não amplia essas permissões.
10. Realizar a validação abaixo com uma conta real de participante antes do treinamento.

## Validação necessária até 25/10

| Verificação | Evidência necessária |
| --- | --- |
| Administrador | Login real abre o painel; criar empresa e catálogo persiste após recarregar. |
| Participante convidado | Conta ChatGPT com e-mail cadastrado abre somente os cursos da própria empresa. |
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

Os testes automatizados cobrem acesso, vagas, isolamento, prazo, correção, NPS, emissão idempotente, comentários e ferramentas. Um teste adicional executa D1/R2 localmente e valida upload, leitura protegida, intervalo de vídeo e emissão de certificado com SQL real do runtime.

O login externo, convites, reprodução dos vídeos reais e ensaio completo por uma conta de participante são condições para declarar a turma pronta. A confirmação de publicação não substitui esse aceite.
