-- Username-only shared access. No Supabase Auth is used.
create table if not exists public.users (
 id uuid primary key default gen_random_uuid(),
 username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
 created_at timestamptz not null default now()
);
create table if not exists public.expenses (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.users(id) on delete cascade,
 title text not null check (length(trim(title)) between 1 and 100),
 amount numeric(12,2) not null check (amount > 0 and amount <= 100000000),
 category text not null check (category in ('Groceries','Food & drinks','Transport','Bills','Shopping','Subscriptions','Other')),
 kind text not null check (kind in ('want','need')),
 date date not null,
 created_at timestamptz not null default now()
);
create index if not exists expenses_user_date_idx on public.expenses(user_id,date);
create table if not exists public.budgets (
 user_id uuid primary key references public.users(id) on delete cascade,
 amount numeric(12,2) not null default 20000 check (amount > 0 and amount <= 100000000)
);
alter table public.users enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
drop policy if exists username_access on public.users;
create policy username_access on public.users for all to anon using (true) with check (true);
drop policy if exists username_expenses on public.expenses;
create policy username_expenses on public.expenses for all to anon using (true) with check (true);
drop policy if exists username_budgets on public.budgets;
create policy username_budgets on public.budgets for all to anon using (true) with check (true);
grant select, insert, update on public.users to anon;
grant select, insert, update, delete on public.expenses to anon;
grant select, insert, update on public.budgets to anon;

-- Run this section for existing projects too. Older expenses retain an unspecified source.
alter table public.expenses add column if not exists payment_source text
 check (payment_source in ('card','gpay','cash'));
create table if not exists public.wallets (
 user_id uuid primary key references public.users(id) on delete cascade,
 data jsonb not null check (jsonb_typeof(data) = 'object'),
 updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
drop policy if exists username_wallets on public.wallets;
create policy username_wallets on public.wallets for all to anon using (true) with check (true);
grant select, insert, update on public.wallets to anon;
