// Cloudflare Pages Function – /api/upload lưu ảnh trực tiếp vào Cloudflare D1 (SQLite)
// Ảnh đã được trình duyệt nén thành WebP (~50–180KB), trả về URL `/api/image?id=<id>`.

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

// Giới hạn mỗi ảnh sau nén ≤ 1.8MB để nằm gọn trong giới hạn row của Cloudflare D1
const MAX_BYTES = 1800 * 1024;

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
  }

  try {
    if (!env.ADMIN_TOKEN || request.headers.get('x-admin-token') !== env.ADMIN_TOKEN) {
      return json({ error: 'Mã quản lý không đúng.' }, 401);
    }

    const db = env.DB;
    if (!db) {
      return json({ error: 'Chưa gắn D1 database (binding DB) trên Cloudflare.' }, 500);
    }

    const body = (await request.json().catch(() => ({}))) || {};
    const dataUrl = body.dataUrl;
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return json({ error: 'Ảnh không hợp lệ.' }, 400);
    }

    const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      return json({ error: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.' }, 400);
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const bin = atob(base64Data);
    if (bin.length > MAX_BYTES) {
      return json({ error: 'Ảnh sau nén vẫn quá lớn (tối đa 1.8MB).' }, 413);
    }

    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }

    const safeName = String(body.fileName || 'product')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 40);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    await db
      .prepare(
        'INSERT INTO product_images (id, file_name, mime_type, data, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(id, safeName, mimeType, bytes.buffer, new Date().toISOString())
      .run();

    return json({ url: `/api/image?id=${encodeURIComponent(id)}` }, 201);
  } catch (error) {
    console.error('upload d1 api:', error);
    return json({ error: error.message || 'Không thể tải ảnh lên.' }, 500);
  }
}
