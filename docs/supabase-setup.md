# Delux: configurar Supabase

Esta integração prepara a base de autenticação e persistência real do Delux. O projeto atual ainda contém uma API de demonstração em `src/delux/services/localServer.ts`; **não publique para usuários reais até concluir a migração do cliente para Supabase e testar todas as operações**.

## 1. Criar projeto

1. Crie um projeto no Supabase.
2. Em **Project Settings → API**, copie a Project URL e a chave pública/anon (publishable).
3. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis de ambiente do ambiente de desenvolvimento e da hospedagem. O prefixo `VITE_` significa que os valores ficam visíveis no navegador; só use a chave pública.
4. Configure `LOVABLE_API_KEY` como segredo de servidor da hospedagem. Nunca use essa chave no cliente.

## 2. Criar tabelas e regras de segurança

Execute `supabase/migrations/20261019000000_initial_schema.sql` no SQL Editor do projeto Supabase. A migração cria tabelas de perfis, preferências, objetivos, etapas, missões, atividade, conversas, mensagens e notificações, além de políticas RLS por usuário.

A migração **não** cria tabelas de cobrança ou assinaturas.

## 3. Auth e recuperação de senha

Em **Authentication → URL Configuration**, defina a URL do app e as URLs de redirecionamento permitidas. Configure SMTP de produção para que a recuperação de senha envie e-mails reais. Mantenha confirmação de e-mail habilitada em produção.

## 4. Antes de lançar

- Migrar todos os métodos de `src/delux/services/api.ts` para operações autenticadas no Supabase.
- Remover a persistência de senhas e dados pessoais em `localStorage` da API de demonstração.
- Testar isolamento entre duas contas, recuperação de senha, onboarding, metas, missões, planner e conversas.
- Não expor a chave `service_role` no navegador nem no repositório.
- Confirmar backup, limites, monitoramento e políticas de exclusão/privacidade.

O esquema é a primeira etapa de infraestrutura; por si só, não muda o comportamento da aplicação até a camada de serviços ser migrada e as variáveis do projeto real serem configuradas.
