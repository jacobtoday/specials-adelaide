const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(express.json({ limit: '5mb' })); // larger limit for SVG logo data

// ── DATABASE ──
// Railway automatically provides DATABASE_URL when you add a Postgres service
// and link it to this service's environment variables.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
    ? { rejectUnauthorized: false }
    : false,
});

pool.connect()
  .then(client => {
    console.log('Connected to Postgres');
    client.release();
  })
  .catch(err => {
    console.error('Could not connect to Postgres:', err.message);
    console.error('Make sure DATABASE_URL is set and schema.sql has been run.');
  });

// ════════════════════════════════════════════
// API ROUTES
// ════════════════════════════════════════════

// --- RESTAURANTS ---
app.get('/api/restaurants', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM restaurants ORDER BY name');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/restaurants', async (req, res) => {
  try {
    const r = req.body;
    await pool.query(
      `INSERT INTO restaurants (id,name,suburb,cuisine,addr,phone,website,lat,lng,active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, suburb=$3, cuisine=$4, addr=$5, phone=$6, website=$7, lat=$8, lng=$9, active=$10`,
      [r.id, r.name, r.suburb, r.cuisine || '', r.addr || '', r.phone || '', r.website || '',
       r.lat != null && r.lat !== '' ? Number(r.lat) : null,
       r.lng != null && r.lng !== '' ? Number(r.lng) : null,
       r.active !== false]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/restaurants/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM restaurants WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SPECIALS ---
app.get('/api/specials', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM specials ORDER BY created_at');
    const mapped = rows.map(s => ({
      id: s.id, rid: s.rid, name: s.name, desc: s.desc_text,
      price: parseFloat(s.price), food: s.food, session: s.session,
      days: s.days, from: s.from_time, until: s.until_time, active: s.active
    }));
    res.json(mapped);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/specials', async (req, res) => {
  try {
    const s = req.body;
    await pool.query(
      `INSERT INTO specials (id,rid,name,desc_text,price,food,session,days,from_time,until_time,active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO UPDATE SET
         rid=$2, name=$3, desc_text=$4, price=$5, food=$6, session=$7, days=$8, from_time=$9, until_time=$10, active=$11`,
      [s.id, s.rid, s.name, s.desc || '', s.price || 0, s.food || '', s.session || '', s.days || [], s.from || '', s.until || '', s.active !== false]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/specials/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM specials WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- LOGOS ---
app.get('/api/logos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT rid,type,data FROM logos');
    const out = {};
    rows.forEach(r => { out[r.rid] = { type: r.type, data: r.data }; });
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/logos/:rid', async (req, res) => {
  try {
    const { type, data } = req.body;
    await pool.query(
      `INSERT INTO logos (rid,type,data,updated_at) VALUES ($1,$2,$3,now())
       ON CONFLICT (rid) DO UPDATE SET type=$2, data=$3, updated_at=now()`,
      [req.params.rid, type, data]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/logos/:rid', async (req, res) => {
  try {
    await pool.query('DELETE FROM logos WHERE rid=$1', [req.params.rid]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/logos', async (req, res) => {
  try {
    await pool.query('DELETE FROM logos');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SETTINGS ---
app.get('/api/settings', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key,value FROM settings');
    const out = {};
    rows.forEach(r => { out[r.key] = r.value; });
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/settings', async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        `INSERT INTO settings (key,value) VALUES ($1,$2)
         ON CONFLICT (key) DO UPDATE SET value=$2`,
        [key, String(value)]
      );
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- BULK RESET (clear all specials, keep restaurants) ---
app.post('/api/reset-specials', async (req, res) => {
  try {
    await pool.query('DELETE FROM specials');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- HEALTHCHECK ---
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (e) {
    res.json({ ok: false, db: 'disconnected', error: e.message });
  }
});

// ════════════════════════════════════════════
// STATIC FILES
// ════════════════════════════════════════════
app.use(express.static(path.join(__dirname), {
  index: 'index.html',
  extensions: ['html'],
}));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Specials Adelaide running on port ${PORT}`);
});
