import { useState } from 'react';
import {
  LayoutDashboard,
  Kanban,
  List,
  Calendar,
  Users,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sun,
  Inbox,
  Radar
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { caixaDeEntrada, coresDeArea, pendenciasPorArea } from '../../lib/tarefas';
import { useItensMonitorados } from '../../hooks/useItensMonitorados';

const menuItems = [
  { icon: Sun, label: 'Hoje', path: '/' },
  { icon: Inbox, label: 'Caixa de entrada', path: '/entrada' },
  { icon: Radar, label: 'Monitoramento', path: '/monitoramento' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: Kanban, label: 'Kanban', path: '/kanban' },
  { icon: List, label: 'Lista', path: '/lista' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: LayoutDashboard, label: 'Painel', path: '/painel' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' }
];

export function Sidebar() {
  const {
    sidebarCollapsed, toggleSidebar, setTaskModalOpen, mobileMenuOpen, setMobileMenuOpen,
    tasks, areas, addArea
  } = useAppStore();
  const location = useLocation();
  // No celular a barra é uma gaveta e sempre abre inteira; recolher só vale no desktop
  const collapsed = sidebarCollapsed && !mobileMenuOpen;

  const [criandoArea, setCriandoArea] = useState(false);
  const [nomeArea, setNomeArea] = useState('');

  const naCaixa = caixaDeEntrada(tasks).length;
  const paraCobrar = useItensMonitorados().grupos.atencao.length;
  const pendencias = pendenciasPorArea(tasks);
  const areasAtivas = areas.filter(a => !a.archived);

  const salvarArea = () => {
    const nome = nomeArea.trim();
    if (nome) addArea(nome, coresDeArea[areas.length % coresDeArea.length]);
    setNomeArea('');
    setCriandoArea(false);
  };

  const linkClass = (isActive: boolean) => cn(
    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
    isActive
      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
    collapsed && "justify-center"
  );

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col z-40",
      collapsed ? "w-16" : "w-64",
      mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
        {!collapsed && (
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Tarefeiro Pro
          </h1>
        )}
        <button
          onClick={toggleSidebar}
          className="hidden md:block p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 shrink-0">
        <button
          onClick={() => {
            setMobileMenuOpen(false);
            setTaskModalOpen(true);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 p-3"
        >
          <Plus className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Nova Tarefa</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const contador = item.path === '/entrada' ? naCaixa : item.path === '/monitoramento' ? paraCobrar : 0;
            const corContador = item.path === '/monitoramento' ? 'bg-amber-500' : 'bg-blue-600';

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(linkClass(isActive), 'relative')}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium flex-1">{item.label}</span>
                  )}
                  {contador > 0 && (
                    collapsed ? (
                      <span className={cn('absolute top-1 right-1 w-2 h-2 rounded-full', corContador)} />
                    ) : (
                      <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded-full text-white', corContador)}>
                        {contador}
                      </span>
                    )
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Áreas */}
        <div className="mt-6">
          {!collapsed && (
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Áreas
              </span>
              <button
                onClick={() => setCriandoArea(true)}
                className="p-1 rounded text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Nova área"
                aria-label="Nova área"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
          <ul className="space-y-1">
            {areasAtivas.map((area) => {
              const path = `/area/${area.id}`;
              const quantidade = pendencias[area.id] ?? 0;
              return (
                <li key={area.id}>
                  <Link
                    to={path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={linkClass(location.pathname === path)}
                    title={collapsed ? area.name : undefined}
                  >
                    <span className="w-5 flex justify-center flex-shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: area.color }} />
                    </span>
                    {!collapsed && (
                      <>
                        <span className="font-medium flex-1 truncate">{area.name}</span>
                        {quantidade > 0 && (
                          <span className="text-xs text-slate-500 dark:text-slate-300">{quantidade}</span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          {criandoArea && !collapsed && (
            <input
              autoFocus
              value={nomeArea}
              onChange={(e) => setNomeArea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') salvarArea();
                if (e.key === 'Escape') {
                  setNomeArea('');
                  setCriandoArea(false);
                }
              }}
              onBlur={salvarArea}
              placeholder="Nome da área"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-300 text-center">
            Tarefeiro Pro v1.0
          </div>
        </div>
      )}
    </aside>
  );
}
