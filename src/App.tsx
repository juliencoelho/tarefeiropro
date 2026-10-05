import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import KanbanPage from './pages/KanbanPage';
import ListPage from './pages/ListPage';
import AgendaPage from './pages/AgendaPage';
import ClientsPage from './pages/ClientsPage';
import SettingsPage from './pages/SettingsPage';
import { useAppStore } from './store/useAppStore';
import { mockTasks, mockClients } from './data/mockData';
import { shouldUseMockData } from './config/app';

function App() {
  const { tasks, clients, setTasks, setClients } = useAppStore();

  // Sementeira: só injeta mocks no primeiro acesso (store vazio).
  // Depois disso, o que vale é o que está persistido em localStorage.
  useEffect(() => {
    if (!shouldUseMockData()) return;
    if (tasks.length === 0 && clients.length === 0) {
      console.log('🎭 Primeiro acesso — semeando dados mock...');
      setTasks(mockTasks);
      setClients(mockClients);
    }
  }, [tasks.length, clients.length, setTasks, setClients]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="lista" element={<ListPage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
