import { create } from 'zustand';
import { Task, Client, User, ViewMode, AgendaView, TaskStatus } from '../types';

interface AppState {
  // Dados
  tasks: Task[];
  clients: Client[];
  currentUser: User;
  
  // UI State
  viewMode: ViewMode;
  agendaView: AgendaView;
  selectedTask: Task | null;
  isTaskModalOpen: boolean;
  isDarkMode: boolean;
  sidebarCollapsed: boolean;
  
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
  
  updateUserAvatar: (avatarUrl: string) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  updateUserCommentsAuthor: (userId: string, newUserData: Partial<User>) => void;
  
  setViewMode: (viewMode: ViewMode) => void;
  setAgendaView: (agendaView: AgendaView) => void;
  setSelectedTask: (task: Task | null) => void;
  setTaskModalOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Estado inicial
  tasks: [],
  clients: [],
  currentUser: {
    id: '1',
    name: 'Administrador',
    email: 'admin@tarefeiropro.com',
    role: 'admin'
  },
  
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

  // UI Actions para UI
  setViewMode: (viewMode) => set({ viewMode }),
  setAgendaView: (agendaView) => set({ agendaView }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setTaskModalOpen: (open) => set({ isTaskModalOpen: open }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
}));