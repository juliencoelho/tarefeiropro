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
  // Campos para gestão avançada
  isOnline?: boolean;
  lastLogin?: Date;
  lastActivity?: Date;
  approved?: boolean;
  approvedBy?: string; // ID do admin que aprovou
  approvedAt?: Date;
  rejectedAt?: Date; // Data de rejeição
  rejectedBy?: string; // ID do admin que rejeitou
  rejectionReason?: string; // Motivo da rejeição
  createdAt?: Date;
  updatedAt?: Date;
  // Estatísticas de produtividade
  stats?: UserStats;
  // Preferências do usuário
  preferences?: UserPreferences;
}

export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  averageCompletionTime: number; // em horas
  productivityScore: number; // 0-100
  lastWeekTasks: number;
  lastMonthTasks: number;
}

export interface UserPreferences {
  emailNotifications: boolean;
  mentionNotifications: boolean;
  taskNotifications: boolean;
  reportNotifications: boolean;
  approvalNotifications: boolean;
  systemNotifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: 'pt-BR' | 'en-US';
  timezone: string;
}

export interface UserInvite {
  id: string;
  email: string;
  role: 'admin' | 'user';
  invitedBy: string; // ID do usuário que enviou o convite
  invitedAt: Date;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  message?: string;
}

export type NotificationType = 
  | 'task_assigned' 
  | 'task_completed' 
  | 'task_commented' 
  | 'user_mentioned' 
  | 'user_invited' 
  | 'user_approved' 
  | 'user_rejected'
  | 'approval'
  | 'rejection'
  | 'system_update'
  | 'report_ready';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>; // Dados específicos da notificação
  read: boolean;
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string; // URL para ação relacionada
}

export interface UserSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export interface UserFilter {
  search?: string;
  role?: 'admin' | 'user' | 'all';
  status?: 'online' | 'offline' | 'all' | 'approved' | 'pending' | 'rejected';
  onlineStatus?: 'all' | 'online' | 'offline';
  approved?: boolean | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'name' | 'email' | 'lastLogin' | 'createdAt' | 'role';
  sortOrder?: 'asc' | 'desc';
}

export interface Area {
  id: string;
  name: string;
  color: string;
  icon?: string;
  position: number;
  archived: boolean;
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  color: string;
  areaId?: string;
  notes?: string;
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
  areaId?: string;
  contactId?: string;
  plannedFor?: Date; // Dia em que planejei fazer (tela Hoje) — diferente do prazo
  inInbox?: boolean; // Ainda na caixa de entrada, sem triagem
  source?: 'app' | 'cowork'; // Quem criou a tarefa
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