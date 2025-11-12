# Guia de Configuração do Supabase

Este documento fornece instruções detalhadas para configurar o banco de dados Supabase para a Intranet ContempSico.

## Passo 1: Acessar o Projeto Supabase

O código já possui as credenciais configuradas para o projeto:
- **URL**: `https://whxpryptjitmnburgvsx.supabase.co`
- **Anon Key**: Já configurada no código

Acesse o dashboard do Supabase em: https://supabase.com/dashboard

## Passo 2: Executar o Script SQL

1. No dashboard do Supabase, vá para **SQL Editor** (ícone de banco de dados na barra lateral)
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `supabase-setup.sql`
4. Cole no editor SQL
5. Clique em **Run** (ou pressione Ctrl+Enter)

Isso criará todas as tabelas necessárias com as políticas de segurança (RLS - Row Level Security).

## Passo 3: Configurar o Storage Bucket

### 3.1 Criar o Bucket

1. No dashboard, vá para **Storage** (ícone de pasta na barra lateral)
2. Clique em **Create a new bucket**
3. Configure:
   - **Name**: `intranet-files`
   - **Public bucket**: ✅ Marque esta opção (para permitir leitura pública)
4. Clique em **Create bucket**

### 3.2 Configurar Políticas do Bucket

Volte ao **SQL Editor** e execute o seguinte script:

```sql
-- Política para permitir upload de usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'intranet-files');

-- Política para permitir leitura pública
CREATE POLICY "Todos podem ler arquivos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'intranet-files');

-- Política para permitir que usuários deletem seus próprios arquivos
CREATE POLICY "Usuários podem deletar próprios arquivos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'intranet-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Passo 4: Criar Usuário Inicial

### 4.1 Criar Usuário via Authentication

1. No dashboard, vá para **Authentication** > **Users**
2. Clique em **Add user** > **Create new user**
3. Preencha:
   - **Email**: `admin@contempsico.com` (ou o email desejado)
   - **Password**: Crie uma senha segura
   - **Auto Confirm User**: ✅ Marque esta opção
4. Clique em **Create user**
5. **IMPORTANTE**: Copie o **User UID** que aparece na lista de usuários

### 4.2 Inserir Dados do Usuário na Tabela

Volte ao **SQL Editor** e execute (substituindo o UUID):

```sql
INSERT INTO public.users (id, name, email, profile)
VALUES 
  ('UUID-COPIADO-DO-PASSO-ANTERIOR', 'Administrador', 'admin@contempsico.com', 'Gestão');
```

**Exemplo**:
```sql
INSERT INTO public.users (id, name, email, profile)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Administrador', 'admin@contempsico.com', 'Gestão');
```

## Passo 5: Verificar Configuração

Execute as seguintes queries para verificar se tudo está correto:

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar se o usuário foi inserido
SELECT * FROM public.users;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Passo 6: Testar Autenticação

Você pode testar a autenticação localmente antes de fazer o deploy:

1. No terminal, navegue até a pasta do projeto
2. Execute: `npm install`
3. Execute: `npm run dev`
4. Acesse `http://localhost:5173`
5. Faça login com as credenciais criadas

## Estrutura de Perfis e Permissões

O sistema possui 3 perfis de usuário com diferentes permissões:

### **Gestão**
- Acesso total a todas as funcionalidades
- Pode criar, editar e deletar:
  - Comunicados (Mural)
  - Eventos do Calendário
  - Tarefas
  - Materiais de Treinamento
  - Regulamento
  - Links Úteis
  - Tabela de Preços
  - Dados dos Psicólogos
  - Usuários do sistema

### **Colaborador**
- Pode visualizar conteúdos permitidos
- Pode criar tarefas
- Pode atualizar tarefas atribuídas a ele
- Não pode deletar ou criar recursos administrativos

### **Psicólogo**
- Pode visualizar conteúdos permitidos
- Pode criar tarefas
- Pode atualizar tarefas atribuídas a ele
- Não pode deletar ou criar recursos administrativos

## Próximos Passos

Após concluir esta configuração:
1. ✅ Banco de dados configurado
2. ⏳ Criar repositório GitHub
3. ⏳ Deploy no Vercel
4. ⏳ Configurar variáveis de ambiente no Vercel (se necessário)

## Troubleshooting

### Erro: "relation does not exist"
- Verifique se o script SQL foi executado completamente
- Verifique se há erros no SQL Editor

### Erro: "new row violates row-level security policy"
- Verifique se as políticas RLS foram criadas corretamente
- Verifique se o usuário está autenticado
- Verifique se o perfil do usuário está correto

### Erro ao fazer upload de arquivos
- Verifique se o bucket `intranet-files` foi criado
- Verifique se as políticas do storage foram aplicadas
- Verifique se o bucket está configurado como público

### Não consigo fazer login
- Verifique se o usuário foi criado no Authentication
- Verifique se o usuário foi inserido na tabela `users`
- Verifique se o UUID corresponde entre auth.users e public.users
- Verifique se a opção "Auto Confirm User" estava marcada
