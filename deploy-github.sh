#!/bin/bash

echo "=========================================="
echo "Deploy Intranet ContempSico para GitHub"
echo "=========================================="
echo ""

# Verificar se já existe remote origin
if git remote | grep -q "origin"; then
    echo "✓ Remote 'origin' já configurado"
else
    echo "Configurando remote 'origin'..."
    git remote add origin https://github.com/contempsico-ux/intranet-contempsico.git
    echo "✓ Remote configurado"
fi

# Renomear branch para main
echo "Renomeando branch para 'main'..."
git branch -M main

# Fazer push
echo ""
echo "Fazendo push para GitHub..."
echo "Quando solicitar credenciais:"
echo "  Username: contempsico-ux"
echo "  Password: [USE O TOKEN, NÃO A SENHA]"
echo ""

git push -u origin main

echo ""
echo "=========================================="
echo "Deploy concluído!"
echo "=========================================="
echo "Acesse: https://github.com/contempsico-ux/intranet-contempsico"
