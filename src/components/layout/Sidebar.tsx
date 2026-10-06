import { 
  LayoutDashboard, 
  Kanban, 
  List, 
  Calendar, 
  Users, 
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

const menuItems = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/'
  },
  {
    icon: Kanban,
    label: 'Kanban',
    path: '/kanban'
  },
  {
    icon: List,
    label: 'Lista',
    path: '/lista'
  },
  {
    icon: Calendar,
    label: 'Agenda',
    path: '/agenda'
  },
  {
    icon: Users,
    label: 'Clientes',
    path: '/clientes'
  },
  {
    icon: Settings,
    label: 'Configurações',
    path: '/configuracoes'
  }
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, setTaskModalOpen, mobileMenuOpen, setMobileMenuOpen } = useAppStore();
  const location = useLocation();
  // No celular a barra é uma gaveta e sempre abre inteira; recolher só vale no desktop
  const collapsed = sidebarCollapsed && !mobileMenuOpen;

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col z-40",
      collapsed ? "w-16" : "w-64",
      mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
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
      <div className="p-4">
        <button
          onClick={() => {
            setMobileMenuOpen(false);
            setTaskModalOpen(true);
          }}
          className={cn(
            "w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2",
            "p-3"
          )}
        >
          <Plus className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Nova Tarefa</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-300 text-center">
            Tarefeiro Pro v1.0
          </div>
        </div>
      )}
    </aside>
  );
}