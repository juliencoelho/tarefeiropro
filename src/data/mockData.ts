import { Task, Client, User } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@tarefeiropro.com',
    role: 'admin'
  },
  {
    id: '2',
    name: 'João Silva',
    email: 'joao@empresa.com',
    role: 'user'
  },
  {
    id: '3',
    name: 'Maria Santos',
    email: 'maria@empresa.com',
    role: 'user'
  }
];

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Empresa ABC',
    email: 'contato@empresaabc.com',
    phone: '(11) 99999-9999',
    company: 'ABC Ltda',
    color: '#3B82F6',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Tech Solutions',
    email: 'info@techsolutions.com',
    phone: '(11) 88888-8888',
    company: 'Tech Solutions Inc',
    color: '#10B981',
    createdAt: new Date('2024-01-20')
  },
  {
    id: '3',
    name: 'Startup XYZ',
    email: 'hello@startupxyz.com',
    phone: '(11) 77777-7777',
    company: 'XYZ Startup',
    color: '#F59E0B',
    createdAt: new Date('2024-02-01')
  }
];

export const mockTasks: Task[] = [
  // Outubro 2025
  {
    id: '1',
    title: 'Desenvolver dashboard analytics',
    description: 'Criar dashboard com métricas de produtividade e relatórios visuais para gestão de tarefas.',
    status: 'fazendo',
    priority: 'alta',
    type: 'tarefa',
    dueDate: new Date('2025-10-25'),
    clientId: '1',
    assignedTo: [mockUsers[1], mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-10'),
    updatedAt: new Date('2025-10-18'),
    subtasks: [
      {
        id: 's1',
        title: 'Configurar gráficos com Chart.js',
        completed: true,
        createdAt: new Date('2025-10-10'),
        comments: []
      },
      {
        id: 's2',
        title: 'Implementar filtros de data',
        completed: false,
        createdAt: new Date('2025-10-12'),
        comments: [
          {
            id: 'c1',
            content: 'Precisa incluir filtro por cliente também',
            author: mockUsers[1],
            createdAt: new Date('2025-10-18'),
            mentions: []
          }
        ]
      }
    ],
    comments: [
      {
        id: 'c2',
        content: 'Dashboard está ficando muito bom! @João pode revisar a responsividade?',
        author: mockUsers[0],
        createdAt: new Date('2025-10-18'),
        mentions: ['2']
      }
    ],
    attachments: [],
    isVisibleToAll: true,
    tags: ['desenvolvimento', 'dashboard', 'analytics']
  },
  {
    id: '2',
    title: 'Reunião de planejamento Q1',
    description: 'Definir metas e objetivos para o primeiro trimestre de 2025.',
    status: 'feito',
    priority: 'alta',
    type: 'evento',
    dueDate: new Date('2025-01-05'),
    startTime: '09:00',
    endTime: '11:00',
    clientId: '1',
    assignedTo: [mockUsers[0], mockUsers[1], mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-05'),
    completedAt: new Date('2025-01-05'),
    subtasks: [],
    comments: [
      {
        id: 'c3',
        content: 'Reunião muito produtiva! Metas definidas com sucesso.',
        author: mockUsers[0],
        createdAt: new Date('2025-01-05'),
        mentions: []
      }
    ],
    attachments: [],
    isVisibleToAll: true,
    tags: ['reunião', 'planejamento', 'metas']
  },
  {
    id: '3',
    title: 'Otimizar performance do sistema',
    description: 'Melhorar tempo de carregamento e responsividade da aplicação.',
    status: 'para_fazer',
    priority: 'media',
    type: 'tarefa',
    dueDate: new Date('2025-10-30'),
    clientId: '2',
    assignedTo: [mockUsers[1]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-15'),
    updatedAt: new Date('2025-10-15'),
    subtasks: [
      {
        id: 's3',
        title: 'Analisar bundle size',
        completed: false,
        createdAt: new Date('2025-10-15'),
        comments: []
      },
      {
        id: 's4',
        title: 'Implementar lazy loading',
        completed: false,
        createdAt: new Date('2025-10-15'),
        comments: []
      }
    ],
    comments: [],
    attachments: [],
    isVisibleToAll: true,
    tags: ['performance', 'otimização']
  },
  {
    id: '4',
    title: 'Implementar sistema de notificações',
    description: 'Criar sistema de notificações push e email para lembretes de tarefas.',
    status: 'aguardando_retorno',
    priority: 'media',
    type: 'tarefa',
    dueDate: new Date('2025-11-05'),
    clientId: '3',
    assignedTo: [mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-12'),
    updatedAt: new Date('2025-10-16'),
    subtasks: [],
    comments: [
      {
        id: 'c4',
        content: 'Aguardando aprovação do cliente para templates de email',
        author: mockUsers[2],
        createdAt: new Date('2025-10-16'),
        mentions: []
      }
    ],
    attachments: [],
    isVisibleToAll: false,
    tags: ['notificações', 'email', 'push']
  },
  {
    id: '5',
    title: 'Configurar CI/CD pipeline',
    description: 'Automatizar processo de deploy e testes com GitHub Actions.',
    status: 'longo_prazo',
    priority: 'baixa',
    type: 'tarefa',
    dueDate: new Date('2025-11-15'),
    clientId: '1',
    assignedTo: [mockUsers[1]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-08'),
    updatedAt: new Date('2025-10-08'),
    subtasks: [],
    comments: [],
    attachments: [],
    isVisibleToAll: true,
    tags: ['devops', 'ci/cd', 'automação']
  },
  {
    id: '6',
    title: 'Workshop de UX/UI',
    description: 'Sessão de treinamento sobre melhores práticas de design.',
    status: 'para_fazer',
    priority: 'baixa',
    type: 'evento',
    dueDate: new Date('2025-10-25'),
    startTime: '14:00',
    endTime: '17:00',
    clientId: '2',
    assignedTo: [mockUsers[0], mockUsers[1], mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-14'),
    updatedAt: new Date('2025-10-14'),
    subtasks: [],
    comments: [],
    attachments: [],
    isVisibleToAll: true,
    tags: ['workshop', 'ux', 'ui', 'treinamento']
  },
  {
    id: '7',
    title: 'Refatorar componentes React',
    description: 'Modernizar componentes legados para usar hooks e TypeScript.',
    status: 'fazendo',
    priority: 'media',
    type: 'tarefa',
    dueDate: new Date('2025-10-28'),
    clientId: '1',
    assignedTo: [mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-11'),
    updatedAt: new Date('2025-10-17'),
    subtasks: [
      {
        id: 's5',
        title: 'Converter componentes de classe para função',
        completed: true,
        createdAt: new Date('2025-10-11'),
        comments: []
      },
      {
        id: 's6',
        title: 'Adicionar tipagem TypeScript',
        completed: false,
        createdAt: new Date('2025-10-13'),
        comments: []
      }
    ],
    comments: [],
    attachments: [],
    isVisibleToAll: true,
    tags: ['refatoração', 'react', 'typescript']
  },

  // Novembro 2025
  {
    id: '8',
    title: 'Implementar autenticação 2FA',
    description: 'Adicionar autenticação de dois fatores para maior segurança.',
    status: 'para_fazer',
    priority: 'alta',
    type: 'tarefa',
    dueDate: new Date('2025-11-10'),
    clientId: '2',
    assignedTo: [mockUsers[1]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-18'),
    updatedAt: new Date('2025-10-18'),
    subtasks: [
      {
        id: 's7',
        title: 'Integrar com Google Authenticator',
        completed: false,
        createdAt: new Date('2025-10-18'),
        comments: []
      },
      {
        id: 's8',
        title: 'Criar interface de configuração',
        completed: false,
        createdAt: new Date('2025-10-18'),
        comments: []
      }
    ],
    comments: [],
    attachments: [],
    isVisibleToAll: true,
    tags: ['segurança', '2fa', 'autenticação']
  },
  {
    id: '9',
    title: 'Reunião de review mensal',
    description: 'Revisar progresso de outubro e ajustar metas de novembro.',
    status: 'feito',
    priority: 'media',
    type: 'evento',
    dueDate: new Date('2025-09-30'),
    startTime: '10:00',
    endTime: '12:00',
    clientId: '1',
    assignedTo: [mockUsers[0], mockUsers[1], mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-09-25'),
    updatedAt: new Date('2025-09-30'),
    completedAt: new Date('2025-09-30'),
    subtasks: [],
    comments: [
      {
        id: 'c5',
        content: 'Setembro foi um mês muito produtivo! 🚀',
        author: mockUsers[0],
        createdAt: new Date('2025-09-30'),
        mentions: []
      }
    ],
    attachments: [],
    isVisibleToAll: true,
    tags: ['reunião', 'review', 'mensal']
  },
  {
    id: '10',
    title: 'Criar API de relatórios',
    description: 'Desenvolver endpoints para geração de relatórios personalizados.',
    status: 'fazendo',
    priority: 'alta',
    type: 'tarefa',
    dueDate: new Date('2025-11-15'),
    clientId: '3',
    assignedTo: [mockUsers[1], mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-05'),
    updatedAt: new Date('2025-10-16'),
    subtasks: [
      {
        id: 's9',
        title: 'Definir estrutura dos endpoints',
        completed: true,
        createdAt: new Date('2025-10-05'),
        comments: []
      },
      {
        id: 's10',
        title: 'Implementar filtros avançados',
        completed: false,
        createdAt: new Date('2025-10-08'),
        comments: []
      }
    ],
    comments: [
      {
        id: 'c6',
        content: 'API está tomando forma, falta implementar paginação',
        author: mockUsers[1],
        createdAt: new Date('2025-10-16'),
        mentions: []
      }
    ],
    attachments: [],
    isVisibleToAll: true,
    tags: ['api', 'relatórios', 'backend']
  },
  {
    id: '11',
    title: 'Atualizar documentação da API',
    description: 'Revisar e atualizar toda documentação técnica da API.',
    status: 'aguardando_retorno',
    priority: 'baixa',
    type: 'tarefa',
    dueDate: new Date('2025-11-20'),
    clientId: '1',
    assignedTo: [mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-10'),
    updatedAt: new Date('2025-10-14'),
    subtasks: [],
    comments: [
      {
        id: 'c7',
        content: 'Aguardando finalização da API de relatórios para documentar',
        author: mockUsers[2],
        createdAt: new Date('2025-10-14'),
        mentions: []
      }
    ],
    attachments: [],
    isVisibleToAll: true,
    tags: ['documentação', 'api']
  },
  {
    id: '12',
    title: 'Implementar modo escuro',
    description: 'Adicionar tema escuro para melhor experiência do usuário.',
    status: 'para_fazer',
    priority: 'media',
    type: 'tarefa',
    dueDate: new Date('2025-11-25'),
    clientId: '2',
    assignedTo: [mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-16'),
    updatedAt: new Date('2025-10-16'),
    subtasks: [
      {
        id: 's11',
        title: 'Criar paleta de cores para tema escuro',
        completed: false,
        createdAt: new Date('2025-10-16'),
        comments: []
      },
      {
        id: 's12',
        title: 'Implementar toggle de tema',
        completed: false,
        createdAt: new Date('2025-10-16'),
        comments: []
      }
    ],
    comments: [],
    attachments: [],
    isVisibleToAll: true,
    tags: ['ui', 'tema', 'dark-mode']
  },
  {
    id: '13',
    title: 'Treinamento de segurança',
    description: 'Workshop sobre boas práticas de segurança em desenvolvimento.',
    status: 'longo_prazo',
    priority: 'media',
    type: 'evento',
    dueDate: new Date('2025-11-28'),
    startTime: '09:00',
    endTime: '12:00',
    clientId: '1',
    assignedTo: [mockUsers[0], mockUsers[1], mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-12'),
    updatedAt: new Date('2025-10-12'),
    subtasks: [],
    comments: [],
    attachments: [],
    isVisibleToAll: true,
    tags: ['treinamento', 'segurança', 'workshop']
  },

  // Dezembro 2025
  {
    id: '14',
    title: 'Migração para React 19',
    description: 'Atualizar projeto para a versão mais recente do React.',
    status: 'para_fazer',
    priority: 'alta',
    type: 'tarefa',
    dueDate: new Date('2025-12-10'),
    clientId: '1',
    assignedTo: [mockUsers[1], mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-18'),
    updatedAt: new Date('2025-10-18'),
    subtasks: [
      {
        id: 's13',
        title: 'Analisar breaking changes',
        completed: false,
        createdAt: new Date('2025-10-18'),
        comments: []
      },
      {
        id: 's14',
        title: 'Atualizar dependências',
        completed: false,
        createdAt: new Date('2025-10-18'),
        comments: []
      },
      {
        id: 's15',
        title: 'Testar compatibilidade',
        completed: false,
        createdAt: new Date('2025-10-18'),
        comments: []
      }
    ],
    comments: [],
    attachments: [],
    isVisibleToAll: true,
    tags: ['migração', 'react', 'atualização']
  },
  {
    id: '15',
    title: 'Implementar chat em tempo real',
    description: 'Sistema de chat para comunicação entre membros da equipe.',
    status: 'fazendo',
    priority: 'alta',
    type: 'tarefa',
    dueDate: new Date('2025-12-15'),
    clientId: '2',
    assignedTo: [mockUsers[1]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-08'),
    updatedAt: new Date('2025-10-17'),
    subtasks: [
      {
        id: 's16',
        title: 'Configurar Socket.IO',
        completed: true,
        createdAt: new Date('2025-10-08'),
        comments: []
      },
      {
        id: 's17',
        title: 'Criar interface do chat',
        completed: false,
        createdAt: new Date('2025-10-10'),
        comments: []
      }
    ],
    comments: [
      {
        id: 'c8',
        content: 'Socket.IO configurado com sucesso! Agora vamos para a UI',
        author: mockUsers[1],
        createdAt: new Date('2025-10-17'),
        mentions: []
      }
    ],
    attachments: [],
    isVisibleToAll: true,
    tags: ['chat', 'tempo-real', 'comunicação']
  },
  {
    id: '16',
    title: 'Apresentação para investidores',
    description: 'Preparar pitch deck e demonstração do produto.',
    status: 'para_fazer',
    priority: 'alta',
    type: 'evento',
    dueDate: new Date('2025-12-12'),
    startTime: '15:00',
    endTime: '16:30',
    clientId: '3',
    assignedTo: [mockUsers[0]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-15'),
    updatedAt: new Date('2025-10-15'),
    subtasks: [],
    comments: [],
    attachments: [],
    isVisibleToAll: false,
    tags: ['apresentação', 'investidores', 'pitch']
  },
  {
    id: '17',
    title: 'Otimizar banco de dados',
    description: 'Melhorar performance das consultas e indexação.',
    status: 'aguardando_retorno',
    priority: 'media',
    type: 'tarefa',
    dueDate: new Date('2025-12-20'),
    clientId: '1',
    assignedTo: [mockUsers[1]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-09'),
    updatedAt: new Date('2025-10-13'),
    subtasks: [
      {
        id: 's18',
        title: 'Analisar queries lentas',
        completed: false,
        createdAt: new Date('2025-10-09'),
        comments: []
      }
    ],
    comments: [
      {
        id: 'c9',
        content: 'Aguardando acesso ao ambiente de produção para análise',
        author: mockUsers[1],
        createdAt: new Date('2025-10-13'),
        mentions: []
      }
    ],
    attachments: [],
    isVisibleToAll: true,
    tags: ['banco-dados', 'performance', 'otimização']
  },
  {
    id: '18',
    title: 'Criar sistema de backup automático',
    description: 'Implementar rotina de backup diário dos dados.',
    status: 'longo_prazo',
    priority: 'media',
    type: 'tarefa',
    dueDate: new Date('2025-12-25'),
    clientId: '2',
    assignedTo: [mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-11'),
    updatedAt: new Date('2025-10-11'),
    subtasks: [],
    comments: [],
    attachments: [],
    isVisibleToAll: true,
    tags: ['backup', 'automação', 'segurança']
  },
  {
    id: '19',
    title: 'Review de código semanal',
    description: 'Sessão de revisão de código da equipe.',
    status: 'feito',
    priority: 'baixa',
    type: 'evento',
    dueDate: new Date('2025-10-11'),
    startTime: '11:00',
    endTime: '12:00',
    clientId: '1',
    assignedTo: [mockUsers[0], mockUsers[1], mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-09'),
    updatedAt: new Date('2025-10-11'),
    completedAt: new Date('2025-10-11'),
    subtasks: [],
    comments: [
      {
        id: 'c10',
        content: 'Ótima sessão! Identificamos várias melhorias possíveis',
        author: mockUsers[0],
        createdAt: new Date('2025-10-11'),
        mentions: []
      }
    ],
    attachments: [],
    isVisibleToAll: true,
    tags: ['review', 'código', 'qualidade']
  },
  {
    id: '20',
    title: 'Implementar PWA',
    description: 'Transformar aplicação em Progressive Web App.',
    status: 'para_fazer',
    priority: 'baixa',
    type: 'tarefa',
    dueDate: new Date('2025-12-30'),
    clientId: '3',
    assignedTo: [mockUsers[2]],
    createdBy: mockUsers[0],
    createdAt: new Date('2025-10-17'),
    updatedAt: new Date('2025-10-17'),
    subtasks: [
      {
        id: 's19',
        title: 'Configurar service worker',
        completed: false,
        createdAt: new Date('2025-10-17'),
        comments: []
      },
      {
        id: 's20',
        title: 'Criar manifest.json',
        completed: false,
        createdAt: new Date('2025-10-17'),
        comments: []
      }
    ],
    comments: [],
    attachments: [],
    isVisibleToAll: true,
    tags: ['pwa', 'mobile', 'offline']
  }
];