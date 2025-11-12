-- =====================================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS SUPABASE
-- Intranet ContempSico
-- =====================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA DE USUÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    profile TEXT NOT NULL CHECK (profile IN ('Gestão', 'Colaborador', 'Psicólogo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem ler todos os usuários
CREATE POLICY "Usuários autenticados podem ler users"
    ON public.users FOR SELECT
    TO authenticated
    USING (true);

-- Política: Apenas Gestão pode inserir novos usuários
CREATE POLICY "Apenas Gestão pode inserir users"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND profile = 'Gestão'
        )
    );

-- Política: Usuários podem atualizar seus próprios dados OU Gestão pode atualizar qualquer um
CREATE POLICY "Users podem atualizar próprios dados ou Gestão pode atualizar todos"
    ON public.users FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND profile = 'Gestão'
    ));

-- =====================================================
-- 2. TABELA DE COMUNICADOS (MURAL)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    visibility TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Política: Todos autenticados podem ler
CREATE POLICY "Todos autenticados podem ler announcements"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (true);

-- Política: Apenas Gestão pode inserir
CREATE POLICY "Apenas Gestão pode inserir announcements"
    ON public.announcements FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND profile = 'Gestão'
        )
    );

-- Política: Apenas Gestão pode atualizar
CREATE POLICY "Apenas Gestão pode atualizar announcements"
    ON public.announcements FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND profile = 'Gestão'
        )
    );

-- Política: Apenas Gestão pode deletar
CREATE POLICY "Apenas Gestão pode deletar announcements"
    ON public.announcements FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND profile = 'Gestão'
        )
    );

-- =====================================================
-- 3. TABELA DE EVENTOS DO CALENDÁRIO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Fechado', 'Funcionamento Normal')),
    "isHoliday" BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para calendar_events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Política: Todos autenticados podem ler
CREATE POLICY "Todos autenticados podem ler calendar_events"
    ON public.calendar_events FOR SELECT
    TO authenticated
    USING (true);

-- Política: Apenas Gestão pode inserir
CREATE POLICY "Apenas Gestão pode inserir calendar_events"
    ON public.calendar_events FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND profile = 'Gestão'
        )
    );

-- Política: Apenas Gestão pode atualizar
CREATE POLICY "Apenas Gestão pode atualizar calendar_events"
    ON public.calendar_events FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND profile = 'Gestão'
        )
    );

-- Política: Apenas Gestão pode deletar
CREATE POLICY "Apenas Gestão pode deletar calendar_events"
    ON public.calendar_events FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND profile = 'Gestão'
        )
    );

-- =====================================================
-- 4. TABELA DE TAREFAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Andamento', 'Concluída', 'Arquivada')),
    priority TEXT NOT NULL CHECK (priority IN ('Baixa', 'Média', 'Alta')),
    requester TEXT NOT NULL,
    "assignedTo" TEXT[] DEFAULT '{}',
    "creationDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "conclusionDate" TIMESTAMP WITH TIME ZONE,
    "startDate" TIMESTAMP WITH TIME ZONE,
    "endDate" TIMESTAMP WITH TIME ZONE,
    subtasks JSONB,
    "patientName" TEXT,
    "attachmentUrl" TEXT,
    "attachmentPath" TEXT,
    "conclusionNotes" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Política: Gestão pode ver todas as tarefas
CREATE POLICY "Gestão pode ver todas tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND profile = 'Gestão'
        )
    );

-- Política: Usuários podem ver tarefas atribuídas a eles
CREATE POLICY "Usuários podem ver tasks atribuídas a eles"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (
        auth.uid()::text = ANY("assignedTo")
    );

-- Política: Todos autenticados podem inserir tarefas
CREATE POLICY "Todos autenticados podem inserir tasks"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política: Gestão pode atualizar todas as tarefas
CREATE POLICY "Gestão pode atualizar todas tasks"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND profile = 'Gestão'
        )
    );

-- Política: Usuários podem atualizar tarefas atribuídas a eles
CREATE POLICY "Usuários podem atualizar tasks atribuídas a eles"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (
        auth.uid()::text = ANY("assignedTo")
    );

-- Política: Apenas Gestão pode deletar tarefas
CREATE POLICY "Apenas Gestão pode deletar tasks"
    ON public.tasks FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND profile = 'Gestão'
        )
    );

-- =====================================================
-- 5. TABELA DE TREINAMENTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.trainings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Vídeo', 'PDF', 'Outro')),
    url TEXT NOT NULL,
    "filePath" TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para trainings
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ler trainings"
    ON public.trainings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Apenas Gestão pode inserir trainings"
    ON public.trainings FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

CREATE POLICY "Apenas Gestão pode atualizar trainings"
    ON public.trainings FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

CREATE POLICY "Apenas Gestão pode deletar trainings"
    ON public.trainings FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

-- =====================================================
-- 6. TABELA DE REGULAMENTO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.regulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    visibility TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para regulations
ALTER TABLE public.regulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ler regulations"
    ON public.regulations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Apenas Gestão pode inserir regulations"
    ON public.regulations FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

CREATE POLICY "Apenas Gestão pode atualizar regulations"
    ON public.regulations FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

CREATE POLICY "Apenas Gestão pode deletar regulations"
    ON public.regulations FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

-- =====================================================
-- 7. TABELA DE LINKS ÚTEIS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.useful_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL,
    visibility TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para useful_links
ALTER TABLE public.useful_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ler useful_links"
    ON public.useful_links FOR SELECT TO authenticated USING (true);

CREATE POLICY "Apenas Gestão pode inserir useful_links"
    ON public.useful_links FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

CREATE POLICY "Apenas Gestão pode atualizar useful_links"
    ON public.useful_links FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

CREATE POLICY "Apenas Gestão pode deletar useful_links"
    ON public.useful_links FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

-- =====================================================
-- 8. TABELA DE SERVIÇOS (PREÇOS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "serviceName" TEXT NOT NULL,
    description TEXT NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    visibility TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ler services"
    ON public.services FOR SELECT TO authenticated USING (true);

CREATE POLICY "Apenas Gestão pode inserir services"
    ON public.services FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

CREATE POLICY "Apenas Gestão pode atualizar services"
    ON public.services FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

CREATE POLICY "Apenas Gestão pode deletar services"
    ON public.services FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

-- =====================================================
-- 9. TABELA DE PSICÓLOGOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.psychologists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    crp TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    specialty TEXT NOT NULL,
    cpf TEXT NOT NULL,
    "graduationUniversity" TEXT NOT NULL,
    "specializationUniversity" TEXT NOT NULL,
    "theoreticalApproach" TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para psychologists
ALTER TABLE public.psychologists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ler psychologists"
    ON public.psychologists FOR SELECT TO authenticated USING (true);

CREATE POLICY "Apenas Gestão pode inserir psychologists"
    ON public.psychologists FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

CREATE POLICY "Apenas Gestão pode atualizar psychologists"
    ON public.psychologists FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

CREATE POLICY "Apenas Gestão pode deletar psychologists"
    ON public.psychologists FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND profile = 'Gestão'));

-- =====================================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_profile ON public.users(profile);
CREATE INDEX IF NOT EXISTS idx_announcements_date ON public.announcements(date DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks USING GIN("assignedTo");
CREATE INDEX IF NOT EXISTS idx_tasks_creation_date ON public.tasks("creationDate" DESC);

-- =====================================================
-- DADOS INICIAIS (EXEMPLO)
-- =====================================================
-- IMPORTANTE: Após criar um usuário via Supabase Auth,
-- você precisa inserir manualmente na tabela users.
-- Exemplo (substitua o UUID pelo ID real do usuário criado):
-- 
-- INSERT INTO public.users (id, name, email, profile)
-- VALUES 
--   ('UUID-DO-USUARIO-CRIADO', 'Admin', 'admin@contempsico.com', 'Gestão');

-- =====================================================
-- CONFIGURAÇÃO DO STORAGE BUCKET
-- =====================================================
-- Execute no Supabase Dashboard > Storage:
-- 1. Criar bucket chamado 'intranet-files'
-- 2. Tornar o bucket público para leitura
-- 3. Configurar políticas de upload apenas para usuários autenticados
--
-- Política de INSERT no bucket (executar no SQL Editor):
-- 
-- CREATE POLICY "Usuários autenticados podem fazer upload"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'intranet-files');
--
-- CREATE POLICY "Todos podem ler arquivos"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'intranet-files');
--
-- CREATE POLICY "Usuários podem deletar próprios arquivos"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'intranet-files' AND auth.uid()::text = (storage.foldername(name))[1]);
