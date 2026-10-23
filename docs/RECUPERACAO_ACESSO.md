# Recuperação de acesso — 23/10/2026

## Causa e configuração exigida

O projeto hospedado manteve o endereço padrão `http://localhost:3000` na configuração Auth. O retorno solicitado pela aplicação não estava autorizado. A mensagem foi enviada, mas o link terminou no endereço local do aparelho do participante.

Em Authentication → URL Configuration, aplicar os valores de `supabase/auth-production.json`. São URLs exatas da aplicação de produção; não autorizar curingas de todos os projetos Vercel. O link usado pelo botão “Esqueci minha senha” agora aponta diretamente para a tela `/acesso/definir-senha` no endereço canônico.

## Compatibilidade com celular e navegador diferente

A solicitação de recuperação usa um cliente Auth isolado, sem persistência nem código PKCE vinculado ao navegador de origem. No e-mail padrão, a Supabase entrega a sessão de recuperação no fragmento do endereço. A tela retira esse fragmento do histórico antes de criar o cliente normal, estabelece a sessão em cookies e verifica o usuário no Auth. Só então oferece os campos de senha, mostrando a conta verificada. Os tokens nunca são registrados, impressos nem incluídos no repositório.

O login normal continua usando Supabase SSR. Após salvar a nova senha, o participante ou administrador segue para a entrada correspondente ao seu perfil. Links inválidos ou expirados apresentam uma orientação em português.

## E-mail com identidade EVOLU

Assunto: **Redefina sua senha | EVOLU Training**.

Modelo HTML: `supabase/templates/recovery.html`. Usar em Authentication → Emails → Reset password, após habilitar o SMTP próprio. O modelo usa o logotipo oficial, base preta/branca, um detalhe verde-limão e texto em português.

O novo projeto está no plano gratuito. Desde 03/06/2026, projetos gratuitos novos com o remetente padrão da Supabase não podem personalizar os templates. É necessário configurar um SMTP próprio; não contratar plano nem ativar serviço pago automaticamente. Nenhuma credencial SMTP está neste repositório.

Fonte: https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier

Quando ativado o modelo personalizado, o botão usa `.SiteURL` e `.TokenHash`. A primeira visita exibe uma confirmação; o token só é consumido após o clique do usuário, por POST. Isso evita que scanners de e-mail consumam antecipadamente o token. A confirmação aceita somente recuperação, exige mesma origem, bloqueia destinos externos e usa respostas sem cache e sem referência de origem.

## Validação e estado

- Seis testes específicos de recuperação aprovados: scanner, confirmação, destino fixo, bloqueio entre origens, token expirado, entradas inválidas e sessão em outro navegador.
- TypeScript e build de produção aprovados.
- Falta aplicar a configuração hospedada de URLs no painel e conectar o SMTP para ativar o e-mail personalizado. O painel exige autenticação própria; a integração disponível não oferece alteração dessas configurações.
- Enviar e testar uma nova recuperação após a aplicação da configuração. Mensagens antigas que apontam para localhost não são corrigidas retroativamente.

Referências: https://supabase.com/docs/guides/auth/auth-email-templates e https://supabase.com/docs/guides/auth/auth-smtp
