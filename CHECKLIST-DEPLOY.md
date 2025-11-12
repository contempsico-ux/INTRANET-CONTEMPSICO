# ✅ Checklist de Deploy - Intranet ContempSico

Use este checklist para garantir que todos os passos foram executados corretamente.

## 📋 Fase 1: Preparação Local

- [x] Código extraído e analisado
- [x] Repositório Git inicializado
- [x] Commit inicial criado
- [x] Documentação criada

## 🗄️ Fase 2: Configuração do Supabase

### 2.1 Criar/Verificar Projeto Supabase
- [ ] Acessar https://supabase.com/dashboard
- [ ] Verificar projeto: `whxpryptjitmnburgvsx`
- [ ] Confirmar URL: `https://whxpryptjitmnburgvsx.supabase.co`

### 2.2 Executar Script SQL
- [ ] Abrir **SQL Editor** no Supabase
- [ ] Copiar conteúdo de `supabase-setup.sql`
- [ ] Executar script completo
- [ ] Verificar se todas as 9 tabelas foram criadas

### 2.3 Configurar Storage
- [ ] Ir em **Storage** > **Create bucket**
- [ ] Nome do bucket: `intranet-files`
- [ ] Marcar como **Public bucket**
- [ ] Executar políticas de storage no SQL Editor

### 2.4 Criar Usuário Inicial
- [ ] Ir em **Authentication** > **Users** > **Add user**
- [ ] Email: `admin@contempsico.com` (ou outro)
- [ ] Criar senha segura
- [ ] Marcar **Auto Confirm User**
- [ ] Copiar o **User UID**
- [ ] Inserir dados na tabela `users` via SQL:
```sql
INSERT INTO public.users (id, name, email, profile)
VALUES ('UUID-COPIADO', 'Administrador', 'admin@contempsico.com', 'Gestão');
```

### 2.5 Verificar Configuração
- [ ] Executar query de verificação:
```sql
SELECT * FROM public.users;
```
- [ ] Confirmar que o usuário aparece na lista

## 🐙 Fase 3: GitHub

### 3.1 Criar Repositório
- [ ] Acessar https://github.com/new
- [ ] Login como: `contempsico-ux`
- [ ] Nome: `intranet-contempsico`
- [ ] Descrição: `Sistema de intranet corporativa para gestão de comunicados, calendário, tarefas e recursos`
- [ ] Visibilidade: **Private** (recomendado)
- [ ] **NÃO** marcar opções de inicialização
- [ ] Clicar em **Create repository**

### 3.2 Push do Código
- [ ] Executar no terminal:
```bash
cd /home/ubuntu/intranet-contempsico
git remote add origin https://github.com/contempsico-ux/intranet-contempsico.git
git branch -M main
git push -u origin main
```
- [ ] Usar credenciais:
  - Username: `contempsico-ux`
  - Password: [SEU_TOKEN_GITHUB] (use o token criado anteriormente)

### 3.3 Verificar Repositório
- [ ] Acessar: https://github.com/contempsico-ux/intranet-contempsico
- [ ] Confirmar que todos os arquivos estão lá
- [ ] Verificar se README.md está visível

## 🚀 Fase 4: Deploy no Vercel

### 4.1 Importar Projeto
- [ ] Acessar https://vercel.com/new
- [ ] Fazer login (pode usar conta GitHub)
- [ ] Clicar em **Import Git Repository**
- [ ] Selecionar: `contempsico-ux/intranet-contempsico`

### 4.2 Configurar Deploy
- [ ] Framework: **Vite** (detectado automaticamente)
- [ ] Project Name: `intranet-contempsico`
- [ ] Root Directory: `./`
- [ ] Build Command: `npm run build` (automático)
- [ ] Output Directory: `dist` (automático)

### 4.3 Variáveis de Ambiente (Opcional)
**Opção 1**: Não adicionar (usar credenciais do código)
- [ ] Pular esta etapa

**Opção 2**: Adicionar variáveis (mais seguro)
- [ ] Adicionar `VITE_SUPABASE_URL`
- [ ] Adicionar `VITE_SUPABASE_ANON_KEY`
- [ ] Atualizar `services/api.ts` para usar variáveis

### 4.4 Executar Deploy
- [ ] Clicar em **Deploy**
- [ ] Aguardar build (1-2 minutos)
- [ ] Verificar se build foi bem-sucedido

### 4.5 Verificar Aplicação
- [ ] Acessar URL fornecida (ex: `https://intranet-contempsico.vercel.app`)
- [ ] Testar login com credenciais do Supabase
- [ ] Verificar se a página carrega corretamente

## 🧪 Fase 5: Testes

### 5.1 Autenticação
- [ ] Fazer login com usuário criado
- [ ] Verificar se nome aparece no header
- [ ] Fazer logout
- [ ] Fazer login novamente

### 5.2 Funcionalidades Básicas
- [ ] Acessar **Mural**
- [ ] Acessar **Calendário**
- [ ] Acessar **Tarefas**
- [ ] Acessar **Recursos**

### 5.3 Permissões (como Gestão)
- [ ] Tentar criar um comunicado
- [ ] Tentar criar um evento no calendário
- [ ] Tentar criar uma tarefa
- [ ] Verificar se uploads funcionam

### 5.4 Criar Usuários de Teste
- [ ] Criar usuário **Colaborador** no Supabase
- [ ] Criar usuário **Psicólogo** no Supabase
- [ ] Testar login com cada perfil
- [ ] Verificar permissões diferentes

## 📊 Fase 6: Pós-Deploy

### 6.1 Documentação
- [ ] Compartilhar URL da aplicação com equipe
- [ ] Compartilhar credenciais de acesso
- [ ] Documentar processo de criação de novos usuários

### 6.2 Monitoramento
- [ ] Configurar Vercel Analytics (opcional)
- [ ] Verificar logs de erro no Vercel
- [ ] Monitorar uso do Supabase

### 6.3 Segurança
- [ ] Revisar políticas RLS no Supabase
- [ ] Confirmar que bucket está com permissões corretas
- [ ] Verificar se repositório está privado (se necessário)

### 6.4 Backup
- [ ] Fazer backup do script SQL
- [ ] Documentar credenciais em local seguro
- [ ] Salvar token do GitHub em local seguro

## 🎯 Fase 7: Melhorias Futuras (Opcional)

- [ ] Configurar domínio personalizado (ex: `intranet.contempsico.com.br`)
- [ ] Adicionar logo da empresa
- [ ] Personalizar cores do tema
- [ ] Configurar email templates no Supabase
- [ ] Adicionar recuperação de senha
- [ ] Implementar notificações
- [ ] Adicionar relatórios e dashboards

## 📞 Suporte e Recursos

### URLs Importantes
- **Aplicação**: https://intranet-contempsico.vercel.app
- **GitHub**: https://github.com/contempsico-ux/intranet-contempsico
- **Supabase**: https://supabase.com/dashboard
- **Vercel**: https://vercel.com/dashboard

### Documentação
- `README.md` - Visão geral do projeto
- `SUPABASE-CONFIG.md` - Configuração do banco de dados
- `GITHUB-SETUP.md` - Configuração do GitHub
- `VERCEL-DEPLOY.md` - Deploy no Vercel
- `supabase-setup.sql` - Script SQL completo

### Contatos
- Suporte Supabase: https://supabase.com/support
- Suporte Vercel: https://vercel.com/support
- Documentação React: https://react.dev

---

## ✨ Status Final

Quando todos os itens estiverem marcados:

**🎉 PARABÉNS! Sua Intranet ContempSico está no ar!**

Próximos passos:
1. Treinar equipe no uso do sistema
2. Criar usuários para todos os colaboradores
3. Começar a usar o sistema no dia a dia
4. Coletar feedback e implementar melhorias

---

**Data de Deploy**: ___/___/______
**Responsável**: _________________
**URL Produção**: _________________
