const router = require('express').Router();
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const pool = require('../db');

const MEM_DEFAULT = [
  {
    id: 1,
    nombre: 'Detallado (inyectado, con aditivos)',
    texto: 'Carne de Res, sal, fosfatos, dextrosa, antioxidantes, hidrocoloides, acidos organicos, mezcla de fibras vegetales, dioxido de silicio, antiespumante, enzimas.',
    activo: 1,
  },
  {
    id: 2,
    nombre: 'Simple (solo carne y/o hueso de res)',
    texto: 'Carne de Res y/o hueso de res.',
    activo: 1,
  },
];

let memIngredientes = [...MEM_DEFAULT];
let seq = MEM_DEFAULT.length + 1;

async function dbOk() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

router.get('/', auth, async (_req, res) => {
  if (await dbOk()) {
    try {
      const [rows] = await pool.query('SELECT * FROM ingredientes_etiqueta ORDER BY id');
      return res.json(rows);
    } catch {
      /* fallback */
    }
  }
  res.json(memIngredientes);
});

router.post('/', auth, requireAdmin, async (req, res) => {
  const { nombre, texto } = req.body;
  if (!nombre || !texto) {
    return res.status(400).json({ error: 'Nombre y texto son requeridos' });
  }

  if (await dbOk()) {
    try {
      const [result] = await pool.query(
        'INSERT INTO ingredientes_etiqueta (nombre, texto, activo) VALUES (?, ?, 1)',
        [nombre.trim(), texto.trim()]
      );
      const [rows] = await pool.query('SELECT * FROM ingredientes_etiqueta WHERE id=?', [result.insertId]);
      return res.json(rows[0]);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Ya existe una configuración con ese nombre' });
      }
      return res.status(500).json({ error: 'Error al crear ingrediente' });
    }
  }

  const nuevo = { id: seq++, nombre: nombre.trim(), texto: texto.trim(), activo: 1 };
  memIngredientes.push(nuevo);
  res.json(nuevo);
});

router.put('/:id', auth, requireAdmin, async (req, res) => {
  const { nombre, texto, activo } = req.body;
  const id = Number(req.params.id);

  if (await dbOk()) {
    try {
      await pool.query(
        'UPDATE ingredientes_etiqueta SET nombre=?, texto=?, activo=? WHERE id=?',
        [nombre?.trim(), texto?.trim(), activo !== undefined ? (activo ? 1 : 0) : 1, id]
      );
      const [rows] = await pool.query('SELECT * FROM ingredientes_etiqueta WHERE id=?', [id]);
      if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
      return res.json(rows[0]);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Ya existe una configuración con ese nombre' });
      }
      return res.status(500).json({ error: 'Error al actualizar ingrediente' });
    }
  }

  const idx = memIngredientes.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  memIngredientes[idx] = {
    ...memIngredientes[idx],
    nombre: nombre?.trim() || memIngredientes[idx].nombre,
    texto: texto?.trim() || memIngredientes[idx].texto,
    activo: activo !== undefined ? (activo ? 1 : 0) : memIngredientes[idx].activo,
  };
  res.json(memIngredientes[idx]);
});

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (await dbOk()) {
    try {
      await pool.query('UPDATE ingredientes_etiqueta SET activo=0 WHERE id=?', [id]);
      return res.json({ ok: true });
    } catch {
      /* fallback */
    }
  }
  const idx = memIngredientes.findIndex((i) => i.id === id);
  if (idx !== -1) memIngredientes[idx].activo = 0;
  res.json({ ok: true });
});

module.exports = router;
