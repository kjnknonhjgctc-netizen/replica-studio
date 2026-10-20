# Delux: configurar Supabase

O app usa Supabase Auth para cadastro/login e recuperação de senha, e o banco Supabase para perfis, preferências, objetivos, etapas, missões, planejamento, eventos, notificações e conversas. A implementação usa a API REST/Auth do Supabase com a chave pública; não é necessário adicionar uma dependência de cliente ao bundle.

## 1. Configuração do projeto

1. Em Supabase → Project Settings → API, copie a Project URL e a chave pública publishable (sb_publishable_...).
2. Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY nas variáveis de ambiente do Lovable e em qualquer ambiente de build/deploy. Esses valores ficam visíveis no navegador; use apenas a chave pública. VITE_SUPABASE_ANON_KEY (chave anon JWT legada) também é aceita como alternativa.
3. Nunca use service_role ou qualquer chave secreta com prefixo VITE_.
4. Mantenha LOVABLE_API_KEY como segredo de servidor para as chamadas do assistente.

Se essas duas variáveis públicas não estiverem configuradas, o app mostrará um erro explícito de configuração em vez de gravar os dados pessoais no servidor de demonstração.

## 2. Criar as tabelas e ativar RLS

Execute supabase/migrations/20261019000000_initial_schema.sql no SQL Editor do projeto Supabase. Ela cria as tabelas de perfis, preferências, objetivos, diagnósticos, etapas, missões, atividade, conversas, mensagens e notificações, com políticas RLS para limitar as linhas ao usuário autenticado.

A migração não cria nem altera tabelas de cobrança/assinatura.

## 3. Configurar Auth e recuperação de senha

Em Authentication → URL Configuration, configure a Site URL do app e adicione as URLs de redirecionamento permitidas:
- a URL raiz do app;
- https://SEU-DOMINIO/redefinir-senha (substitua pelo domínio real; use a mesma origem em desenvolvimento).

O cadastro entra imediatamente no app quando o Supabase devolve uma sessão. Se a confirmação de e-mail estiver habilitada, o app pede ao usuário que confirme o endereço antes de entrar. O callback de confirmação e o fluxo de recuperação de senha são tratados pela camada de autenticação do app.

Para a recuperação funcionar em produção, configure um provedor SMTP confiável em Authentication → SMTP Settings e teste o recebimento do link. A tela /redefinir-senha só aceita alteração de senha a partir de uma sessão criada pelo fluxo de recuperação.

## 4. Dados existentes e assinaturas

Dados que estejam apenas no localStorage de uma versão anterior não são migrados automaticamente para o Supabase. Antes de remover qualquer dado legado, exporte-o e planeje a migração das contas existentes.

Os métodos e a tela de assinatura foram deliberadamente mantidos fora desta etapa, conforme o escopo. Essa parte ainda usa o caminho legado de demonstração; não considere o estado apresentado por ele uma cobrança real nem use esse fluxo como integração de pagamentos de produção. O schema Supabase desta etapa não contém tabela de assinaturas.

## 5. Checklist antes de publicar

- [ ] Configurar VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente certo.
- [ ] Aplicar a migration SQL no projeto Supabase.
- [ ] Conferir as políticas RLS e as URLs permitidas do Auth.
- [ ] Testar cadastro, login, renovação de sessão e recuperação de senha em domínio de teste.
- [ ] Testar duas contas diferentes e confirmar que uma não consegue ler nem alterar os dados da outra.
- [ ] Testar onboarding, objetivos/diagnósticos/etapas, missões, planejamento, notificações e conversas com dados reais.
- [ ] Confirmar backup, monitoramento e processo de exclusão/privacidade.
- [ ] Migrar separadamente os dados locais antigos e implementar cobrança real antes de qualquer lançamento comercial.

A integração de cliente não pode aplicar a migration no projeto Supabase conectado nem ler seus segredos automaticamente. Esses passos precisam ser verificados no painel do projeto e no ambiente de deploy.
