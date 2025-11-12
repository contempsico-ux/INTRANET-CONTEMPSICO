# Guia de Configuração do GitHub

## Passo 1: Criar o Repositório no GitHub

1. Acesse: https://github.com/new
2. Faça login com a conta **contempsico-ux**
3. Configure o repositório:
   - **Repository name**: `intranet-contempsico`
   - **Description**: `Sistema de intranet corporativa para gestão de comunicados, calendário, tarefas e recursos`
   - **Visibility**: 
     - ✅ **Private** (recomendado para projeto interno)
     - ou **Public** (se desejar código aberto)
   - **NÃO marque** "Initialize this repository with:"
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
4. Clique em **Create repository**

## Passo 2: Fazer Push do Código Local

Após criar o repositório, você verá instruções na tela. Execute os seguintes comandos no terminal:

```bash
cd /home/ubuntu/intranet-contempsico

# Adicionar o repositório remoto
git remote add origin https://github.com/contempsico-ux/intranet-contempsico.git

# Renomear branch para main (padrão do GitHub)
git branch -M main

# Fazer push do código
git push -u origin main
```

### Autenticação durante o Push

Quando solicitar credenciais:
- **Username**: `contempsico-ux`
- **Password**: Use o token que você criou anteriormente

**IMPORTANTE**: No campo "Password", cole o **token**, não a senha da sua conta GitHub!

## Passo 3: Verificar o Repositório

Após o push bem-sucedido:
1. Acesse: https://github.com/contempsico-ux/intranet-contempsico
2. Verifique se todos os arquivos foram enviados
3. O repositório está pronto para deploy!

## Próximos Passos

Após o código estar no GitHub:
1. ✅ Código versionado no GitHub
2. ⏳ Configurar Supabase (seguir SUPABASE-CONFIG.md)
3. ⏳ Deploy no Vercel
4. ⏳ Testar aplicação em produção

## Troubleshooting

### Erro: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/contempsico-ux/intranet-contempsico.git
```

### Erro de autenticação
- Certifique-se de usar o **token** como senha, não a senha da conta
- Verifique se o token tem as permissões corretas (repo)

### Erro: "Updates were rejected"
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```
