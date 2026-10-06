interface SecaoProps {
  titulo: string;
  quantidade?: number;
  icone?: React.ReactNode;
  children: React.ReactNode;
}

export function Secao({ titulo, quantidade, icone, children }: SecaoProps) {
  return (
    <section>
      <h2 className="flex items-center gap-2 px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
        {icone}
        {titulo}
        {quantidade !== undefined && quantidade > 0 && (
          <span className="font-normal normal-case tracking-normal text-slate-400 dark:text-slate-400">{quantidade}</span>
        )}
      </h2>
      {children}
    </section>
  );
}

export function ListaVazia({ children }: { children: React.ReactNode }) {
  return <p className="px-3 py-3 text-sm text-slate-500 dark:text-slate-300">{children}</p>;
}
