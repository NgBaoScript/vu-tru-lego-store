// Cloudflare Pages Function – /api/products sử dụng Cloudflare D1 (SQLite)
// Thay thế hoàn toàn Supabase. Cần binding D1 tên là `DB` và biến `ADMIN_TOKEN`.

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extra
    }
  });
}

function parseImages(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toClient(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code || '',
    price: Number(row.price || 0),
    category: row.category || 'other',
    desc: row.description || '',
    pieces: row.pieces || '',
    age: row.age || '',
    size: row.box_size || '',
    weight: row.weight || '',
    images: parseImages(row.images),
    badge: row.badge || 'Vũ Trụ LEGO'
  };
}

function toDatabase(p) {
  const images = Array.isArray(p.images) ? p.images.slice(0, 3) : [];
  return {
    id: p.id ? String(p.id).trim() : '',
    name: String(p.name || '').trim(),
    code: String(p.code || '').trim(),
    price: Number(p.price || 0),
    category: String(p.category || 'other').trim() || 'other',
    description: String(p.desc || '').trim(),
    pieces: String(p.pieces || '').trim(),
    age: String(p.age || '').trim(),
    box_size: String(p.size || '').trim(),
    weight: String(p.weight || '').trim(),
    images: JSON.stringify(images),
    imageList: images,
    badge: String(p.badge || 'Vũ Trụ LEGO').trim() || 'Vũ Trụ LEGO'
  };
}

function extractLocalImageIds(imageUrls) {
  const ids = [];
  for (const url of imageUrls || []) {
    if (typeof url !== 'string') continue;
    const match = url.match(/\/api\/image\?id=([A-Za-z0-9_-]+)/);
    if (match && match[1]) ids.push(match[1]);
  }
  return ids;
}

async function deleteImageIds(db, ids) {
  for (const imgId of ids) {
    try {
      await db.prepare('DELETE FROM product_images WHERE id = ?').bind(imgId).run();
    } catch {
      // Bỏ qua nếu bảng ảnh chưa có hoặc lỗi nhỏ khi dọn ảnh cũ
    }
  }
}

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) {
    return json(
      { error: 'Chưa gắn D1 database (binding DB) vào Cloudflare Pages.' },
      500
    );
  }

  const method = request.method;

  try {
    if (method === 'GET') {
      const { results } = await db
        .prepare('SELECT * FROM products ORDER BY created_at DESC, rowid DESC')
        .all();
      return json((results || []).map(toClient));
    }

    // Mọi thao tác ghi đều cần ADMIN_TOKEN
    if (!env.ADMIN_TOKEN) {
      return json({ error: 'Chưa cấu hình ADMIN_TOKEN trên Cloudflare.' }, 500);
    }
    if (request.headers.get('x-admin-token') !== env.ADMIN_TOKEN) {
      return json({ error: 'Mã quản lý không đúng. Vui lòng kiểm tra lại.' }, 401);
    }

    if (method === 'POST') {
      const body = (await request.json().catch(() => ({}))) || {};
      const payload = toDatabase(body);
      if (!payload.name) {
        return json({ error: 'Vui lòng nhập tên sản phẩm.' }, 400);
      }

      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      await db
        .prepare(
          `INSERT INTO products (
            id, name, code, price, category, description,
            pieces, age, box_size, weight, images, badge, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id,
          payload.name,
          payload.code,
          payload.price,
          payload.category,
          payload.description,
          payload.pieces,
          payload.age,
          payload.box_size,
          payload.weight,
          payload.images,
          payload.badge,
          createdAt
        )
        .run();

      const created = await db
        .prepare('SELECT * FROM products WHERE id = ?')
        .bind(id)
        .first();
      return json(toClient(created), 201);
    }

    if (method === 'PUT') {
      const body = (await request.json().catch(() => ({}))) || {};
      const payload = toDatabase(body);
      if (!payload.id) {
        return json({ error: 'Thiếu mã sản phẩm.' }, 400);
      }
      if (!payload.name) {
        return json({ error: 'Vui lòng nhập tên sản phẩm.' }, 400);
      }

      const existing = await db
        .prepare('SELECT * FROM products WHERE id = ?')
        .bind(payload.id)
        .first();
      if (!existing) {
        return json({ error: 'Không tìm thấy sản phẩm để cập nhật.' }, 404);
      }

      await db
        .prepare(
          `UPDATE products SET
            name = ?, code = ?, price = ?, category = ?, description = ?,
            pieces = ?, age = ?, box_size = ?, weight = ?, images = ?, badge = ?
          WHERE id = ?`
        )
        .bind(
          payload.name,
          payload.code,
          payload.price,
          payload.category,
          payload.description,
          payload.pieces,
          payload.age,
          payload.box_size,
          payload.weight,
          payload.images,
          payload.badge,
          payload.id
        )
        .run();

      // Dọn ảnh cũ không còn dùng nữa trong SQLite
      const oldImgIds = extractLocalImageIds(parseImages(existing.images));
      const newImgIds = new Set(extractLocalImageIds(payload.imageList));
      const removedIds = oldImgIds.filter((x) => !newImgIds.has(x));
      if (removedIds.length) {
        await deleteImageIds(db, removedIds);
      }

      const updated = await db
        .prepare('SELECT * FROM products WHERE id = ?')
        .bind(payload.id)
        .first();
      return json(toClient(updated));
    }

    if (method === 'DELETE') {
      const id = new URL(request.url).searchParams.get('id') || '';
      if (!id) {
        return json({ error: 'Thiếu mã sản phẩm.' }, 400);
      }

      const existing = await db
        .prepare('SELECT images FROM products WHERE id = ?')
        .bind(id)
        .first();

      await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();

      if (existing) {
        const oldImgIds = extractLocalImageIds(parseImages(existing.images));
        if (oldImgIds.length) {
          await deleteImageIds(db, oldImgIds);
        }
      }

      return json({ ok: true });
    }

    return json({ error: 'Method not allowed' }, 405, {
      Allow: 'GET, POST, PUT, DELETE'
    });
  } catch (error) {
    console.error('products d1 api:', error);
    return json(
      { error: error.message || 'Không thể xử lý dữ liệu sản phẩm.' },
      500
    );
  }
}
