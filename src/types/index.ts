// Tipos principais do sistema Tarefeiro Pro

export type TaskStatus = 'para_fazer' | 'fazendo' | 'aguardando_retorno' | 'feito' | 'longo_prazo';

export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export type TaskType = 'tarefa' | 'evento';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  role: 'admin' | 'user';
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  color: string;
  createdAt: Date;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  comments: Comment[];
  comment?: string; // Comentário simples da subtarefa (máx 70 chars)
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
  mentions: string[]; // IDs dos usuários mencionados
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: User;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  dueDate?: Date;
  originalDueDate?: Date; // Data de vencimento original (antes de prorrogações)
  extensionCount?: number; // Número de prorrogações realizadas
  lastExtensionDate?: Date; // Data da última prorrogação
  extensionReason?: string; // Motivo da última prorrogação
  startTime?: string; // Para eventos
  endTime?: string; // Para eventos
  clientId?: string;
  assignedTo: User[];
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  subtasks: Subtask[];
  comments: Comment[];
  attachments: Attachment[];
  isVisibleToAll: boolean;
  tags: string[];
}

export interface ViewMode {
  type: 'kanban' | 'list' | 'agenda';
  filters: {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    clientId?: string;
    assignedTo?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    search?: string;
  };
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'title' | 'completedAt';
  sortOrder?: 'asc' | 'desc';
}

export type AgendaView = 'daily' | 'weekly';