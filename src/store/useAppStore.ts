import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Task, Client, Area, User, MonitoringItem, ViewMode, AgendaView, TaskStatus, UserInvite, Notification, UserSession, UserFilter } from '../types';
import { supabase } from '../lib/supabase';
import {
  rowToTask, taskPatchToRow, rowToClient, clientPatchToRow,
  rowToArea, areaPatchToRow, rowToProfile, profilePatchToRow,
  rowToMonitoring, monitoringPatchToRow,
} from '../lib/db';

// crypto.randomUUID só existe em contexto seguro (https/localhost);
// o fallback cobre o acesso pelo IP da rede local em desenvolvimento.
const novoId = (): string =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16));

const usuarioVazio: User = { id: '', name: '', email: '', role: 'admin' };

const upsertById = <T extends { id: string }>(list: T[], item: T): T[] =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

interface AppState {
  // Dados (vêm do Supabase)
  userId: string | null;
  dataLoaded: boolean;
  tasks: Task[];
  clients: Client[];
  areas: Area[];
  monitoringItems: MonitoringItem[];
  users: User[];
  currentUser: User;
  userInvites: UserInvite[];
  notifications: Notification[];
  userSessions: UserSession[];
  
  // UI State
  viewMode: ViewMode;
  agendaView: AgendaView;
  selectedTask: Task | null;
  isTaskModalOpen: boolean;
  isDarkMode: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  isQuickCaptureOpen: boolean;
  
  // User Management UI State
  isUserModalOpen: boolean;
  selectedUser: User | null;
  userFilters: UserFilter;
  
  // Sincronização com o Supabase
  loadAll: (userId: string) => Promise<boolean>;
  subscribeRealtime: () => () => void;
  clearData: () => void;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  
  addArea: (name: string, color: string) => void;
  addMonitoringItem: (item: Omit<MonitoringItem, 'id' | 'createdAt'>) => void;
  updateMonitoringItem: (itemId: string, updates: Partial<MonitoringItem>) => void;
  // Anota algo sobre um item que vive no BasePro/Nexo: cria a linha na primeira vez
  salvarAnotacao: (
    base: Pick<MonitoringItem, 'origem' | 'refExterna' | 'kind' | 'title' | 'reference' | 'amount' | 'expectedDate'>,
    updates: Partial<MonitoringItem>
  ) => void;
  updateArea: (areaId: string, updates: Partial<Area>) => void;

  setClients: (clients: Client[]) => void;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (clientId: string, updates: Partial<Client>) => void;
  deleteClient: (clientId: string) => void;
  
  // User Management Actions
  setUsers: (users: User[]) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string, rejectedBy: string, rejectionReason?: string) => void;
  updateUserAvatar: (avatarUrl: string) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  updateUserCommentsAuthor: (userId: string, newUserData: Partial<User>) => void;
  
  // User Invites Actions
  setUserInvites: (invites: UserInvite[]) => void;
  addUserInvite: (invite: Omit<UserInvite, 'id' | 'createdAt' | 'token' | 'invitedAt' | 'status'>) => void;
  updateUserInvite: (inviteId: string, updates: Partial<UserInvite>) => void;
  deleteUserInvite: (inviteId: string) => void;
  
  // Notifications Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: (userId: string) => void;
  deleteNotification: (notificationId: string) => void;
  
  // User Sessions Actions
  setUserSessions: (sessions: UserSession[]) => void;
  updateUserSession: (userId: string, updates: Partial<UserSession>) => void;
  
  // User Management UI Actions
  setUserModalOpen: (open: boolean) => void;
  setSelectedUser: (user: User | null) => void;
  setUserFilters: (filters: UserFilter) => void;
  
  setViewMode: (viewMode: ViewMode) => void;
  setAgendaView: (agendaView: AgendaView) => void;
  setSelectedTask: (task: Task | null) => void;
  setTaskModalOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setQuickCaptureOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  // Estado inicial
  userId: null,
  dataLoaded: false,
  tasks: [],
  clients: [],
  areas: [],
  monitoringItems: [],
  users: [],
  currentUser: usuarioVazio,
  userInvites: [],
  notifications: [],
  userSessions: [],
  
  viewMode: {
    type: 'kanban',
    filters: {},
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  
  agendaView: 'daily',
  
  selectedTask: null,
  isTaskModalOpen: false,
  isDarkMode: false,
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  isQuickCaptureOpen: false,
  
  // User Management UI State
  isUserModalOpen: false,
  selectedUser: null,
  userFilters: {
    search: '',
    role: undefined,
    status: undefined,
    approved: undefined
  },
  
  // Carga inicial: perfil, áreas, clientes e tarefas do usuário logado
  loadAll: async (userId) => {
    const [profileRes, areasRes, clientsRes, tasksRes, monitoringRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('areas').select('*').order('position'),
      supabase.from('clients').select('*').order('name'),
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('monitoring_items').select('*').order('created_at'),
    ]);
    const error = profileRes.error || areasRes.error || clientsRes.error || tasksRes.error || monitoringRes.error;
    if (error) {
      console.error('Erro ao carregar dados do Supabase', error);
      toast.error('Não foi possível carregar seus dados. Verifique a conexão.');
      return false;
    }
    const owner = rowToProfile(profileRes.data);
    set({
      userId,
      currentUser: owner,
      areas: areasRes.data.map(rowToArea),
      clients: clientsRes.data.map(rowToClient),
      tasks: tasksRes.data.map((row) => rowToTask(row, owner)),
      monitoringItems: monitoringRes.data.map(rowToMonitoring),
      dataLoaded: true,
    });
    return true;
  },

  // Tempo real: o que mudar no banco (outro aparelho, Cowork) aparece na tela.
  // O RLS garante que só chegam linhas do usuário logado.
  subscribeRealtime: () => {
    const channel = supabase
      .channel('dados-do-usuario')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        set((state) => payload.eventType === 'DELETE'
          ? { tasks: state.tasks.filter((t) => t.id !== payload.old.id) }
          : { tasks: upsertById(state.tasks, rowToTask(payload.new, state.currentUser)) });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => {
        set((state) => payload.eventType === 'DELETE'
          ? { clients: state.clients.filter((c) => c.id !== payload.old.id) }
          : { clients: upsertById(state.clients, rowToClient(payload.new)) });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'areas' }, (payload) => {
        set((state) => payload.eventType === 'DELETE'
          ? { areas: state.areas.filter((a) => a.id !== payload.old.id) }
          : { areas: upsertById(state.areas, rowToArea(payload.new)).sort((a, b) => a.position - b.position) });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monitoring_items' }, (payload) => {
        set((state) => payload.eventType === 'DELETE'
          ? { monitoringItems: state.monitoringItems.filter((m) => m.id !== payload.old.id) }
          : { monitoringItems: upsertById(state.monitoringItems, rowToMonitoring(payload.new)) });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        set({ currentUser: rowToProfile(payload.new) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  clearData: () => set({
    userId: null,
    dataLoaded: false,
    tasks: [],
    clients: [],
    areas: [],
    monitoringItems: [],
    currentUser: usuarioVazio,
    selectedTask: null,
    isTaskModalOpen: false,
  }),

  // Actions para tarefas: atualizam a tela na hora e gravam no Supabase em seguida
  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => {
    const newTask = { ...task, id: novoId() } as Task;
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    persistir(supabase.from('tasks').insert(taskPatchToRow(newTask)), get);
  },

  updateTask: (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      )
    }));
    const row = taskPatchToRow(updates);
    if (Object.keys(row).length === 0) return;
    persistir(supabase.from('tasks').update(row).eq('id', taskId), get);
  },

  deleteTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter(task => task.id !== taskId)
    }));
    persistir(supabase.from('tasks').delete().eq('id', taskId), get);
  },

  updateTaskStatus: (taskId, status) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) {
      console.warn(`Task with ID ${taskId} not found`);
      return;
    }

    const patch: Partial<Task> = status === 'feito'
      ? { status, completedAt: new Date() }
      : { status };

    set((state) => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, ...patch, updatedAt: new Date() } : t
      )
    }));
    persistir(supabase.from('tasks').update(taskPatchToRow(patch)).eq('id', taskId), get);
  },

  // Actions para áreas
  addArea: (name, color) => {
    const position = Math.max(-1, ...get().areas.map(a => a.position)) + 1;
    const newArea: Area = { id: novoId(), name, color, position, archived: false, createdAt: new Date() };
    set((state) => ({ areas: [...state.areas, newArea] }));
    persistir(supabase.from('areas').insert(areaPatchToRow(newArea)), get);
  },

  updateArea: (areaId, updates) => {
    set((state) => ({
      areas: state.areas.map(area => area.id === areaId ? { ...area, ...updates } : area)
    }));
    persistir(supabase.from('areas').update(areaPatchToRow(updates)).eq('id', areaId), get);
  },

  // Actions para monitoramento
  addMonitoringItem: (item) => {
    const newItem: MonitoringItem = { ...item, id: novoId(), createdAt: new Date() };
    set((state) => ({ monitoringItems: [...state.monitoringItems, newItem] }));
    persistir(supabase.from('monitoring_items').insert(monitoringPatchToRow(newItem)), get);
  },

  updateMonitoringItem: (itemId, updates) => {
    set((state) => ({
      monitoringItems: state.monitoringItems.map(m => m.id === itemId ? { ...m, ...updates } : m)
    }));
    persistir(supabase.from('monitoring_items').update(monitoringPatchToRow(updates)).eq('id', itemId), get);
  },

  salvarAnotacao: (base, updates) => {
    const existente = get().monitoringItems.find(
      m => m.origem === base.origem && m.refExterna === base.refExterna
    );
    if (existente) {
      get().updateMonitoringItem(existente.id, updates);
    } else {
      get().addMonitoringItem({ ...base, status: 'aberto', ...updates });
    }
  },

  // Actions para clientes
  setClients: (clients) => set({ clients }),

  addClient: (client) => {
    const newClient = { ...client, id: novoId() } as Client;
    set((state) => ({ clients: [...state.clients, newClient] }));
    persistir(supabase.from('clients').insert(clientPatchToRow(newClient)), get);
  },

  updateClient: (clientId, updates) => {
    set((state) => ({
      clients: state.clients.map(client =>
        client.id === clientId ? { ...client, ...updates } : client
      )
    }));
    persistir(supabase.from('clients').update(clientPatchToRow(updates)).eq('id', clientId), get);
  },

  deleteClient: (clientId) => {
    set((state) => ({
      clients: state.clients.filter(client => client.id !== clientId),
      // No banco, client_id vira null (on delete set null); espelha na tela
      tasks: state.tasks.map(task =>
        task.clientId === clientId ? { ...task, clientId: undefined } : task
      )
    }));
    persistir(supabase.from('clients').delete().eq('id', clientId), get);
  },

  // Actions para gestão de usuários
  setUsers: (users) => set({ users }),
  
  addUser: (user) => set((state) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      approved: false,
      isOnline: false,
      lastLogin: undefined,
      lastActivity: new Date(),
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        averageCompletionTime: 0,
        productivityScore: 0,
        lastWeekTasks: 0,
        lastMonthTasks: 0
      }
    };
    
    return {
      users: [...state.users, newUser]
    };
  }),
  
  updateUser: (userId, updates) => set((state) => ({
    users: state.users.map(user => 
      user.id === userId 
        ? { ...user, ...updates, updatedAt: new Date() }
        : user
    )
  })),
  
  deleteUser: (userId) => set((state) => ({
    users: state.users.filter(user => user.id !== userId)
  })),
  
  approveUser: (userId) => set((state) => ({
    users: state.users.map(user => 
      user.id === userId 
        ? { 
            ...user, 
            approved: true, 
            approvedBy: state.currentUser.id,
            approvedAt: new Date(),
            updatedAt: new Date()
          }
        : user
    )
  })),
  
  rejectUser: (userId, rejectedBy, rejectionReason) => set((state) => ({
    users: state.users.map(user => 
      user.id === userId 
        ? { 
            ...user, 
            approved: false, 
            rejectedAt: new Date(), 
            rejectedBy, 
            rejectionReason 
          }
        : user
    )
  })),

  updateUserAvatar: (avatarUrl) => {
    set((state) => ({
      currentUser: { ...state.currentUser, avatar: avatarUrl }
    }));
    const { currentUser } = get();
    persistir(supabase.from('profiles').update(profilePatchToRow({ avatar: avatarUrl })).eq('id', currentUser.id), get);
  },

  updateCurrentUser: (updates) => {
    set((state) => ({
      currentUser: { ...state.currentUser, ...updates }
    }));
    const { currentUser } = get();
    persistir(supabase.from('profiles').update(profilePatchToRow(updates)).eq('id', currentUser.id), get);
  },

  updateUserCommentsAuthor: (userId, newUserData) => {
    const renameAuthor = (comment: Task['comments'][number]) =>
      comment.author.id === userId
        ? { ...comment, author: { ...comment.author, ...newUserData } }
        : comment;
    const hasAuthor = (task: Task) =>
      task.comments.some(c => c.author.id === userId) ||
      task.subtasks.some(st => st.comments.some(c => c.author.id === userId));

    const changed = get().tasks.filter(hasAuthor).map(task => ({
      ...task,
      comments: task.comments.map(renameAuthor),
      subtasks: task.subtasks.map(subtask => ({
        ...subtask,
        comments: subtask.comments.map(renameAuthor)
      }))
    }));
    if (changed.length === 0) return;

    set((state) => ({
      tasks: state.tasks.map(task => changed.find(c => c.id === task.id) ?? task)
    }));
    for (const task of changed) {
      persistir(
        supabase.from('tasks')
          .update(taskPatchToRow({ comments: task.comments, subtasks: task.subtasks }))
          .eq('id', task.id),
        get
      );
    }
  },

  // Actions para convites de usuários
  setUserInvites: (invites) => set({ userInvites: invites }),
  
  addUserInvite: (invite) => set((state) => {
    const newInvite: UserInvite = {
      ...invite,
      id: Date.now().toString(),
      token: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invitedAt: new Date(),
      createdAt: new Date(),
      status: 'pending'
    };
    
    return {
      userInvites: [...state.userInvites, newInvite]
    };
  }),
  
  updateUserInvite: (inviteId, updates) => set((state) => ({
    userInvites: state.userInvites.map(invite => 
      invite.id === inviteId 
        ? { ...invite, ...updates }
        : invite
    )
  })),
  
  deleteUserInvite: (inviteId) => set((state) => ({
    userInvites: state.userInvites.filter(invite => invite.id !== inviteId)
  })),

  // Actions para notificações
  setNotifications: (notifications) => set({ notifications }),
  
  addNotification: (notification) => set((state) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false
    };
    
    return {
      notifications: [...state.notifications, newNotification]
    };
  }),
  
  markNotificationAsRead: (notificationId) => set((state) => ({
    notifications: state.notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true, readAt: new Date() }
        : notification
    )
  })),
  
  markAllNotificationsAsRead: (userId) => set((state) => ({
    notifications: state.notifications.map(notification => 
      notification.userId === userId 
        ? { ...notification, read: true, readAt: new Date() }
        : notification
    )
  })),
  
  deleteNotification: (notificationId) => set((state) => ({
    notifications: state.notifications.filter(notification => notification.id !== notificationId)
  })),

  // Actions para sessões de usuários
  setUserSessions: (sessions) => set({ userSessions: sessions }),
  
  updateUserSession: (userId, updates) => set((state) => ({
    userSessions: state.userSessions.map(session => 
      session.userId === userId 
        ? { ...session, ...updates }
        : session
    )
  })),

  // Actions para UI de gestão de usuários
  setUserModalOpen: (open) => set({ isUserModalOpen: open }),
  setSelectedUser: (user) => set({ selectedUser: user }),
  setUserFilters: (filters) => set({ userFilters: filters }),

  // UI Actions para UI
  setViewMode: (viewMode) => set({ viewMode }),
  setAgendaView: (agendaView) => set({ agendaView }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setTaskModalOpen: (open) => set({ isTaskModalOpen: open }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setQuickCaptureOpen: (open) => set({ isQuickCaptureOpen: open })
    }),
    {
      name: 'tarefeiro-pro-store',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Os dados vivem no Supabase; no navegador ficam só as preferências da tela.
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      // A v1 guardava tarefas e clientes no navegador (antes do Supabase): descarta.
      migrate: (persisted) => {
        const { isDarkMode = false, sidebarCollapsed = false } = (persisted ?? {}) as Partial<AppState>;
        return { isDarkMode, sidebarCollapsed };
      },
    }
  )
);

// Grava no Supabase depois da atualização otimista na tela. Se o banco recusar,
// avisa e recarrega tudo do servidor, para a tela não mostrar algo que não foi salvo.
async function persistir(
  request: PromiseLike<{ error: PostgrestError | null }>,
  get: () => AppState
) {
  const { error } = await request;
  if (!error) return;
  console.error('Erro ao salvar no Supabase', error);
  toast.error('Não foi possível salvar. Recarregando seus dados...');
  const { userId, loadAll } = get();
  if (userId) await loadAll(userId);
}
