-- Schema SQLite cho Cloudflare D1 (thay thế hoàn toàn Supabase)
-- Chạy lệnh khởi tạo:
--   npx wrangler d1 execute vu-tru-lego-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL DEFAULT '',
  pieces TEXT NOT NULL DEFAULT '',
  age TEXT NOT NULL DEFAULT '',
  box_size TEXT NOT NULL DEFAULT '',
  weight TEXT NOT NULL DEFAULT '',
  images TEXT NOT NULL DEFAULT '[]',
  badge TEXT NOT NULL DEFAULT 'Vũ Trụ LEGO',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
