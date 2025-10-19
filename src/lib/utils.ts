import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Cria uma data local a partir de uma string no formato yyyy-MM-dd
 * Evita problemas de fuso horário ao interpretar a data como local em vez de UTC
 */
export function createLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month é 0-indexed
}

/**
 * Converte uma data para string no formato yyyy-MM-dd (local)
 * Usado para inputs type="date"
 */
export function formatDateForInput(date: Date | string): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? createLocalDate(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Converte uma data para exibição no formato dd/MM/yyyy
 * Garante que a data seja interpretada como local
 */
export function formatDateForDisplay(date: Date | string): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? createLocalDate(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}
