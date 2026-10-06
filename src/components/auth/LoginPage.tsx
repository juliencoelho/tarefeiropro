import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Mode = 'entrar' | 'criar';

// O cadastro é bloqueado no banco para e-mails fora da lista `allowed_signups`;
// o Supabase devolve esse bloqueio como erro genérico de banco.
function mensagemDeErro(message: string, mode: Mode): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('Email not confirmed')) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (message.includes('Database error saving new user')) return 'Este e-mail não está autorizado a criar conta.';
  if (message.includes('User already registered')) return 'Já existe uma conta com este e-mail. Use "Entrar".';
  if (message.toLowerCase().includes('password')) return 'A senha precisa ter pelo menos 6 caracteres.';
  return mode === 'entrar' ? 'Não foi possível entrar. Tente de novo.' : 'Não foi possível criar a conta. Tente de novo.';
}

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('entrar');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    if (mode === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(mensagemDeErro(error.message, mode));
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Com a barra final, o endereço casa com o curinga `/**` das Redirect URLs do Supabase
          emailRedirectTo: `${window.location.origin}/`,
          data: { name: name.trim() || undefined },
        },
      });
      if (error) {
        setError(mensagemDeErro(error.message, mode));
      } else if (!data.session) {
        setInfo('Conta criada. Enviamos um link de confirmação para o seu e-mail: confirme e depois entre aqui.');
        setMode('entrar');
      }
    }

    setSubmitting(false);
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tarefeiro Pro</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Suas tarefas, compromissos e pendências em um só lugar
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4"
        >
          {mode === 'criar' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Nome
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Como quer ser chamado"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="voce@empresa.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
          )}
          {info && (
            <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">{info}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-300 mt-4">
          {mode === 'entrar' ? 'Primeiro acesso?' : 'Já tem conta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'entrar' ? 'criar' : 'entrar');
              setError(null);
              setInfo(null);
            }}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            {mode === 'entrar' ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  );
}
