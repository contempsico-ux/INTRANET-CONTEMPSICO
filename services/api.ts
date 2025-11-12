import { createClient } from '@supabase/supabase-js';
import {
  Announcement, CalendarEvent, Task, ServicePrice, Psychologist, TaskStatus, Profile, TrainingMaterial, RegulationSection, UsefulLink, User
} from '../types';

// --- SUPABASE CLIENT SETUP ---
// Configuration based on the user's Supabase project.
const supabaseUrl = 'https://whxpryptjitmnburgvsx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeHByeXB0aml0bW5idXJndnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTE4ODQsImV4cCI6MjA3ODI4Nzg4NH0.YFhj2MlFqmoGwXVXcoiuXmDHHmuX-1Kwb1DisCTvjlk';

// A bucket for storing all user-uploaded files.
// IMPORTANT: You must create this bucket in your Supabase project dashboard
// and set its access policy (e.g., make it public for read access).
const STORAGE_BUCKET = 'arquivos-da-intranet';

// Initialize the Supabase client.
// The `export` allows us to use this client instance in other files, like App.tsx for auth listeners.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// --- HELPER FUNCTION ---
// A helper to handle potential errors from Supabase queries.
const handleSupabaseError = ({ error, data, entityName }: { error: any, data: any, entityName: string }) => {
  if (error) {
    console.error(`Error in ${entityName}:`, error);
    throw new Error(`Não foi possível realizar a operação em ${entityName}. Detalhe: ${error.message}`);
  }
  return data;
};

// --- FILE STORAGE API ---
export const uploadFile = async (file: File): Promise<{ publicUrl: string, path: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado para upload.");

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const path = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file);

  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    throw new Error("Falha no upload do arquivo.");
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  if (!urlData?.publicUrl) {
      throw new Error("Não foi possível obter a URL pública do arquivo.");
  }

  return { publicUrl: urlData.publicUrl, path };
};

export const deleteFile = async (path: string): Promise<void> => {
    if (!path) return;
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) {
        // Log the error but don't throw, as the primary DB operation might succeed
        // and we don't want to block UI updates for a failed storage cleanup.
        console.error("Error deleting file from storage:", error);
    }
};

// --- AUTH API ---
/**
 * Authenticates a user and fetches their profile from the 'users' table.
 * Assumes you have a public 'users' table with columns matching the User type.
 * The user's ID in this table must match their auth.users.id.
 */
export const login = async (email: string, password: string): Promise<User> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
        // Log the detailed error from Supabase for debugging purposes
        console.error("Supabase authentication error:", authError);
        // Throw the specific Supabase error message instead of a generic one.
        throw new Error(authError.message);
    }
    if (!authData.user) throw new Error("Authentication failed, no user returned.");

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (userError || !userData) throw new Error("Perfil do usuário não encontrado ou inacessível.");
    
    return userData as User;
};

export const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`Falha ao sair: ${error.message}`);
};

/**
 * Fetches the user profile data based on a user ID.
 * This is used to hydrate the app state after the auth state changes.
 */
export const getUserProfile = async (userId: string): Promise<User> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
    if (error || !data) throw new Error("Perfil do usuário não encontrado.");
    return data as User;
}

// --- DATA APIs ---

// Mural API
// RLS Policy Example: Enable read access for all authenticated users.
// RLS Policy Example: Enable insert access only for users with 'Gestão' profile.
export const getAnnouncements = async (): Promise<Announcement[]> => {
  const { data, error } = await supabase.from('announcements').select('*').order('date', { ascending: false });
  return handleSupabaseError({ data, error, entityName: 'recados' });
};

export const addAnnouncement = async (post: Omit<Announcement, 'id' | 'date' | 'author'>): Promise<Announcement> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const newPostData = { ...post, author: user.email }; // or fetch user name
  const { data, error } = await supabase.from('announcements').insert(newPostData).select().single();
  return handleSupabaseError({ data, error, entityName: 'recados' });
};

// Calendario API
// RLS Policy Example: Enable read for all authenticated. Enable insert/update/delete for 'Gestão' profile.
export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  const { data, error } = await supabase.from('calendar_events').select('*');
  return handleSupabaseError({ data, error, entityName: 'eventos do calendário' });
};

export const addCalendarEvent = async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
    const { data, error } = await supabase.from('calendar_events').insert(event).select().single();
    return handleSupabaseError({ data, error, entityName: 'eventos do calendário' });
};

// Tarefas API
// RLS Policy Suggestion: This is more complex.
// - 'Gestão' can SELECT, INSERT, UPDATE, DELETE all tasks.
// - Other profiles can SELECT tasks where their user ID is in the 'assignedTo' array.
// - Other profiles can UPDATE tasks assigned to them (e.g., change status, add notes).
export const getTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase.from('tasks').select('*').order('creationDate', { ascending: false });
  return handleSupabaseError({ data, error, entityName: 'tarefas' });
};

export const addTask = async (task: Omit<Task, 'id' | 'status' | 'creationDate' | 'requester'>, requester: User): Promise<Task> => {
  const newTaskData: Omit<Task, 'id'> = {
    ...task,
    status: TaskStatus.Pendente,
    creationDate: new Date().toISOString(),
    requester: requester.name,
  };
  const { data, error } = await supabase.from('tasks').insert(newTaskData).select().single();
  return handleSupabaseError({ data, error, entityName: 'tarefas' });
};

export const updateTask = async (updatedTask: Task): Promise<Task> => {
  const { id, ...taskData } = updatedTask;
  const { data, error } = await supabase.from('tasks').update(taskData).eq('id', id).select().single();
  return handleSupabaseError({ data, error, entityName: 'tarefas' });
}

export const deleteTask = async (taskId: string): Promise<void> => {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  handleSupabaseError({ data: {}, error, entityName: 'tarefas' });
}

export const getAssignableUsers = async (): Promise<User[]> => {
    // FIX: Select all user fields to match the User type and avoid potential runtime errors.
    const { data, error } = await supabase.from('users').select('*');
    return handleSupabaseError({ data, error, entityName: 'usuários' });
};

// --- RECURSOS API --- (All should have RLS policies similar to Calendar)

// Treinamentos
export const getTrainings = async (): Promise<TrainingMaterial[]> => {
  const { data, error } = await supabase.from('trainings').select('*');
  return handleSupabaseError({ data, error, entityName: 'treinamentos' });
};
export const addTraining = async (training: Omit<TrainingMaterial, 'id'>): Promise<TrainingMaterial> => {
  const { data, error } = await supabase.from('trainings').insert(training).select().single();
  return handleSupabaseError({ data, error, entityName: 'treinamentos' });
};
export const updateTraining = async (updated: TrainingMaterial): Promise<TrainingMaterial> => {
  const { id, ...updateData } = updated;
  const { data, error } = await supabase.from('trainings').update(updateData).eq('id', id).select().single();
  return handleSupabaseError({ data, error, entityName: 'treinamentos' });
};
export const deleteTraining = async (id: string): Promise<void> => {
  const { error } = await supabase.from('trainings').delete().eq('id', id);
  handleSupabaseError({ data: {}, error, entityName: 'treinamentos' });
};

// Regulamento
export const getRegulations = async (): Promise<RegulationSection[]> => {
  const { data, error } = await supabase.from('regulations').select('*');
  return handleSupabaseError({ data, error, entityName: 'regulamento' });
};
export const addRegulation = async (reg: Omit<RegulationSection, 'id'>): Promise<RegulationSection> => {
  const { data, error } = await supabase.from('regulations').insert(reg).select().single();
  return handleSupabaseError({ data, error, entityName: 'regulamento' });
};
export const updateRegulation = async (updated: RegulationSection): Promise<RegulationSection> => {
  const { id, ...updateData } = updated;
  const { data, error } = await supabase.from('regulations').update(updateData).eq('id', id).select().single();
  return handleSupabaseError({ data, error, entityName: 'regulamento' });
};
export const deleteRegulation = async (id: string): Promise<void> => {
  const { error } = await supabase.from('regulations').delete().eq('id', id);
  handleSupabaseError({ data: {}, error, entityName: 'regulamento' });
};

// Links Úteis
export const getLinks = async (): Promise<UsefulLink[]> => {
  const { data, error } = await supabase.from('useful_links').select('*');
  return handleSupabaseError({ data, error, entityName: 'links' });
};
export const addLink = async (link: Omit<UsefulLink, 'id'>): Promise<UsefulLink> => {
  const { data, error } = await supabase.from('useful_links').insert(link).select().single();
  return handleSupabaseError({ data, error, entityName: 'links' });
};
export const updateLink = async (updated: UsefulLink): Promise<UsefulLink> => {
  const { id, ...updateData } = updated;
  const { data, error } = await supabase.from('useful_links').update(updateData).eq('id', id).select().single();
  return handleSupabaseError({ data, error, entityName: 'links' });
};
export const deleteLink = async (id: string): Promise<void> => {
  const { error } = await supabase.from('useful_links').delete().eq('id', id);
  handleSupabaseError({ data: {}, error, entityName: 'links' });
};

// Preços
export const getServices = async (): Promise<ServicePrice[]> => {
  const { data, error } = await supabase.from('services').select('*');
  return handleSupabaseError({ data, error, entityName: 'serviços' });
};
export const addService = async (service: Omit<ServicePrice, 'id'>): Promise<ServicePrice> => {
  const { data, error } = await supabase.from('services').insert(service).select().single();
  return handleSupabaseError({ data, error, entityName: 'serviços' });
};
export const updateService = async (updated: ServicePrice): Promise<ServicePrice> => {
  const { id, ...updateData } = updated;
  const { data, error } = await supabase.from('services').update(updateData).eq('id', id).select().single();
  return handleSupabaseError({ data, error, entityName: 'serviços' });
};
export const deleteService = async (id: string): Promise<void> => {
  const { error } = await supabase.from('services').delete().eq('id', id);
  handleSupabaseError({ data: {}, error, entityName: 'serviços' });
};

// Psis
export const getPsychologists = async (): Promise<Psychologist[]> => {
    const { data, error } = await supabase.from('psychologists').select('*');
    return handleSupabaseError({ data, error, entityName: 'psicólogos' });
};
export const addPsychologist = async (psi: Omit<Psychologist, 'id'>): Promise<Psychologist> => {
    const { data, error } = await supabase.from('psychologists').insert(psi).select().single();
    return handleSupabaseError({ data, error, entityName: 'psicólogos' });
};
export const updatePsychologist = async (updated: Psychologist): Promise<Psychologist> => {
  const { id, ...updateData } = updated;
  const { data, error } = await supabase.from('psychologists').update(updateData).eq('id', id).select().single();
  return handleSupabaseError({ data, error, entityName: 'psicólogos' });
};
export const deletePsychologist = async (id: string): Promise<void> => {
  const { error } = await supabase.from('psychologists').delete().eq('id', id);
  handleSupabaseError({ data: {}, error, entityName: 'psicólogos' });
};