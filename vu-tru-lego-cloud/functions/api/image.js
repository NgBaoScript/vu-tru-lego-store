// Cloudflare Pages Function – /api/image?id=<id>
// Đọc ảnh từ bảng `product_images` trong Cloudflare D1 (SQLite) và trả về kèm CDN Cache-Control 1 năm.

function toUint8Array(data) {
  if (!data) return null;
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (Array.isArray(data)) return new Uint8Array(data);
  if (typeof data === 'string') {
    const bin = atob(data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  if (typeof data === 'object' && data.buffer instanceof ArrayBuffer) {
    return new Uint8Array(data.buffer, data.byteOffset || 0, data.byteLength);
  }
  return null;
}

export async function onRequest({ request, env }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' }
    });
  }

  const db = env.DB;
  if (!db) {
    return new Response('Database not configured', { status: 500 });
  }

  const id = new URL(request.url).searchParams.get('id') || '';
  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  try {
    const row = await db
      .prepare('SELECT mime_type, data FROM product_images WHERE id = ?')
      .bind(id)
      .first();

    if (!row || !row.data) {
      return new Response('Not found', { status: 404 });
    }

    const bytes = toUint8Array(row.data);
    if (!bytes) {
      return new Response('Invalid image data', { status: 500 });
    }

    return new Response(request.method === 'HEAD' ? null : bytes, {
      status: 200,
      headers: {
        'content-type': row.mime_type || 'image/webp',
        'cache-control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('image d1 api:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
