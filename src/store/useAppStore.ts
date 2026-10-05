import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Task, Client, User, ViewMode, AgendaView, TaskStatus, UserInvite, Notification, UserSession, UserFilter } from '../types';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/;

const dateReviver = (_key: string, value: unknown) => {
  if (typeof value === 'string' && ISO_DATE_REGEX.test(value)) {
    return new Date(value);
  }
  return value;
};

interface AppState {
  // Dados
  tasks: Task[];
  clients: Client[];
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
  
  // User Management UI State
  isUserModalOpen: boolean;
  selectedUser: User | null;
  userFilters: UserFilter;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  
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
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  // Estado inicial
  tasks: [],
  clients: [],
  users: [],
  currentUser: {
    id: '1',
    name: 'Administrador',
    email: 'admin@tarefeiropro.com',
    role: 'admin'
  },
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
  
  // User Management UI State
  isUserModalOpen: false,
  selectedUser: null,
  userFilters: {
    search: '',
    role: undefined,
    status: undefined,
    approved: undefined
  },
  
  // Actions para tarefas
  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, { ...task, id: Date.now().toString() }]
  })),
  
  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === taskId 
        ? { ...task, ...updates, updatedAt: new Date() }
        : task
    )
  })),
  
  deleteTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== taskId)
  })),
  
  updateTaskStatus: (taskId, status) => set((state) => {
    const taskExists = state.tasks.some(task => task.id === taskId);
    if (!taskExists) {
      console.warn(`Task with ID ${taskId} not found`);
      return state;
    }
    
    return {
      tasks: state.tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status, 
              updatedAt: new Date(),
              completedAt: status === 'feito' ? new Date() : task.completedAt
            }
          : task
      )
    };
  }),
  
  // Actions para clientes
  setClients: (clients) => set({ clients }),
  
  addClient: (client) => set((state) => ({
    clients: [...state.clients, { ...client, id: Date.now().toString() }]
  })),
  
  updateClient: (clientId, updates) => set((state) => ({
    clients: state.clients.map(client => 
      client.id === clientId ? { ...client, ...updates } : client
    )
  })),
  
  deleteClient: (clientId) => set((state) => ({
    clients: state.clients.filter(client => client.id !== clientId)
  })),

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

  updateUserAvatar: (avatarUrl) => set((state) => ({
    currentUser: { ...state.currentUser, avatar: avatarUrl }
  })),

  updateCurrentUser: (updates) => set((state) => ({
    currentUser: { ...state.currentUser, ...updates }
  })),

  updateUserCommentsAuthor: (userId, newUserData) => set((state) => ({
    tasks: state.tasks.map(task => ({
      ...task,
      comments: task.comments.map(comment => 
        comment.author.id === userId 
          ? { ...comment, author: { ...comment.author, ...newUserData } }
          : comment
      ),
      subtasks: task.subtasks.map(subtask => ({
        ...subtask,
        comments: subtask.comments.map(comment =>
          comment.author.id === userId
            ? { ...comment, author: { ...comment.author, ...newUserData } }
            : comment
        )
      }))
    }))
  })),

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
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
    }),
    {
      name: 'tarefeiro-pro-store',
      version: 1,
      storage: createJSONStorage(() => localStorage, { reviver: dateReviver }),
      partialize: (state) => ({
        tasks: state.tasks,
        clients: state.clients,
        users: state.users,
        currentUser: state.currentUser,
        userInvites: state.userInvites,
        notifications: state.notifications,
        userSessions: state.userSessions,
        isDarkMode: state.isDarkMode,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);