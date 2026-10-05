import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { X, Save, User as UserIcon, Shield } from 'lucide-react';

interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({ user, isOpen, onClose }) => {
  const { addUser, updateUser, currentUser } = useAppStore();
  
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'user',
    phone: '',
    bio: '',
    avatar: '',
    preferences: {
      emailNotifications: true,
      mentionNotifications: true,
      taskNotifications: true,
      reportNotifications: false,
      approvalNotifications: false,
      systemNotifications: true,
      theme: 'light',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo'
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        preferences: user.preferences || {
          emailNotifications: true,
          mentionNotifications: true,
          taskNotifications: true,
          reportNotifications: false,
          approvalNotifications: false,
          systemNotifications: true,
          theme: 'light',
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo'
        }
      });
    } else {
      // Reset para valores padrão ao criar novo usuário
      setFormData({
        name: '',
        email: '',
        role: 'user',
        phone: '',
        bio: '',
        avatar: '',
        preferences: {
          emailNotifications: true,
          mentionNotifications: true,
          taskNotifications: true,
          reportNotifications: false,
          approvalNotifications: false,
          systemNotifications: true,
          theme: 'light',
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo'
        }
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: checked !== undefined ? checked : value
      }
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (user) {
        // Atualizar usuário existente
        updateUser(user.id, formData);
      } else {
        // Adicionar novo usuário
        addUser(formData as Omit<User, 'id' | 'createdAt' | 'updatedAt'>);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">
                {user ? 'Editar Usuário' : 'Adicionar Usuário'}
              </h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Avatar */}
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    {formData.avatar ? (
                      <img
                        src={formData.avatar}
                        alt={formData.name}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center">
                        <UserIcon className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 right-0">
                      <input
                        type="text"
                        name="avatar"
                        value={formData.avatar || ''}
                        onChange={handleChange}
                        placeholder="URL do avatar"
                        className="sr-only"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Insira a URL da imagem de avatar:', formData.avatar);
                          if (url !== null) {
                            setFormData(prev => ({ ...prev, avatar: url }));
                          }
                        }}
                        className="bg-slate-800 text-white p-1.5 rounded-full hover:bg-slate-700"
                      >
                        <UserIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Informações básicas */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className={`mt-1 block w-full border ${
                      errors.name ? 'border-red-300' : 'border-slate-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className={`mt-1 block w-full border ${
                      errors.email ? 'border-red-300' : 'border-slate-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                    Telefone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
                    Biografia
                  </label>
                  <textarea
                    name="bio"
                    id="bio"
                    rows={3}
                    value={formData.bio || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Permissões */}
                {currentUser.role === 'admin' && (
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-slate-700">
                      Função
                    </label>
                    <div className="mt-1 flex items-center">
                      <select
                        name="role"
                        id="role"
                        value={formData.role || 'user'}
                        onChange={handleChange}
                        className="block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="user">Usuário</option>
                        <option value="admin">Administrador</option>
                      </select>
                      {formData.role === 'admin' && (
                        <Shield className="ml-2 w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Administradores têm acesso completo ao sistema, incluindo gerenciamento de usuários.
                    </p>
                  </div>
                )}

                {/* Preferências */}
                <div className="pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-medium text-slate-900 mb-3">Preferências de Notificação</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        id="emailNotifications"
                        checked={formData.preferences?.emailNotifications}
                        onChange={handlePreferenceChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      />
                      <label htmlFor="emailNotifications" className="ml-2 block text-sm text-slate-700">
                        Notificações por email
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="mentionNotifications"
                        id="mentionNotifications"
                        checked={formData.preferences?.mentionNotifications}
                        onChange={handlePreferenceChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      />
                      <label htmlFor="mentionNotifications" className="ml-2 block text-sm text-slate-700">
                        Notificações de menções
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="taskNotifications"
                        id="taskNotifications"
                        checked={formData.preferences?.taskNotifications}
                        onChange={handlePreferenceChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      />
                      <label htmlFor="taskNotifications" className="ml-2 block text-sm text-slate-700">
                        Notificações de tarefas
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label htmlFor="theme" className="block text-sm font-medium text-slate-700">
                      Tema
                    </label>
                    <select
                      name="theme"
                      id="theme"
                      value={formData.preferences?.theme || 'light'}
                      onChange={handlePreferenceChange}
                      className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Escuro</option>
                      <option value="auto">Automático (sistema)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal;