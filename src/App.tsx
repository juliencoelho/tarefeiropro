import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './components/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import KanbanPage from './pages/KanbanPage';
import ListPage from './pages/ListPage';
import AgendaPage from './pages/AgendaPage';
import ClientsPage from './pages/ClientsPage';
import SettingsPage from './pages/SettingsPage';
import { useAppStore } from './store/useAppStore';
import { useSession } from './hooks/useSession';

function TelaCentral({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 px-4 text-center">
      {children}
    </div>
  );
}

function App() {
  const { session, loading } = useSession();
  const { isDarkMode, dataLoaded, loadAll, subscribeRealtime, clearData } = useAppStore();
  const [loadFailed, setLoadFailed] = useState(false);
  const userId = session?.user.id;

  // Tema no <html>, para valer também na tela de login e no fundo da página
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Ao logar: carrega os dados e passa a ouvir mudanças em tempo real.
  // Ao sair: limpa tudo da memória.
  useEffect(() => {
    if (!userId) {
      clearData();
      return;
    }
    setLoadFailed(false);
    loadAll(userId).then((ok) => setLoadFailed(!ok));
    return subscribeRealtime();
  }, [userId, loadAll, subscribeRealtime, clearData]);

  let content: React.ReactNode;
  if (loading) {
    content = (
      <TelaCentral>
        <Loader2 className="w-6 h-6 animate-spin" />
      </TelaCentral>
    );
  } else if (!session) {
    content = <LoginPage />;
  } else if (loadFailed) {
    content = (
      <TelaCentral>
        <p>Não foi possível carregar seus dados.</p>
        <button
          onClick={() => {
            setLoadFailed(false);
            loadAll(session.user.id).then((ok) => setLoadFailed(!ok));
          }}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          Tentar de novo
        </button>
      </TelaCentral>
    );
  } else if (!dataLoaded) {
    content = (
      <TelaCentral>
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-sm">Carregando suas tarefas…</p>
      </TelaCentral>
    );
  } else {
    content = (
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

  return (
    <>
      {content}
      <Toaster position="top-right" theme={isDarkMode ? 'dark' : 'light'} />
    </>
  );
}

export default App;
