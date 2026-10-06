// Regras de organização do dia: o que é de hoje, o que está na caixa de entrada,
// o que merece atenção. Usadas pelas telas Hoje, Caixa de entrada e Áreas.
import { Task, TaskPriority, TaskStatus, TaskType, User } from '../types';
import { formatDateForInput } from './utils';

// Datas comparadas como texto 'yyyy-MM-dd' no fuso local: evita o dia "pular"
// por causa de horário/UTC e permite comparar com < e >.
export const diaDe = (date?: Date): string => (date ? formatDateForInput(date) : '');
export const hojeStr = (): string => formatDateForInput(new Date());

export const corPrioridade: Record<TaskPriority, string> = {
  urgente: 'bg-red-500',
  alta: 'bg-orange-500',
  media: 'bg-yellow-500',
  baixa: 'bg-green-500',
};

export const rotuloPrioridade: Record<TaskPriority, string> = {
  urgente: 'Urgente',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export const rotuloStatus: Record<TaskStatus, string> = {
  para_fazer: 'Para fazer',
  fazendo: 'Fazendo',
  aguardando_retorno: 'Aguardando retorno',
  feito: 'Feito',
  longo_prazo: 'Longo prazo',
};

export const rotuloTipo: Record<TaskType, string> = {
  tarefa: 'Tarefa',
  evento: 'Compromisso',
};

export const coresDeArea = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#64748b'];

// Tarefa nova com os valores padrão; `campos` sobrescreve o que precisar.
export function novaTarefa(title: string, owner: User, campos: Partial<Task> = {}): Omit<Task, 'id'> {
  const agora = new Date();
  return {
    title,
    description: '',
    status: 'para_fazer',
    priority: 'media',
    type: 'tarefa',
    extensionCount: 0,
    assignedTo: [],
    createdBy: owner,
    createdAt: agora,
    updatedAt: agora,
    subtasks: [],
    comments: [],
    attachments: [],
    isVisibleToAll: true,
    tags: [],
    source: 'app',
    inInbox: false,
    ...campos,
  };
}

const aberta = (t: Task) => t.status !== 'feito';
const porHorario = (a: Task, b: Task) => (a.startTime ?? '').localeCompare(b.startTime ?? '');
// Prazo mais antigo primeiro; sem prazo vai para o fim
const porPrazo = (a: Task, b: Task) => {
  const pa = diaDe(a.dueDate) || '9999-99-99';
  const pb = diaDe(b.dueDate) || '9999-99-99';
  return pa.localeCompare(pb);
};

export function caixaDeEntrada(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.inInbox && aberta(t))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function organizarHoje(tasks: Task[], hoje: string) {
  const naoEvento = tasks.filter((t) => t.type !== 'evento');

  // Compromissos com horário marcados para hoje (inclusive os já concluídos)
  const compromissos = tasks
    .filter((t) => t.type === 'evento' && diaDe(t.dueDate) === hoje)
    .sort(porHorario);

  // O que eu escolhi fazer hoje
  const planejadas = naoEvento.filter((t) => aberta(t) && diaDe(t.plannedFor) === hoje);

  const concluidas = naoEvento.filter(
    (t) => t.status === 'feito' && (diaDe(t.completedAt) === hoje || diaDe(t.plannedFor) === hoje)
  );

  // Sugestões: vence hoje, está atrasada, ou ficou planejada num dia que já passou
  const paraConsiderar = naoEvento
    .filter((t) => aberta(t) && !t.inInbox && diaDe(t.plannedFor) !== hoje)
    .filter((t) => {
      const prazo = diaDe(t.dueDate);
      const planejada = diaDe(t.plannedFor);
      return (prazo !== '' && prazo <= hoje) || (planejada !== '' && planejada < hoje);
    })
    .sort(porPrazo);

  return { compromissos, planejadas, concluidas, paraConsiderar };
}

export function organizarArea(tasks: Task[], areaId: string, hoje: string) {
  const daArea = tasks.filter((t) => t.areaId === areaId && aberta(t));
  const ehDeHoje = (t: Task) => diaDe(t.plannedFor) === hoje || diaDe(t.dueDate) === hoje;

  return {
    hoje: daArea.filter(ehDeHoje).sort(porHorario),
    comPrazo: daArea.filter((t) => !ehDeHoje(t) && t.dueDate).sort(porPrazo),
    semPrazo: daArea
      .filter((t) => !ehDeHoje(t) && !t.dueDate)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  };
}

export function pendenciasPorArea(tasks: Task[]): Record<string, number> {
  const contagem: Record<string, number> = {};
  for (const t of tasks) {
    if (t.areaId && aberta(t)) contagem[t.areaId] = (contagem[t.areaId] ?? 0) + 1;
  }
  return contagem;
}
