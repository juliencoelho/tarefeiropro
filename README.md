# Tarefeiro Pro

Central pessoal de tarefas, compromissos e monitoramento (segundo cérebro).

- **Front:** React + Vite + Tailwind + Zustand
- **Banco:** Supabase (Postgres com RLS por usuário e tempo real)
- **Deploy:** Vercel, publicado automaticamente a cada push na `master`

## Rodar localmente

```bash
npm install
cp .env.example .env   # preencha URL e chave publicável do Supabase
npm run dev
```

## Banco de dados

O schema está em `supabase/migrations/`. Toda tabela tem dono (`user_id`) e só o dono
enxerga as próprias linhas. Só e-mails cadastrados em `public.allowed_signups` conseguem
criar conta.

O assistente (Cowork) lê e escreve direto no banco pelo conector do Supabase. Ao inserir
por SQL, informe `user_id` e use `source = 'cowork'`.
