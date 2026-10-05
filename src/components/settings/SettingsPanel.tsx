import { useState } from 'react';
import { 
  Moon, 
  Sun, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Save,
  Eye,
  EyeOff,
  Edit,
  X,
  Plus,
  CheckCircle,
  MessageCircle,
  ListTodo,
  Calendar,
  AlertCircle,
  Users,
  BarChart,
  UserPlus
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { AvatarUpload } from './AvatarUpload';
import { UserManagement, UserReports, UserInvites, UserApprovals } from '../users';

export function SettingsPanel() {
  const { isDarkMode, toggleDarkMode, currentUser, updateUserAvatar, updateCurrentUser, updateUserCommentsAuthor } = useAppStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      taskReminders: true,
      weeklyReport: false,
      pushNotifications: {
        taskCreated: true,
        taskCompleted: true,
        taskComment: true,
        subtaskAdded: true,
        subtaskComment: true,
        taskDueToday: true,
        taskOverdue: true,
        weeklyReport: false
      }
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
      allowDataCollection: true
    },
    appearance: {
      showAvatars: true,
      animationsEnabled: true
    }
  });

  const [userProfile, setUserProfile] = useState({
    name: currentUser?.name || 'Usuário Atual',
    email: currentUser?.email || 'usuario@exemplo.com',
    phone: '',
    bio: ''
  });

  const handleSave = () => {
    // Aqui você salvaria as configurações
    console.log('Configurações salvas:', { settings, userProfile });
    // Mostrar toast de sucesso
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    // Atualizar o currentUser no store com os dados do perfil
    updateCurrentUser({
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
      bio: userProfile.bio
    });
    
    // Atualizar todos os comentários existentes do usuário com o novo nome
    updateUserCommentsAuthor(currentUser.id, {
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
      bio: userProfile.bio
    });
    
    console.log('Perfil salvo:', userProfile);
    setIsEditingProfile(false);
    // Mostrar toast de sucesso
  };

  const handleCancelEdit = () => {
    // Restaurar dados originais do usuário
    setUserProfile({
      name: currentUser.name,
      email: currentUser.email,
      phone: '',
      bio: ''
    });
    setIsEditingProfile(false);
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'privacy', label: 'Privacidade', icon: Shield },
    ...(currentUser.role === 'admin' ? [
      { id: 'users', label: 'Usuários', icon: Users },
      { id: 'reports', label: 'Relatórios', icon: BarChart },
      { id: 'invites', label: 'Convites', icon: UserPlus },
      { id: 'approvals', label: 'Aprovações', icon: CheckCircle }
    ] : [])
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Configurações
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Personalize sua experiência no Tarefeiro Pro
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-300 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-8">
          {/* User Profile */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Perfil do Usuário
                </h2>
              </div>
              
              {!isEditingProfile ? (
                <button
                  onClick={handleEditProfile}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar Perfil
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Salvar
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="mb-6">
                <AvatarUpload
                  currentAvatar={currentUser.avatar}
                  onAvatarChange={updateUserAvatar}
                  size={80}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nome
                  </label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  ) : (
                    <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
                      {userProfile.name || 'Não informado'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  {isEditingProfile ? (
                    <input
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  ) : (
                    <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
                      {userProfile.email || 'Não informado'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Telefone
                  </label>
                  {isEditingProfile ? (
                    <input
                      type="tel"
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="(11) 99999-9999"
                    />
                  ) : (
                    <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white">
                      {userProfile.phone || 'Não informado'}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bio
                  </label>
                  {isEditingProfile ? (
                    <textarea
                      value={userProfile.bio}
                      onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Conte um pouco sobre você..."
                    />
                  ) : (
                    <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white min-h-[80px]">
                      {userProfile.bio || 'Não informado'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Notificações
              </h2>
            </div>

            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Notificações por Email
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Receba atualizações importantes por email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, email: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Push Notifications Master Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Notificações Push
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Ativar/desativar todas as notificações push
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.push}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, push: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Detailed Push Notification Settings */}
              {settings.notifications.push && (
                <div className="ml-4 pl-4 border-l-2 border-slate-200 dark:border-slate-600 space-y-4">
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-3">
                    Configurações Detalhadas de Push
                  </h4>
                  
                  {/* Task Created */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Plus className="w-4 h-4 text-green-500" />
                      <div>
                        <h5 className="text-sm font-medium text-slate-900 dark:text-white">
                          Criação de Nova Tarefa
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Quando uma nova tarefa for criada
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.pushNotifications.taskCreated}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            pushNotifications: {
                              ...settings.notifications.pushNotifications,
                              taskCreated: e.target.checked
                            }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Task Completed */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <h5 className="text-sm font-medium text-slate-900 dark:text-white">
                          Conclusão de Tarefa
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Quando uma tarefa for marcada como concluída
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.pushNotifications.taskCompleted}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            pushNotifications: {
                              ...settings.notifications.pushNotifications,
                              taskCompleted: e.target.checked
                            }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Task Comment */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-blue-500" />
                      <div>
                        <h5 className="text-sm font-medium text-slate-900 dark:text-white">
                          Comentário em Tarefa
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Quando alguém comentar em uma tarefa
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.pushNotifications.taskComment}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            pushNotifications: {
                              ...settings.notifications.pushNotifications,
                              taskComment: e.target.checked
                            }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Subtask Added */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ListTodo className="w-4 h-4 text-purple-500" />
                      <div>
                        <h5 className="text-sm font-medium text-slate-900 dark:text-white">
                          Inclusão de Subtarefa
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Quando uma subtarefa for adicionada
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.pushNotifications.subtaskAdded}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            pushNotifications: {
                              ...settings.notifications.pushNotifications,
                              subtaskAdded: e.target.checked
                            }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Subtask Comment */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-indigo-500" />
                      <div>
                        <h5 className="text-sm font-medium text-slate-900 dark:text-white">
                          Comentário em Subtarefa
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Quando alguém comentar em uma subtarefa
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.pushNotifications.subtaskComment}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            pushNotifications: {
                              ...settings.notifications.pushNotifications,
                              subtaskComment: e.target.checked
                            }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Task Due Today */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <div>
                        <h5 className="text-sm font-medium text-slate-900 dark:text-white">
                          Tarefa Vence Hoje
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Lembrete de tarefas que vencem hoje
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.pushNotifications.taskDueToday}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            pushNotifications: {
                              ...settings.notifications.pushNotifications,
                              taskDueToday: e.target.checked
                            }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Task Overdue */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <div>
                        <h5 className="text-sm font-medium text-slate-900 dark:text-white">
                          Tarefa Atrasada
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Alerta para tarefas em atraso
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.pushNotifications.taskOverdue}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            pushNotifications: {
                              ...settings.notifications.pushNotifications,
                              taskOverdue: e.target.checked
                            }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Weekly Report */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Relatório Semanal
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Receba um resumo semanal das suas atividades
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.weeklyReport}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, weeklyReport: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Appearance */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Aparência
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Tema Escuro
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Alternar entre tema claro e escuro
                  </p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  )}
                </button>
              </div>



              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Mostrar Avatares
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Exibir avatares dos usuários
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.appearance.showAvatars}
                    onChange={(e) => setSettings({
                      ...settings,
                      appearance: { ...settings.appearance, showAvatars: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Privacidade
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Perfil Visível
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Permitir que outros vejam seu perfil
                  </p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, profileVisible: !settings.privacy.profileVisible }
                  })}
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {settings.privacy.profileVisible ? (
                    <Eye className="w-5 h-5 text-green-500" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">
                    Atividade Visível
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Mostrar sua atividade para outros
                  </p>
                </div>
                <button
                  onClick={() => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, activityVisible: !settings.privacy.activityVisible }
                  })}
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {settings.privacy.activityVisible ? (
                    <Eye className="w-5 h-5 text-green-500" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>
      </div>
      )}

      {/* Aba de Notificações */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Configurações de Notificação
            </h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-slate-900 dark:text-white">Notificações Gerais</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-slate-300">Notificações por email</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, email: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-slate-300">Notificações push</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.push}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, push: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aba de Aparência */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Configurações de Aparência
            </h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Tema</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Escolha entre tema claro ou escuro
                </p>
              </div>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aba de Privacidade */}
      {activeTab === 'privacy' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Configurações de Privacidade
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">
                  Perfil Visível
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Permitir que outros vejam seu perfil
                </p>
              </div>
              <button
                onClick={() => setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, profileVisible: !settings.privacy.profileVisible }
                })}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {settings.privacy.profileVisible ? (
                  <Eye className="w-5 h-5 text-green-500" />
                ) : (
                  <EyeOff className="w-5 h-5 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aba de Usuários (apenas para admins) */}
      {activeTab === 'users' && currentUser.role === 'admin' && (
        <UserManagement />
      )}

      {/* Aba de Relatórios (apenas para admins) */}
      {activeTab === 'reports' && currentUser.role === 'admin' && (
        <UserReports />
      )}

      {/* Aba de Convites (apenas para admins) */}
      {activeTab === 'invites' && currentUser.role === 'admin' && (
        <UserInvites />
      )}

      {/* Aba de Aprovações (apenas para admins) */}
      {activeTab === 'approvals' && currentUser.role === 'admin' && (
        <UserApprovals />
      )}
    </div>
  );
}