import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TaskModal } from '../modals/TaskModal';
import { useAppStore } from '../../store/useAppStore';
import { Toaster } from 'sonner';
import { mockTasks, mockClients } from '../../data/mockData';

export function Layout() {
  const { isDarkMode, sidebarCollapsed, setTasks, setClients } = useAppStore();

  // Carregar dados mockados na inicialização
  useEffect(() => {
    setTasks(mockTasks);
    setClients(mockClients);
  }, [setTasks, setClients]);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          <Header />
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
        <TaskModal />
        <Toaster position="top-right" />
      </div>
    </div>
  );
}