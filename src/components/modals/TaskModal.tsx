import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  MessageCircle, 
  Paperclip, 
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Task, TaskStatus, TaskPriority, TaskType } from '../../types';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createLocalDate, formatDateForInput, formatDateForDisplay } from '../../lib/utils';

export function TaskModal() {
  const { 
    selectedTask, 
    isTaskModalOpen, 
    setTaskModalOpen, 
    setSelectedTask, 
    updateTask,
    addTask,
    clients,
    tasks,
    currentUser 
  } = useAppStore();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'para_fazer' as TaskStatus,
    priority: 'media' as TaskPriority,
    type: 'tarefa' as TaskType,
    dueDate: '',
    startTime: '',
    endTime: '',
    clientId: '',
    isVisibleToAll: true
  });

  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [editingSubtaskComment, setEditingSubtaskComment] = useState<string | null>(null);
  const [subtaskCommentText, setSubtaskCommentText] = useState('');
  
  // Estados para prorrogação
  const [isExtending, setIsExtending] = useState(false);
  const [extensionDate, setExtensionDate] = useState('');
  const [extensionReason, setExtensionReason] = useState('');

  // Sincronizar selectedTask com a versão atualizada no store
  const currentTask = selectedTask ? tasks.find(task => task.id === selectedTask.id) : null;

  // Reset form data when modal opens for new task or when editing existing task
  useEffect(() => {
    if (currentTask) {
      setFormData({
        title: currentTask.title,
        description: currentTask.description || '',
        status: currentTask.status,
        priority: currentTask.priority,
        type: currentTask.type,
        dueDate: currentTask.dueDate ? formatDateForInput(currentTask.dueDate) : '',
        startTime: currentTask.startTime || '',
        endTime: currentTask.endTime || '',
        clientId: currentTask.clientId || '',
        isVisibleToAll: currentTask.isVisibleToAll
      });
      setIsEditing(false);
    } else {
      // Nova tarefa
      setFormData({
        title: '',
        description: '',
        status: 'para_fazer',
        priority: 'media',
        type: 'tarefa',
        dueDate: '',
        startTime: '',
        endTime: '',
        clientId: '',
        isVisibleToAll: true
      });
      setIsEditing(true);
    }
  }, [currentTask]);

  // Reset form when modal opens for new task
  useEffect(() => {
    if (isTaskModalOpen && !selectedTask) {
      setFormData({
        title: '',
        description: '',
        status: 'para_fazer',
        priority: 'media',
        type: 'tarefa',
        dueDate: '',
        startTime: '',
        endTime: '',
        clientId: '',
        isVisibleToAll: true
      });
      setIsEditing(true);
      setNewComment('');
      setNewSubtask('');
      setIsExtending(false);
      setExtensionDate('');
      setExtensionReason('');
    }
  }, [isTaskModalOpen, selectedTask]);

  // Sync opening with URL query param ?tarefa=<id>
  useEffect(() => {
    const taskId = searchParams.get('tarefa');
    if (taskId && !selectedTask) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        setTaskModalOpen(true);
        setIsEditing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleClose = () => {
    setTaskModalOpen(false);
    setSelectedTask(null);
    setIsEditing(false);
    setNewComment('');
    setNewSubtask('');
    setIsExtending(false);
    setExtensionDate('');
    setExtensionReason('');
    // Reset form data to initial state
    setFormData({
      title: '',
      description: '',
      status: 'para_fazer',
      priority: 'media',
      type: 'tarefa',
      dueDate: '',
      startTime: '',
      endTime: '',
      clientId: '',
      isVisibleToAll: true
    });
    // Remove task query param from URL when closing
    navigate({ pathname: location.pathname, search: '' });
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;

    const newDueDate = formData.dueDate ? createLocalDate(formData.dueDate) : undefined;
    
    let taskData = {
      ...formData,
      dueDate: newDueDate,
      updatedAt: new Date(),
      // Limpar horários se for tarefa (não evento)
      startTime: formData.type === 'evento' ? formData.startTime : undefined,
      endTime: formData.type === 'evento' ? formData.endTime : undefined
    };

    if (currentTask) {
      // Verificar se houve mudança na data de vencimento (prorrogação)
      const currentDueDate = currentTask.dueDate;
      const hasDateChanged = currentDueDate && newDueDate && 
        currentDueDate.getTime() !== newDueDate.getTime();
      
      if (hasDateChanged && newDueDate > currentDueDate) {
        // É uma prorrogação - registrar dados da prorrogação
        const extensionData = {
          originalDueDate: currentTask.originalDueDate || currentDueDate,
          extensionCount: (currentTask.extensionCount || 0) + 1,
          lastExtensionDate: new Date(),
          extensionReason: extensionReason.trim() || 'Sem motivo especificado'
        };
        
        updateTask(currentTask.id, { ...taskData, ...extensionData });
      } else {
        updateTask(currentTask.id, taskData);
      }
    } else {
      const newTask: Omit<Task, 'id'> = {
        ...taskData,
        createdAt: new Date(),
        assignedTo: [],
        comments: [],
        subtasks: [],
        attachments: [],
        createdBy: { id: '1', name: 'Usuário', email: 'user@example.com', role: 'user' as const },
        tags: [],
        isVisibleToAll: formData.isVisibleToAll,
        originalDueDate: newDueDate, // Para nova tarefa, a data original é a data inicial
        extensionCount: 0
      };
      addTask(newTask);
    }

    setIsEditing(false);
    setIsExtending(false);
    setExtensionDate('');
    setExtensionReason('');
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !currentTask) return;

    const comment = {
      id: Date.now().toString(),
      content: newComment,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role
      },
      createdAt: new Date(),
      mentions: []
    };

    updateTask(currentTask.id, {
      comments: [...currentTask.comments, comment]
    });

    setNewComment('');
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim() || !currentTask) return;

    const subtask = {
      id: Date.now().toString(),
      title: newSubtask,
      completed: false,
      createdAt: new Date(),
      comments: []
    };

    updateTask(currentTask.id, {
      subtasks: [...currentTask.subtasks, subtask]
    });

    setNewSubtask('');
  };

  const toggleSubtask = (subtaskId: string) => {
    if (!currentTask) return;

    const updatedSubtasks = currentTask.subtasks.map(subtask =>
      subtask.id === subtaskId 
        ? { ...subtask, completed: !subtask.completed }
        : subtask
    );

    updateTask(currentTask.id, { subtasks: updatedSubtasks });
  };

  const deleteSubtask = (subtaskId: string) => {
    if (!currentTask) return;

    const updatedSubtasks = currentTask.subtasks.filter(subtask => subtask.id !== subtaskId);
    updateTask(currentTask.id, { subtasks: updatedSubtasks });
  };

  const handleEditSubtaskComment = (subtaskId: string, currentComment?: string) => {
    setEditingSubtaskComment(subtaskId);
    setSubtaskCommentText(currentComment || '');
  };

  const handleSaveSubtaskComment = (subtaskId: string) => {
    if (!currentTask) return;

    const trimmedComment = subtaskCommentText.trim();
    const updatedSubtasks = currentTask.subtasks.map(subtask =>
      subtask.id === subtaskId 
        ? { ...subtask, comment: trimmedComment || undefined }
        : subtask
    );

    updateTask(currentTask.id, { subtasks: updatedSubtasks });
    setEditingSubtaskComment(null);
    setSubtaskCommentText('');
  };

  const handleCancelSubtaskComment = () => {
    setEditingSubtaskComment(null);
    setSubtaskCommentText('');
  };

  // Função para detectar mudança na data e verificar se é prorrogação
  const handleDateChange = (newDate: string) => {
    setFormData({ ...formData, dueDate: newDate });
    
    if (currentTask && currentTask.dueDate && newDate) {
      const currentDueDate = currentTask.dueDate;
      const newDueDate = createLocalDate(newDate);
      
      // Se a nova data é posterior à atual, é uma prorrogação
      if (newDueDate > currentDueDate) {
        setIsExtending(true);
        setExtensionDate(newDate);
      } else {
        setIsExtending(false);
        setExtensionDate('');
        setExtensionReason('');
      }
    }
  };

  // Função para formatar data para exibição em português brasileiro
  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!isTaskModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentTask ? (isEditing ? 'Editar Tarefa' : 'Detalhes da Tarefa') : 'Nova Tarefa'}
            </h2>
            {currentTask && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {isEditing ? (
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Digite o título da tarefa"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Descreva a tarefa"
                  />
                </div>

                {/* Row 1: Status, Priority, Type */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="para_fazer">Para Fazer</option>
                      <option value="fazendo">Fazendo</option>
                      <option value="aguardando_retorno">Aguardando Retorno</option>
                      <option value="feito">Feito</option>
                      <option value="longo_prazo">Longo Prazo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prioridade
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="tarefa">Tarefa</option>
                      <option value="evento">Evento</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Date and Time */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {currentTask && isExtending ? 'Nova Data de Vencimento (Prorrogação)' : 'Data de Vencimento'}
                    </label>
                    <input
                      type="date"
                      lang="pt-BR"
                      value={formData.dueDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        isExtending 
                          ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {currentTask && currentTask.dueDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Data atual: {formatDateForDisplay(currentTask.dueDate)}
                      </p>
                    )}
                  </div>

                  {formData.type === 'evento' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Hora de Início
                        </label>
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Hora de Fim
                        </label>
                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Extension Reason - Only show when extending */}
                {isExtending && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <h4 className="font-medium text-orange-800 dark:text-orange-200">
                        Prorrogação de Prazo
                      </h4>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                        Motivo da Prorrogação (opcional)
                      </label>
                      <textarea
                        value={extensionReason}
                        onChange={(e) => setExtensionReason(e.target.value)}
                        placeholder="Descreva o motivo da prorrogação..."
                        className="w-full px-3 py-2 border border-orange-300 dark:border-orange-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                        rows={3}
                      />
                    </div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                      Esta prorrogação será registrada para análise no dashboard.
                    </p>
                  </div>
                )}

                {/* Client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cliente
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visibility */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isVisibleToAll"
                    checked={formData.isVisibleToAll}
                    onChange={(e) => setFormData({ ...formData, isVisibleToAll: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor="isVisibleToAll" className="text-sm text-gray-700 dark:text-gray-300">
                    Visível para todos
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={!formData.title.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {currentTask ? 'Salvar' : 'Criar Tarefa'}
                  </button>
                  <button
                    onClick={() => currentTask ? setIsEditing(false) : handleClose()}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : currentTask ? (
              <div className="space-y-6">
                {/* Task Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {currentTask.title}
                  </h3>
                  {currentTask.description && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentTask.description}
                    </p>
                  )}
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{currentTask.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prioridade:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{currentTask.priority}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo:</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{currentTask.type}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      try {
                        const date = new Date(currentTask.dueDate);
                        return currentTask.dueDate && isValid(date);
                      } catch {
                        return false;
                      }
                    })() && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {(() => {
                            try {
                              const date = new Date(currentTask.dueDate);
                              return format(date, 'dd/MM/yyyy');
                            } catch {
                              return 'Data inválida';
                            }
                          })()}
                        </span>
                      </div>
                    )}
                    {currentTask.startTime && currentTask.endTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {currentTask.startTime} - {currentTask.endTime}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subtasks */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Subtarefas</h4>
                  </div>
                  <div className="space-y-3">
                    {currentTask.subtasks.map(subtask => (
                      <div key={subtask.id} className="space-y-2">
                        {/* Linha principal da subtarefa */}
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 group">
                          <button
                            onClick={() => toggleSubtask(subtask.id)}
                            className="flex-shrink-0"
                          >
                            {subtask.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {subtask.title}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditSubtaskComment(subtask.id, subtask.comment)}
                              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                              title="Adicionar/editar comentário"
                            >
                              <MessageCircle className={`w-4 h-4 ${subtask.comment ? 'text-blue-500' : 'text-gray-500'}`} />
                            </button>
                            <button
                              onClick={() => deleteSubtask(subtask.id)}
                              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                              title="Excluir subtarefa"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>

                        {/* Input de comentário (quando editando) */}
                        {editingSubtaskComment === subtask.id && (
                          <div className="ml-8 space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={subtaskCommentText}
                                onChange={(e) => setSubtaskCommentText(e.target.value.slice(0, 70))}
                                placeholder="Comentário da subtarefa (máx 70 caracteres)"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                maxLength={70}
                                autoFocus
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveSubtaskComment(subtask.id);
                                  } else if (e.key === 'Escape') {
                                    handleCancelSubtaskComment();
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleSaveSubtaskComment(subtask.id)}
                                className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={handleCancelSubtaskComment}
                                className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {subtaskCommentText.length}/70 caracteres
                            </div>
                          </div>
                        )}

                        {/* Exibição do comentário (quando existe e não está editando) */}
                        {subtask.comment && editingSubtaskComment !== subtask.id && (
                          <div className="ml-8 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                              "{subtask.comment}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        placeholder="Nova subtarefa"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                      />
                      <button
                        onClick={handleAddSubtask}
                        disabled={!newSubtask.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Sidebar - Comments */}
          {currentTask && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Comentários</h4>
              
              <div className="space-y-4 mb-4">
                {currentTask.comments.map(comment => (
                  <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                        {comment.author?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.author?.name || 'Usuário desconhecido'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(() => {
                          try {
                            const date = new Date(comment.createdAt);
                            return comment.createdAt && isValid(date)
                              ? format(date, 'dd/MM HH:mm')
                              : '';
                          } catch {
                            return '';
                          }
                        })()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicionar comentário..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Comentar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}