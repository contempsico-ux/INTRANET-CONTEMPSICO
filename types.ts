export enum Profile {
  Gestao = "Gestão",
  Colaborador = "Colaborador",
  Psicologo = "Psicólogo",
}

export enum Visibility {
  Gestao = "Gestão",
  Colaborador = "Colaborador",
  Psicologo = "Psicólogo",
  Todos = "Todos",
}

export interface User {
  id: string;
  name: string;
  profile: Profile;
  email: string;
  password?: string; // Should not be stored in frontend state, but needed for mock
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  visibility: Profile[];
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  status: "Fechado" | "Funcionamento Normal";
  isHoliday?: boolean;
}

export enum TaskStatus {
  Pendente = "Pendente",
  EmAndamento = "Em Andamento",
  Concluida = "Concluída",
  Arquivada = "Arquivada",
}

export enum TaskPriority {
  Baixa = "Baixa",
  Media = "Média",
  Alta = "Alta",
}

export enum TaskType {
  GestaoDocumentosPaciente = "Gestão de Documentos de Paciente",
  GestaoDocumentosColaborador = "Gestão de Documentos (Colaborador)",
  SolicitacaoDocumentosProfissional = "Solicitação de Documentos (Profissional)",
  SugerirMelhoriaProcedimento = "Sugerir Melhoria de Procedimento",
  ApontarErroProcedimento = "Apontar erro em Procedimento",
  ApontarErroRecorrenteProcedimento = "Apontar erro recorrente em Procedimento",
  SolicitarNovaTarefaNaoUrgente = "Solicitar Nova Tarefa (Não Urgente)",
  ExecutarTarefaRotina = "Executar Tarefa de Rotina",
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  requester: string;
  assignedTo?: string[];
  creationDate: string;
  conclusionDate?: string;
  startDate?: string;
  endDate?: string;
  subtasks?: Subtask[];
  // Dynamic fields based on type
  patientName?: string;
  // New fields for attachments and reports
  attachmentUrl?: string;
  attachmentPath?: string; // To store the file path for deletion
  conclusionNotes?: string;
}

export enum MaterialType {
  Video = "Vídeo",
  PDF = "PDF",
  Outro = "Outro",
}

export interface TrainingMaterial {
  id: string;
  title: string;
  description: string;
  type: MaterialType;
  url: string; // URL for video or PDF
  filePath?: string; // To store the file path for deletion
  category: string;
}

export interface RegulationSection {
  id: string;
  title: string;
  content: string;
  visibility: Profile[];
}

export interface UsefulLink {
  id: string;
  title: string;
  url: string;
  category: string;
  visibility: Profile[];
}

export interface ServicePrice {
  id: string;
  serviceName: string;
  description: string;
  value: number;
  visibility: Profile[];
}

export interface Psychologist {
  id: string;
  name: string;
  crp: string;
  phone: string;
  email: string;
  specialty: string;
  cpf: string;
  graduationUniversity: string;
  specializationUniversity: string;
  theoreticalApproach: string;
}