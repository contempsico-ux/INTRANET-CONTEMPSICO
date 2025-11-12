# Intranet ContempSico

Sistema de intranet corporativa desenvolvido para gestão de comunicados, calendário, tarefas e recursos da empresa ContempSico.

## 🚀 Tecnologias

- **React** 19.2.0 com TypeScript
- **Vite** 6.2.0 (Build tool)
- **Supabase** (Backend as a Service)
  - Authentication
  - PostgreSQL Database
  - Storage
- **Tailwind CSS** (via classes inline)

## 📋 Funcionalidades

### Sistema de Autenticação
Autenticação segura via Supabase Auth com três perfis de usuário:
- **Gestão**: Acesso total ao sistema
- **Colaborador**: Acesso limitado a funcionalidades específicas
- **Psicólogo**: Acesso limitado a funcionalidades específicas

### Módulos Principais

#### 1. Mural
Publicação de comunicados internos com controle de visibilidade por perfil de usuário.

#### 2. Calendário
Gestão de eventos, feriados e status de funcionamento da empresa.

#### 3. Tarefas
Sistema completo de gestão de tarefas com:
- 8 tipos diferentes de tarefas
- Status: Pendente, Em Andamento, Concluída, Arquivada
- Prioridades: Baixa, Média, Alta
- Atribuição de tarefas a múltiplos usuários
- Subtarefas
- Upload de anexos
- Notas de conclusão

#### 4. Recursos
Módulo que agrupa diversos recursos:
- **Treinamentos**: Vídeos, PDFs e outros materiais de capacitação
- **Regulamento**: Seções do regulamento interno
- **Links Úteis**: Links categorizados para recursos externos
- **Tabela de Preços**: Serviços e valores praticados
- **Dados dos Psicólogos**: Cadastro completo dos profissionais
- **Relatório de Produtividade**: Análises e métricas

## 🛠️ Configuração do Projeto

### Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- Conta no GitHub (para versionamento)
- Conta no Vercel (para deploy)

### Instalação Local

1. Clone o repositório:
```bash
git clone https://github.com/SEU-USUARIO/intranet-contempsico.git
cd intranet-contempsico
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o banco de dados Supabase seguindo o guia em `SUPABASE-CONFIG.md`

4. Execute o projeto em modo de desenvolvimento:
```bash
npm run dev
```

5. Acesse `http://localhost:5173` no navegador

### Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

## 📦 Estrutura do Projeto

```
intranet-contempsico/
├── components/          # Componentes reutilizáveis
│   ├── Header.tsx
│   ├── Icons.tsx
│   ├── Sidebar.tsx
│   └── UI.tsx
├── features/           # Módulos principais
│   ├── Login.tsx
│   ├── Mural.tsx
│   ├── Calendario.tsx
│   ├── Tarefas.tsx
│   ├── Recursos.tsx
│   └── recursos/       # Sub-módulos de Recursos
│       ├── DadosPsis.tsx
│       ├── LinksUteis.tsx
│       ├── Regulamento.tsx
│       ├── RelatorioProdutividade.tsx
│       ├── TabelaPrecos.tsx
│       └── Treinamentos.tsx
├── services/           # Integração com APIs
│   ├── api.ts         # Cliente Supabase e funções de API
│   └── mockData.ts    # Dados de exemplo (não utilizado)
├── App.tsx            # Componente principal
├── index.tsx          # Entry point
├── types.ts           # Definições TypeScript
├── index.html         # HTML base
├── package.json       # Dependências
├── tsconfig.json      # Configuração TypeScript
├── vite.config.ts     # Configuração Vite
└── README.md          # Este arquivo
```

## 🗄️ Banco de Dados

O sistema utiliza Supabase como backend. A estrutura completa do banco de dados está documentada em:
- `supabase-setup.sql` - Script SQL para criação das tabelas
- `SUPABASE-CONFIG.md` - Guia completo de configuração

### Tabelas Principais

- `users` - Usuários do sistema
- `announcements` - Comunicados do mural
- `calendar_events` - Eventos do calendário
- `tasks` - Tarefas
- `trainings` - Materiais de treinamento
- `regulations` - Regulamento interno
- `useful_links` - Links úteis
- `services` - Tabela de preços
- `psychologists` - Dados dos psicólogos

### Storage

O sistema utiliza o Supabase Storage para armazenamento de arquivos:
- Bucket: `intranet-files`
- Uso: Anexos de tarefas e materiais de treinamento

## 🚀 Deploy

### Deploy no Vercel

1. Faça push do código para o GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Importe o repositório
4. Configure as variáveis de ambiente (se necessário)
5. Deploy automático!

O Vercel detectará automaticamente que é um projeto Vite e configurará o build corretamente.

### Variáveis de Ambiente

As credenciais do Supabase já estão configuradas no código (`services/api.ts`). Se desejar usar variáveis de ambiente:

1. Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua-url-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

2. Atualize o arquivo `services/api.ts` para usar as variáveis:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

3. Configure as mesmas variáveis no Vercel (Settings > Environment Variables)

## 🔒 Segurança

O sistema implementa Row Level Security (RLS) no Supabase para garantir que:
- Usuários só acessem dados permitidos para seu perfil
- Gestão tenha controle total
- Colaboradores e Psicólogos tenham acesso limitado
- Arquivos sejam protegidos por autenticação

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Preview do build de produção

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário da ContempSico.

## 📞 Suporte

Para questões e suporte, entre em contato com a equipe de TI da ContempSico.

---

Desenvolvido com ❤️ para ContempSico
