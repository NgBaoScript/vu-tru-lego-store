-- Chạy toàn bộ SQL này trong Supabase > SQL Editor > New query.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  code text not null default '',
  price numeric(12,0) not null default 0,
  category text not null default 'other',
  description text not null default '',
  pieces text not null default '',
  age text not null default '',
  box_size text not null default '',
  weight text not null default '',
  images text[] not null default '{}',
  badge text not null default 'Vũ Trụ LEGO',
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
-- Không tạo policy public. Trình duyệt không truy cập database trực tiếp.
-- Vercel API dùng SUPABASE_SERVICE_ROLE_KEY ở phía máy chủ.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;
