import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TaskModal } from '../modals/TaskModal';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

export function Layout() {
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <Sidebar />

      {/* Fundo escurecido atrás da gaveta no celular */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={cn(
        'flex-1 flex flex-col min-w-0 transition-all duration-300',
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      )}>
        <Header />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      <TaskModal />
    </div>
  );
}
