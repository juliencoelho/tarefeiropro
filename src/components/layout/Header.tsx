import { Bell, Search, Settings, User, Moon, Sun, Menu, LogOut, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';
import { desconectar, listaSistemas } from '../../lib/sistemas';

export function Header() {
  const { isDarkMode, toggleDarkMode, toggleSidebar, mobileMenuOpen, setMobileMenuOpen, setQuickCaptureOpen, currentUser } = useAppStore();

  // No celular o botão abre a gaveta; no desktop, recolhe/expande a barra lateral
  const handleMenuClick = () => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      toggleSidebar();
    } else {
      setMobileMenuOpen(!mobileMenuOpen);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 md:px-6 sticky top-0 z-20">
      {/* Left side */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <button
          onClick={handleMenuClick}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>

        <span className="md:hidden font-bold text-slate-900 dark:text-white truncate">
          Tarefeiro Pro
        </span>

        <div className="relative hidden lg:block">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar tarefas, clientes..."
            className="pl-10 pr-4 py-2 w-64 lg:w-80 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 md:gap-3">
        {/* Captura rápida (no celular fica no botão flutuante) */}
        <button
          onClick={() => setQuickCaptureOpen(true)}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Anotar na caixa de entrada (tecla N)"
        >
          <Inbox className="w-4 h-4" />
          Anotar
          <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-300">N</kbd>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        {/* Notifications */}
        <button className="hidden sm:block p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
        </button>

        {/* Settings */}
        <Link
          to="/configuracoes"
          className="hidden sm:block p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Configurações"
        >
          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Link>

        {/* User menu */}
        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {currentUser.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              {currentUser.role === 'admin' ? 'Administrador' : 'Usuário'}
            </p>
          </div>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt="Avatar do usuário"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          <button
            onClick={async () => {
              // Sair do Tarefeiro também desconecta BasePro e Nexo neste aparelho
              await Promise.all(listaSistemas.map(desconectar));
              await supabase.auth.signOut();
            }}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Sair"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
}
