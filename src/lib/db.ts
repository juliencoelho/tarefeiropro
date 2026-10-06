// Conversão entre as linhas do Supabase (snake_case, datas como texto)
// e os tipos usados pelas telas (camelCase, Date).
import { Area, Client, Comment, Subtask, Task, User } from '../types';
import { createLocalDate, formatDateForInput } from './utils';

type Row = Record<string, any>;

// Colunas `date` chegam como 'yyyy-MM-dd' e representam um dia, não um instante:
// interpretar como data local evita o dia "voltar um" por causa do fuso.
const dayFromDb = (value: string | null): Date | undefined =>
  value ? createLocalDate(value) : undefined;

const dayToDb = (value: Date | string | undefined | null): string | null =>
  value ? formatDateForInput(value) || null : null;

const instantFromDb = (value: string | null): Date | undefined =>
  value ? new Date(value) : undefined;

const instantToDb = (value: Date | undefined | null): string | null =>
  value ? new Date(value).toISOString() : null;

// Colunas `time` chegam como 'HH:mm:ss'; as telas usam 'HH:mm'.
const timeFromDb = (value: string | null): string | undefined =>
  value ? value.slice(0, 5) : undefined;

const emptyToNull = (value: string | undefined | null): string | null =>
  value ? value : null;

const reviveComment = (c: Row): Comment => ({ ...c, createdAt: new Date(c.createdAt) } as Comment);

const reviveSubtask = (s: Row): Subtask => ({
  ...s,
  createdAt: new Date(s.createdAt),
  comments: (s.comments ?? []).map(reviveComment),
} as Subtask);

export function rowToTask(row: Row, owner: User): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    status: row.status,
    priority: row.priority,
    type: row.type,
    dueDate: dayFromDb(row.due_date),
    originalDueDate: dayFromDb(row.original_due_date),
    extensionCount: row.extension_count ?? 0,
    lastExtensionDate: instantFromDb(row.last_extension_date),
    extensionReason: row.extension_reason ?? undefined,
    startTime: timeFromDb(row.start_time),
    endTime: timeFromDb(row.end_time),
    clientId: row.client_id ?? undefined,
    areaId: row.area_id ?? undefined,
    contactId: row.contact_id ?? undefined,
    plannedFor: dayFromDb(row.planned_for),
    inInbox: row.in_inbox ?? false,
    source: row.source ?? 'app',
    assignedTo: row.assigned_to ?? [],
    createdBy: owner,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: instantFromDb(row.completed_at),
    subtasks: (row.subtasks ?? []).map(reviveSubtask),
    comments: (row.comments ?? []).map(reviveComment),
    attachments: (row.attachments ?? []).map((a: Row) => ({ ...a, uploadedAt: new Date(a.uploadedAt) })),
    isVisibleToAll: row.is_visible_to_all ?? true,
    tags: row.tags ?? [],
  };
}

// Cada campo da tarefa e como ele vai para o banco. Campos fora daqui
// (createdBy, updatedAt) não são gravados: o dono é o usuário logado e
// updated_at é preenchido por trigger.
const taskFieldToDb: Partial<Record<keyof Task, (value: any) => [string, unknown]>> = {
  id: (v) => ['id', v],
  title: (v) => ['title', v],
  description: (v) => ['description', v ?? ''],
  status: (v) => ['status', v],
  priority: (v) => ['priority', v],
  type: (v) => ['type', v],
  dueDate: (v) => ['due_date', dayToDb(v)],
  originalDueDate: (v) => ['original_due_date', dayToDb(v)],
  extensionCount: (v) => ['extension_count', v ?? 0],
  lastExtensionDate: (v) => ['last_extension_date', instantToDb(v)],
  extensionReason: (v) => ['extension_reason', v ?? null],
  startTime: (v) => ['start_time', emptyToNull(v)],
  endTime: (v) => ['end_time', emptyToNull(v)],
  clientId: (v) => ['client_id', emptyToNull(v)],
  areaId: (v) => ['area_id', emptyToNull(v)],
  contactId: (v) => ['contact_id', emptyToNull(v)],
  plannedFor: (v) => ['planned_for', dayToDb(v)],
  inInbox: (v) => ['in_inbox', v ?? false],
  source: (v) => ['source', v ?? 'app'],
  assignedTo: (v) => ['assigned_to', v ?? []],
  completedAt: (v) => ['completed_at', instantToDb(v)],
  subtasks: (v) => ['subtasks', v ?? []],
  comments: (v) => ['comments', v ?? []],
  attachments: (v) => ['attachments', v ?? []],
  isVisibleToAll: (v) => ['is_visible_to_all', v ?? true],
  tags: (v) => ['tags', v ?? []],
};

// Converte um patch parcial. Uma chave presente com valor `undefined`
// significa "limpar o campo" (ex.: tirar o prazo), e vira null no banco.
export function taskPatchToRow(patch: Partial<Task>): Row {
  const row: Row = {};
  for (const key of Object.keys(patch) as (keyof Task)[]) {
    const convert = taskFieldToDb[key];
    if (!convert) continue;
    const [column, value] = convert(patch[key]);
    row[column] = value;
  }
  return row;
}

export function rowToClient(row: Row): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    company: row.company ?? undefined,
    color: row.color,
    areaId: row.area_id ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

export function clientPatchToRow(patch: Partial<Client>): Row {
  const row: Row = {};
  if ('id' in patch) row.id = patch.id;
  if ('name' in patch) row.name = patch.name;
  if ('email' in patch) row.email = emptyToNull(patch.email);
  if ('phone' in patch) row.phone = emptyToNull(patch.phone);
  if ('company' in patch) row.company = emptyToNull(patch.company);
  if ('color' in patch) row.color = patch.color;
  if ('areaId' in patch) row.area_id = emptyToNull(patch.areaId);
  if ('notes' in patch) row.notes = emptyToNull(patch.notes);
  return row;
}

export function rowToArea(row: Row): Area {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon ?? undefined,
    position: row.position,
    archived: row.archived,
    createdAt: new Date(row.created_at),
  };
}

export function rowToProfile(row: Row): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? '',
    avatar: row.avatar || undefined,
    phone: row.phone ?? undefined,
    bio: row.bio ?? undefined,
    role: row.role,
    preferences: row.preferences ?? undefined,
    createdAt: instantFromDb(row.created_at),
    updatedAt: instantFromDb(row.updated_at),
  };
}

export function profilePatchToRow(patch: Partial<User>): Row {
  const row: Row = {};
  if ('name' in patch) row.name = patch.name ?? '';
  if ('email' in patch) row.email = emptyToNull(patch.email);
  if ('avatar' in patch) row.avatar = emptyToNull(patch.avatar);
  if ('phone' in patch) row.phone = emptyToNull(patch.phone);
  if ('bio' in patch) row.bio = emptyToNull(patch.bio);
  if ('preferences' in patch) row.preferences = patch.preferences ?? null;
  return row;
}

export function areaPatchToRow(patch: Partial<Area>): Row {
  const row: Row = {};
  if ('id' in patch) row.id = patch.id;
  if ('name' in patch) row.name = patch.name;
  if ('color' in patch) row.color = patch.color;
  if ('icon' in patch) row.icon = emptyToNull(patch.icon);
  if ('position' in patch) row.position = patch.position;
  if ('archived' in patch) row.archived = patch.archived;
  return row;
}
