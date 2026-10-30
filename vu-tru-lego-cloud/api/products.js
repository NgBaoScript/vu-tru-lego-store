const { createClient } = require('@supabase/supabase-js');

function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trên Vercel.');
  return createClient(url, key, { auth: { persistSession: false } });
}

function requireAdmin(req, res) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    res.status(500).json({ error: 'Chưa cấu hình ADMIN_TOKEN trên Vercel.' });
    return false;
  }
  if (req.headers['x-admin-token'] !== expected) {
    res.status(401).json({ error: 'Mã quản lý không đúng. Vui lòng kiểm tra lại.' });
    return false;
  }
  return true;
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
    images: row.images || [],
    badge: row.badge || 'Vũ Trụ LEGO'
  };
}

function toDatabase(p) {
  return {
    id: p.id,
    name: p.name,
    code: p.code || '',
    price: Number(p.price || 0),
    category: p.category || 'other',
    description: p.desc || '',
    pieces: p.pieces || '',
    age: p.age || '',
    box_size: p.size || '',
    weight: p.weight || '',
    images: Array.isArray(p.images) ? p.images.slice(0, 3) : [],
    badge: p.badge || 'Vũ Trụ LEGO'
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const supabase = db();
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data.map(toClient));
    }

    if (!requireAdmin(req, res)) return;

    if (req.method === 'POST') {
      const payload = toDatabase(req.body || {});
      delete payload.id;
      const { data, error } = await supabase.from('products').insert(payload).select('*').single();
      if (error) throw error;
      return res.status(201).json(toClient(data));
    }

    if (req.method === 'PUT') {
      const payload = toDatabase(req.body || {});
      if (!payload.id) return res.status(400).json({ error: 'Thiếu mã sản phẩm.' });
      const { id, ...values } = payload;
      const { data, error } = await supabase.from('products').update(values).eq('id', id).select('*').single();
      if (error) throw error;
      return res.status(200).json(toClient(data));
    }

    if (req.method === 'DELETE') {
      const id = String(req.query.id || '');
      if (!id) return res.status(400).json({ error: 'Thiếu mã sản phẩm.' });
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('products api:', error);
    return res.status(500).json({ error: error.message || 'Không thể xử lý dữ liệu sản phẩm.' });
  }
};
