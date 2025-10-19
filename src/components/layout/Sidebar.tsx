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
  const { sidebarCollapsed, toggleSidebar, setTaskModalOpen } = useAppStore();
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col z-40",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed && (
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Tarefeiro Pro
          </h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <button
          onClick={() => setTaskModalOpen(true)}
          className={cn(
            "w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2",
            sidebarCollapsed ? "p-3" : "p-3"
          )}
        >
          <Plus className="w-5 h-5" />
          {!sidebarCollapsed && <span className="font-medium">Nova Tarefa</span>}
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
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                    sidebarCollapsed && "justify-center"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Tarefeiro Pro v1.0
          </div>
        </div>
      )}
    </aside>
  );
}