-- Skema database Laris Manis
-- Jalankan sekali di Supabase Dashboard > SQL Editor > New query > Run.
-- Aman dijalankan ulang (idempotent).

create table if not exists public.orders (
  "id"             text primary key,
  "customerName"   text        not null,
  "customerPhone"  text        not null,
  "customerClass"  text        not null default '',
  "pickupTime"     text,
  "items"          jsonb       not null,
  "totalItems"     integer     not null check ("totalItems" >= 0),
  "totalPieces"    integer     not null check ("totalPieces" >= 0),
  "subtotal"       integer     not null check ("subtotal" >= 0),
  "discountAmount" integer     not null default 0 check ("discountAmount" >= 0),
  "referralCode"   text,
  "total"          integer     not null check ("total" >= 0),
  "paymentMethod"  text        not null check ("paymentMethod" in ('qris', 'tunai')),
  "paymentStatus"  text        not null check ("paymentStatus" in ('pending', 'verified', 'rejected')),
  "orderStatus"    text        not null check ("orderStatus" in (
                     'menunggu_pembayaran', 'menunggu_verifikasi', 'sedang_diproses',
                     'siap_diambil', 'selesai', 'dibatalkan')),
  "customerNotes"  text,
  "adminNotes"     text,
  "createdAt"      timestamptz not null default now(),
  "expiresAt"      timestamptz not null
);

create index if not exists orders_created_at_idx on public.orders ("createdAt" desc);

-- Row Level Security
-- Aplikasi tidak punya login: pelanggan dan admin (PIN di browser) sama-sama memakai
-- kunci publik. Karena itu kunci publik diberi akses baca, tambah, ubah status, dan hapus.
alter table public.orders enable row level security;

drop policy if exists "orders_select" on public.orders;
drop policy if exists "orders_insert" on public.orders;
drop policy if exists "orders_update" on public.orders;
drop policy if exists "orders_delete" on public.orders;

create policy "orders_select" on public.orders for select to anon, authenticated using (true);
create policy "orders_insert" on public.orders for insert to anon, authenticated with check (true);
create policy "orders_update" on public.orders for update to anon, authenticated using (true) with check (true);
create policy "orders_delete" on public.orders for delete to anon, authenticated using (true);

-- Batasi perubahan hanya ke kolom status, supaya total/isi pesanan tidak bisa diubah lewat API
revoke update on public.orders from anon, authenticated;
grant select, insert, delete on public.orders to anon, authenticated;
grant update ("orderStatus", "paymentStatus", "adminNotes") on public.orders to anon, authenticated;

-- Realtime: pesanan baru langsung muncul di dashboard admin, status langsung sampai ke pelanggan
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

-- Kode pesanan LM-DDMMYY-NNN: urutan reset tiap hari (hari kalender Jakarta).
-- Nomor diambil atomik di database sehingga tidak pernah kembar walau dua pembeli klik bersamaan.
create table if not exists public.order_counters (
  "day"  date    primary key,
  "last" integer not null default 0
);
alter table public.order_counters enable row level security;
revoke all on public.order_counters from anon, authenticated;

create or replace function public.next_order_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (now() at time zone 'Asia/Jakarta')::date;
  n integer;
begin
  insert into public.order_counters ("day", "last") values (d, 1)
  on conflict ("day") do update set "last" = public.order_counters."last" + 1
  returning "last" into n;
  return 'LM-' || to_char(d, 'DDMMYY') || '-' ||
         case when n < 1000 then lpad(n::text, 3, '0') else n::text end;
end;
$$;

revoke all on function public.next_order_code() from public;
grant execute on function public.next_order_code() to anon, authenticated;
