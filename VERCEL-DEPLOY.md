# Guia de Deploy no Vercel

Este documento fornece instruções detalhadas para fazer o deploy da Intranet ContempSico no Vercel.

## Pré-requisitos

Antes de começar, certifique-se de que:
- ✅ O código está no GitHub (repositório: `contempsico-ux/intranet-contempsico`)
- ✅ O banco de dados Supabase está configurado (seguir `SUPABASE-CONFIG.md`)
- ✅ Você tem uma conta no Vercel (criar em https://vercel.com)

## Passo 1: Importar Projeto no Vercel

1. Acesse: https://vercel.com/new
2. Faça login com sua conta (pode usar a mesma conta do GitHub)
3. Clique em **Import Git Repository**
4. Selecione o repositório: **contempsico-ux/intranet-contempsico**
   - Se não aparecer, clique em **Adjust GitHub App Permissions** para dar acesso ao Vercel

## Passo 2: Configurar o Projeto

Na tela de configuração do projeto:

### Framework Preset
- O Vercel detectará automaticamente: **Vite**
- ✅ Mantenha a detecção automática

### Project Name
- Nome: `intranet-contempsico` (ou personalize)
- Isso definirá a URL: `https://intranet-contempsico.vercel.app`

### Root Directory
- Deixe como: `./` (raiz do projeto)

### Build and Output Settings
O Vercel configurará automaticamente:
- **Build Command**: `npm run build` ou `vite build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

✅ **NÃO precisa alterar nada aqui!**

### Environment Variables (Variáveis de Ambiente)

**IMPORTANTE**: As credenciais do Supabase já estão no código (`services/api.ts`), então você tem duas opções:

#### Opção 1: Usar as credenciais já configuradas no código (Mais Simples)
- Não adicione nenhuma variável de ambiente
- O deploy funcionará com as credenciais que já estão no arquivo `api.ts`

#### Opção 2: Usar variáveis de ambiente (Mais Seguro - Recomendado)
Se preferir usar variáveis de ambiente:

1. Clique em **Add Environment Variable**
2. Adicione as seguintes variáveis:

```
VITE_SUPABASE_URL = https://whxpryptjitmnburgvsx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeHByeXB0aml0bW5idXJndnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTE4ODQsImV4cCI6MjA3ODI4Nzg4NH0.YFhj2MlFqmoGwXVXcoiuXmDHHmuX-1Kwb1DisCTvjlk
```

**E depois**, atualize o arquivo `services/api.ts`:

```typescript
// Substituir estas linhas:
const supabaseUrl = 'https://whxpryptjitmnburgvsx.supabase.co';
const supabaseAnonKey = 'eyJhbGc...';

// Por estas:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://whxpryptjitmnburgvsx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGc...';
```

## Passo 3: Deploy

1. Clique em **Deploy**
2. Aguarde o processo de build (geralmente 1-2 minutos)
3. Quando concluir, você verá a mensagem: **"Congratulations! Your project has been deployed"**

## Passo 4: Acessar a Aplicação

Após o deploy bem-sucedido:

1. Acesse a URL fornecida pelo Vercel (ex: `https://intranet-contempsico.vercel.app`)
2. Faça login com as credenciais criadas no Supabase
3. Teste todas as funcionalidades

## Passo 5: Configurar Domínio Personalizado (Opcional)

Se você tem um domínio próprio (ex: `intranet.contempsico.com.br`):

1. No dashboard do Vercel, vá em **Settings** > **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio: `intranet.contempsico.com.br`
4. Siga as instruções para configurar os DNS

### Configuração DNS

No seu provedor de domínio (Registro.br, GoDaddy, etc.), adicione:

**Tipo A**:
```
Nome: intranet (ou @)
Valor: 76.76.21.21
```

**Tipo CNAME**:
```
Nome: www
Valor: cname.vercel-dns.com
```

## Passo 6: Configurar Deploy Automático

O Vercel já configura deploy automático por padrão:

- ✅ Cada push na branch `main` dispara um novo deploy automaticamente
- ✅ Pull Requests geram preview deployments
- ✅ Rollback fácil para versões anteriores

## Monitoramento e Logs

### Ver Logs de Build
1. No dashboard do Vercel, clique no projeto
2. Vá em **Deployments**
3. Clique em qualquer deploy para ver os logs

### Ver Logs de Runtime
1. No dashboard, vá em **Logs**
2. Veja erros em tempo real

## Troubleshooting

### Erro: "Build failed"
- Verifique os logs de build no Vercel
- Certifique-se de que `npm run build` funciona localmente
- Verifique se todas as dependências estão no `package.json`

### Erro: "Cannot connect to Supabase"
- Verifique se as credenciais do Supabase estão corretas
- Verifique se o banco de dados foi configurado (SUPABASE-CONFIG.md)
- Verifique se as tabelas foram criadas

### Página em branco após deploy
- Abra o Console do navegador (F12) para ver erros
- Verifique se há erros de CORS
- Verifique se o Supabase está acessível

### Erro 404 ao recarregar página
O Vercel já configura automaticamente o SPA routing para Vite, mas se tiver problemas:

1. Crie um arquivo `vercel.json` na raiz:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Otimizações Recomendadas

### 1. Configurar Cache
O Vercel já otimiza automaticamente, mas você pode ajustar em `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. Habilitar Analytics
1. No dashboard do Vercel, vá em **Analytics**
2. Clique em **Enable Analytics**
3. Monitore performance e uso

### 3. Configurar Proteção por Senha (Opcional)
Para proteger a aplicação antes do lançamento oficial:

1. Vá em **Settings** > **Environment Variables**
2. Adicione:
```
VERCEL_PASSWORD = sua-senha-aqui
```

## Atualizações Futuras

Para atualizar a aplicação:

1. Faça alterações no código localmente
2. Commit e push para o GitHub:
```bash
git add .
git commit -m "Descrição das alterações"
git push origin main
```
3. O Vercel fará deploy automaticamente!

## URLs Importantes

- **Aplicação**: https://intranet-contempsico.vercel.app
- **Dashboard Vercel**: https://vercel.com/contempsico-ux/intranet-contempsico
- **Repositório GitHub**: https://github.com/contempsico-ux/intranet-contempsico
- **Supabase Dashboard**: https://supabase.com/dashboard

## Suporte

- Documentação Vercel: https://vercel.com/docs
- Documentação Vite: https://vitejs.dev
- Documentação Supabase: https://supabase.com/docs

---

**Pronto!** Sua intranet está no ar! 🚀
