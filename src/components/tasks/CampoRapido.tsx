import { useState } from 'react';
import { Plus } from 'lucide-react';

interface CampoRapidoProps {
  placeholder: string;
  onAdd: (title: string) => void;
  autoFocus?: boolean;
}

// Campo de uma linha: escreve, Enter (ou +) adiciona e o campo fica pronto para o próximo.
export function CampoRapido({ placeholder, onAdd, autoFocus }: CampoRapidoProps) {
  const [texto, setTexto] = useState('');

  const adicionar = () => {
    const title = texto.trim();
    if (!title) return;
    onAdd(title);
    setTexto('');
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={texto}
        autoFocus={autoFocus}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            adicionar();
          }
        }}
        placeholder={placeholder}
        enterKeyHint="done"
        className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={adicionar}
        disabled={!texto.trim()}
        className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors"
        aria-label="Adicionar"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
