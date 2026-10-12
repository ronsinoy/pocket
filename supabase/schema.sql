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

-- Incoming transactions share the ledger; existing rows remain expenses.
alter table public.expenses add column if not exists transaction_type text not null default 'expense'
 check (transaction_type in ('expense','income'));
alter table public.expenses alter column kind drop not null;
alter table public.expenses drop constraint if exists expenses_classification_check;
alter table public.expenses add constraint expenses_classification_check
 check ((transaction_type = 'expense' and kind is not null and kind in ('want','need'))
 or (transaction_type in ('income','transfer') and kind is null));
create table if not exists public.notepads (
 user_id uuid primary key references public.users(id) on delete cascade,
 content text not null default '' check (length(content) <= 20000),
 updated_at timestamptz not null default now()
);
alter table public.notepads enable row level security;
drop policy if exists username_notepads on public.notepads;
create policy username_notepads on public.notepads for all to anon using (true) with check (true);
grant select, insert, update on public.notepads to anon;

-- Divisions and one-record internal transfers.
alter table public.expenses add column if not exists division_id text;
alter table public.expenses add column if not exists from_account text;
alter table public.expenses add column if not exists to_account text;
alter table public.expenses add column if not exists from_division text;
alter table public.expenses add column if not exists to_division text;
alter table public.expenses drop constraint if exists expenses_transaction_type_check;
alter table public.expenses add constraint expenses_transaction_type_check check (transaction_type in ('expense','income','transfer'));
alter table public.expenses drop constraint if exists expenses_payment_source_check;
alter table public.expenses add constraint expenses_payment_source_check check (payment_source in ('card','gpay','cash','kite'));
alter table public.expenses drop constraint if exists expenses_classification_check;
alter table public.expenses add constraint expenses_classification_check check (
 (transaction_type='expense' and kind is not null and kind in ('want','need'))
 or (transaction_type in ('income','transfer') and kind is null)
);
alter table public.expenses drop constraint if exists expenses_endpoint_check;
alter table public.expenses add constraint expenses_endpoint_check check (
 (transaction_type='transfer' and payment_source is null and division_id is null
  and from_account is not null and from_account in ('cash','gpay','kite')
  and to_account is not null and to_account in ('cash','gpay','kite','card')
  and (to_account<>'card' or to_division is null)
  and (from_account<>to_account or coalesce(from_division,'')<>coalesce(to_division,'')))
 or (transaction_type in ('expense','income') and from_account is null and to_account is null and from_division is null and to_division is null
  and (payment_source is null or (transaction_type='expense' and payment_source in ('cash','gpay','card'))
       or (transaction_type='income' and payment_source in ('cash','gpay','card','kite')))
  and (payment_source is distinct from 'card' or division_id is null))
);
-- Normalize legacy wallet shapes once, preserving every opening amount.
update public.wallets set data=jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(
 data,'{cash,divisions}',coalesce(data->'cash'->'divisions','[]'::jsonb)),
 '{gpay,divisions}',coalesce(data->'gpay'->'divisions','[]'::jsonb)),
 '{kite,amount}',coalesce(data->'kite'->'amount','0'::jsonb)),
 '{kite,as_of}',coalesce(data->'kite'->'as_of',to_jsonb((now() at time zone 'Asia/Kolkata')::date::text))),
 '{version}','2'::jsonb)
where data->>'version' is distinct from '2';
