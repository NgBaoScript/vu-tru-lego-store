const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected || req.headers['x-admin-token'] !== expected) {
      return res.status(401).json({ error: 'Mã quản lý không đúng.' });
    }
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Chưa cấu hình Supabase trên Vercel.' });
    }
    const { dataUrl, fileName } = req.body || {};
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Ảnh không hợp lệ.' });
    }
    const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return res.status(400).json({ error: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.' });
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 3 * 1024 * 1024) return res.status(413).json({ error: 'Ảnh sau nén vẫn quá lớn (tối đa 3MB).' });
    const ext = match[1] === 'image/png' ? 'png' : match[1] === 'image/webp' ? 'webp' : 'jpg';
    const safeName = String(fileName || 'product').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 40);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}.${ext}`;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { error } = await supabase.storage.from('product-images').upload(path, buffer, {
      contentType: match[1],
      upsert: false,
      cacheControl: '31536000'
    });
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return res.status(201).json({ url: data.publicUrl });
  } catch (error) {
    console.error('upload api:', error);
    return res.status(500).json({ error: error.message || 'Không thể tải ảnh lên.' });
  }
};
