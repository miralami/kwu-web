-- Skema database Laris Manis
-- Jalankan di Supabase Dashboard > SQL Editor > New query > Run.
-- Aman dijalankan ulang (idempotent).
--
-- MODEL KEAMANAN
--   * Pembeli (kunci publik / role anon) TIDAK bisa membaca, mengubah, atau menghapus tabel orders.
--     Mereka hanya lewat fungsi: create_order, get_my_orders, cancel_my_order.
--     Setiap pesanan punya token rahasia ("accessToken") yang hanya diketahui pembeli itu,
--     karena kode pesanan berurutan (LM-141126-001) mudah ditebak.
--   * Admin = pengguna Supabase Auth yang emailnya terdaftar di tabel admins.
--     Hanya admin yang boleh membaca semua pesanan, mengubah status, dan menghapus.
--
-- LANGKAH SETELAH MENJALANKAN FILE INI (wajib, kalau tidak admin tidak bisa masuk):
--   1. Authentication > Users > Add user: buat akun admin (email + kata sandi kuat).
--   2. Authentication > Sign In / Providers > Email: matikan "Allow new users to sign up".
--   3. Daftarkan emailnya di SQL Editor:
--        insert into public.admins (email) values ('email-admin@contoh.com');

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

-- Token rahasia per pesanan (pesanan lama otomatis mendapat token acak)
alter table public.orders add column if not exists "accessToken" uuid not null default gen_random_uuid();

create index if not exists orders_created_at_idx on public.orders ("createdAt" desc);

-- Daftar admin
create table if not exists public.admins (
  "email" text primary key
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower("email") = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- Row Level Security: hanya admin yang menyentuh tabel langsung
alter table public.orders enable row level security;

drop policy if exists "orders_select" on public.orders;
drop policy if exists "orders_insert" on public.orders;
drop policy if exists "orders_update" on public.orders;
drop policy if exists "orders_delete" on public.orders;
drop policy if exists "orders_admin_all" on public.orders;

create policy "orders_admin_all" on public.orders
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Hak akses tingkat tabel: anon tidak punya apa-apa; admin boleh ubah hanya kolom status
revoke all on public.orders from anon, authenticated;
grant select, insert, delete on public.orders to authenticated;
grant update ("orderStatus", "paymentStatus", "adminNotes") on public.orders to authenticated;

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

revoke all on function public.next_order_code() from public, anon, authenticated;
grant execute on function public.next_order_code() to authenticated;

-- PEMBELI: buat pesanan.
-- Server menentukan kode, status awal (selalu QRIS + belum bayar), total, dan token.
-- Input dibersihkan dan dibatasi, jadi pembeli tidak bisa membuat pesanan yang sudah "lunas".
create or replace function public.create_order(
  p_name  text,
  p_phone text,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  it            jsonb;
  v_items       jsonb := '[]'::jsonb;
  v_qty         integer;
  v_price       integer;
  v_pieces      integer;
  v_subtotal    integer := 0;
  v_pieces_sum  integer := 0;
  v_count       integer := 0;
  v_phone       text;
  v_row         public.orders;
begin
  p_name  := btrim(coalesce(p_name, ''));
  v_phone := btrim(coalesce(p_phone, ''));
  if char_length(p_name) < 1 or char_length(p_name) > 80 then
    raise exception 'nama tidak valid';
  end if;
  if char_length(regexp_replace(v_phone, '\D', '', 'g')) not between 9 and 15
     or char_length(v_phone) > 20 then
    raise exception 'nomor tidak valid';
  end if;
  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1
     or jsonb_array_length(p_items) > 20 then
    raise exception 'item tidak valid';
  end if;

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty    := (it ->> 'quantity')::integer;
    v_price  := (it ->> 'price')::integer;
    v_pieces := (it ->> 'pieces')::integer;
    if v_qty is null or v_qty not between 1 and 99
       or v_price is null or v_price not between 0 and 1000000
       or v_pieces is null or v_pieces not between 1 and 100 then
      raise exception 'item tidak valid';
    end if;
    v_subtotal   := v_subtotal + v_price * v_qty;
    v_pieces_sum := v_pieces_sum + v_pieces * v_qty;
    v_count      := v_count + 1;
    -- hanya kolom yang dikenal yang disimpan (tidak ada data liar dari klien)
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id',          left(coalesce(it ->> 'id', ''), 80),
      'menuItemId',  left(coalesce(it ->> 'menuItemId', ''), 60),
      'name',        left(coalesce(it ->> 'name', ''), 80),
      'optionId',    left(coalesce(it ->> 'optionId', ''), 60),
      'optionLabel', left(coalesce(it ->> 'optionLabel', ''), 80),
      'pieces',      v_pieces,
      'price',       v_price,
      'quantity',    v_qty,
      'notes',       left(coalesce(it ->> 'notes', ''), 80)
    ));
  end loop;

  if v_subtotal > 3000000 then
    raise exception 'total terlalu besar';
  end if;

  insert into public.orders (
    "id", "customerName", "customerPhone", "customerClass", "items", "totalItems", "totalPieces",
    "subtotal", "discountAmount", "total", "paymentMethod", "paymentStatus", "orderStatus",
    "customerNotes", "createdAt", "expiresAt"
  ) values (
    public.next_order_code(), p_name, v_phone, '', v_items, v_count, v_pieces_sum,
    v_subtotal, 0, v_subtotal, 'qris', 'pending', 'menunggu_pembayaran',
    left(btrim(coalesce(p_notes, '')), 120), now(), now()
  ) returning * into v_row;

  return (to_jsonb(v_row) - 'accessToken') || jsonb_build_object('accessToken', v_row."accessToken");
end;
$$;

-- PEMBELI: lihat pesanannya sendiri. Input: [{"id":"LM-...","token":"<accessToken>"}, ...]
-- Hanya pesanan dengan id DAN token yang cocok yang dikembalikan, tanpa kolom token.
create or replace function public.get_my_orders(p_refs jsonb)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(o) - 'accessToken' order by o."createdAt" desc), '[]'::jsonb)
  from public.orders o
  join (
    select r.id, r.token
    from jsonb_to_recordset(
      case when jsonb_typeof(p_refs) = 'array' then p_refs else '[]'::jsonb end
    ) as r(id text, token text)
    limit 30
  ) r on r.id = o."id" and r.token = o."accessToken"::text;
$$;

-- PEMBELI: batalkan pesanannya sendiri, hanya selama belum dibayar.
create or replace function public.cancel_my_order(p_id text, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
     set "orderStatus" = 'dibatalkan'
   where "id" = p_id
     and "accessToken"::text = p_token
     and "paymentStatus" = 'pending'
     and "orderStatus" = 'menunggu_pembayaran';
  return found;
end;
$$;

revoke all on function public.create_order(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.get_my_orders(jsonb) from public, anon, authenticated;
revoke all on function public.cancel_my_order(text, text) from public, anon, authenticated;
grant execute on function public.create_order(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.get_my_orders(jsonb) to anon, authenticated;
grant execute on function public.cancel_my_order(text, text) to anon, authenticated;

-- Realtime: pesanan baru langsung muncul di dashboard admin (mengikuti aturan RLS di atas)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
