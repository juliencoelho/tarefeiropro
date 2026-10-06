import { useEffect, useRef, useState } from 'react';
import { Inbox, Plus, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { novaTarefa } from '../../lib/tarefas';

// Atalho N fora de campos de texto, para não atrapalhar quem está digitando
function digitandoEmCampo(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

// Captura rápida para a caixa de entrada: botão + no celular, tecla N no computador.
// Enter salva e mantém aberto para despejar várias coisas seguidas; Esc fecha.
export function QuickCapture() {
  const { isQuickCaptureOpen, setQuickCaptureOpen, isTaskModalOpen, mobileMenuOpen, currentUser, addTask } = useAppStore();
  const [texto, setTexto] = useState('');
  const [anotadas, setAnotadas] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'n' && e.key !== 'N') return;
      if (e.ctrlKey || e.metaKey || e.altKey || digitandoEmCampo(e.target)) return;
      if (isTaskModalOpen) return;
      e.preventDefault();
      setQuickCaptureOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTaskModalOpen, setQuickCaptureOpen]);

  useEffect(() => {
    if (isQuickCaptureOpen) {
      setAnotadas(0);
      inputRef.current?.focus();
    } else {
      setTexto('');
    }
  }, [isQuickCaptureOpen]);

  const salvar = () => {
    const title = texto.trim();
    if (!title) return;
    addTask(novaTarefa(title, currentUser, { inInbox: true }));
    setTexto('');
    setAnotadas((n) => n + 1);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Botão flutuante, só no celular */}
      {!isQuickCaptureOpen && !isTaskModalOpen && !mobileMenuOpen && (
        <button
          onClick={() => setQuickCaptureOpen(true)}
          className="md:hidden fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-30 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center"
          aria-label="Anotar na caixa de entrada"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {isQuickCaptureOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center px-4 pt-[12vh]"
          onClick={() => setQuickCaptureOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Inbox className="w-4 h-4" />
                Anotar na caixa de entrada
              </h2>
              <button
                onClick={() => setQuickCaptureOpen(false)}
                className="p-1 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    salvar();
                  }
                  if (e.key === 'Escape') setQuickCaptureOpen(false);
                }}
                placeholder="O que está na sua cabeça?"
                enterKeyHint="send"
                className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={salvar}
                disabled={!texto.trim()}
                className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white"
                aria-label="Salvar"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
              {anotadas > 0
                ? `${anotadas} ${anotadas === 1 ? 'anotada' : 'anotadas'}. Continue ou feche com Esc.`
                : 'Enter salva e já deixa pronto para a próxima. Esc fecha.'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
