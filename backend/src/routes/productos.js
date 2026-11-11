const router = require('express').Router();
const auth   = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const pool   = require('../db');

const TIPOS = ['Ambos', 'De Procarne', 'San Carlos', 'Engorda', 'Corriente'];

const MEM_DEFAULT = [
  { id: 1, codigo: '6077', nombre: 'AGUJA NORTEÑA PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 2, codigo: '2178', nombre: 'AGUJA NORTEÑA NATURAL', tipo_ganado: 'Engorda', activo: true },
  { id: 3, codigo: '6078', nombre: 'ARRACHERA MARINADA PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 4, codigo: '2129', nombre: 'ARRACHERA MARINADA FLAP MEAT PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 5, codigo: '2124', nombre: 'ARRACHERA NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 6, codigo: '6079', nombre: 'BRISKET PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 7, codigo: '2179', nombre: 'BRISKET NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 8, codigo: '2007', nombre: 'CABRERIA PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 9, codigo: '2180', nombre: 'CABRERIA NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 10, codigo: '6117', nombre: 'CARNE PARA ASAR MARINADA PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 11, codigo: '2122', nombre: 'CHAMBERETE PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 12, codigo: '2181', nombre: 'CHAMBERETE NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 13, codigo: '2182', nombre: 'CHULETA DE LOMO/CLUB STEAK PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 14, codigo: '2172', nombre: 'CONCHA PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 15, codigo: '2183', nombre: 'CONCHA NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 16, codigo: '2174', nombre: 'COLA DE RES PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 17, codigo: '2157', nombre: 'COSTILLA CARGADA - SHORT RIB (PIEZA BASICA)', tipo_ganado: 'Engorda', activo: true },
  { id: 18, codigo: '2184', nombre: 'COSTILLA CARGADA/SHORT RIB NATURAL (PIEZA BASICA)', tipo_ganado: 'Engorda', activo: true },
  { id: 19, codigo: '2021', nombre: 'COSTILLA COUNTRY PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 20, codigo: '2185', nombre: 'COSTILLA COUNTRY NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 21, codigo: '2135', nombre: 'COSTILLA DE RIB EYE PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 22, codigo: '2164', nombre: 'COSTILLA SIMPLE CON FLECHA NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 23, codigo: '2131', nombre: 'COSTILLA SIMPLE CON FLECHA PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 24, codigo: '2026', nombre: 'COSTILLA TABLITA PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 25, codigo: '2027', nombre: 'COW BOY PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 26, codigo: '2128', nombre: 'DESHEBRE PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 27, codigo: '2186', nombre: 'DESHEBRE NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 28, codigo: '6080', nombre: 'DIEZMILLO CON HUESO PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 29, codigo: '2134', nombre: 'FILETE DE RES PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 30, codigo: '2187', nombre: 'FILETE DE RES NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 31, codigo: '2188', nombre: 'FURLON DE RES', tipo_ganado: 'Engorda', activo: true },
  { id: 32, codigo: '6075', nombre: 'HUESO TUETANERO PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 33, codigo: '2049', nombre: 'MOLLEJA DE RES PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 34, codigo: '2144', nombre: 'NEW YORK PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 35, codigo: '2189', nombre: 'NEW YORK NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 36, codigo: '6109', nombre: 'PALETA CON HUESO PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 37, codigo: '2190', nombre: 'PALETA CON HUESO NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 38, codigo: '2191', nombre: 'PALETA CON HUESO ROLADA PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 39, codigo: '2192', nombre: 'PALETA CON HUESO ROLADA NATURALPIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 40, codigo: '6100', nombre: 'PECHO CON HUESO PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 41, codigo: '2193', nombre: 'PECHO CON HUESO NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 42, codigo: '2156', nombre: 'PECHO SIN BRISKET PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 43, codigo: '6115', nombre: 'PESCUEZO CON HUESO NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 44, codigo: '6064', nombre: 'PESCUEZO CON HUESO PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 45, codigo: '2136', nombre: 'PESCUEZO SIN HUESO PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 46, codigo: '2194', nombre: 'PESCUEZO SIN HUESO NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 47, codigo: '2123', nombre: 'PRIME RIB CON TAPA PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 48, codigo: '2195', nombre: 'PRIME RIB CON TAPA NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 49, codigo: '2054', nombre: 'PICANHA PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 50, codigo: '2133', nombre: 'RECORTE 80/20 NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 51, codigo: '2132', nombre: 'RECORTE 90/10 NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 52, codigo: '2105', nombre: 'RIB EYE LIP ON PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 53, codigo: '2196', nombre: 'RIB EYE LIP ON NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 54, codigo: '2065', nombre: 'RIB EYE ROLL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 55, codigo: '2197', nombre: 'RIB EYE ROLL NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 56, codigo: '2198', nombre: 'RIÑON DE RES PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 57, codigo: '2113', nombre: 'SET DE PULPAS NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 58, codigo: '2171', nombre: 'SUADERO PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 59, codigo: '2199', nombre: 'SUADERO NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 60, codigo: '2072', nombre: 'T-BONE PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 61, codigo: '2200', nombre: 'T-BONE NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 62, codigo: '2073', nombre: 'TOMAHAWK', tipo_ganado: 'Engorda', activo: true },
  { id: 63, codigo: '2126', nombre: 'TOP SIRLOIN NATURAL PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 64, codigo: '2076', nombre: 'TOP SIRLOIN PIEZA BASICA', tipo_ganado: 'Engorda', activo: true },
  { id: 65, codigo: '6081', nombre: 'AGUJA NORTEÑA SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 66, codigo: '6163', nombre: 'AGUJA NORTEÑA NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 67, codigo: '6085', nombre: 'ARRACHERA MARINADA SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 68, codigo: '6162', nombre: 'CABEZA DE FILETE NATURAL SAN CARLOS', tipo_ganado: 'San Carlos', activo: true },
  { id: 69, codigo: '6164', nombre: 'CABEZA DE FILETE NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 70, codigo: '6113', nombre: 'CARNE PARA ASAR MARINADA SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 71, codigo: '6024', nombre: 'CHAMBERETE SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 72, codigo: '6165', nombre: 'CHAMBERETE NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 73, codigo: '6056', nombre: 'CHULETA DE LOMO / CLUB STEAK SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 74, codigo: '6128', nombre: 'COSTILLA CARGADA/SHORT RIB SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 75, codigo: '6087', nombre: 'CONCHA SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 76, codigo: '6166', nombre: 'COSTILLA CARGADA/SHORT RIB NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 77, codigo: '6042', nombre: 'COSTILLA COUNTRY SAN CARLOS', tipo_ganado: 'San Carlos', activo: true },
  { id: 78, codigo: '6025', nombre: 'COSTILLA SIMPLE CON FLECHA SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 79, codigo: '6167', nombre: 'COSTILLA SIMPLE CON FLECHA NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 80, codigo: '6127', nombre: 'COSTILLA TABLITA SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 81, codigo: '6168', nombre: 'COSTILLA TABLITA NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 82, codigo: '6027', nombre: 'DESHEBRE SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 83, codigo: '6169', nombre: 'DESHEBRE NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 84, codigo: '6028', nombre: 'DIEZMILLO C/HUESO SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 85, codigo: '6082', nombre: 'FILETE DE RES SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 86, codigo: '6170', nombre: 'FILETE DE RES NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 87, codigo: '6083', nombre: 'HUESO TUETANERO SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 88, codigo: '6029', nombre: 'PALETA CON HUESO SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 89, codigo: '6171', nombre: 'PALETA CON HUESO NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 90, codigo: '6172', nombre: 'PALETA CON HUESO ROLADA SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 91, codigo: '6096', nombre: 'PECHO SIN BRISKET SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 92, codigo: '6031', nombre: 'PESCUEZO CON HUESO SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 93, codigo: '6173', nombre: 'PESCUEZO CON HUESO NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 94, codigo: '2162', nombre: 'PESCUEZO DESHUESADO SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 95, codigo: '6174', nombre: 'PESCUEZO DESHUESADO NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 96, codigo: '6137', nombre: 'PRIME RIB CON TAPA PIEZA BASICA SAN CARLOS', tipo_ganado: 'San Carlos', activo: true },
  { id: 97, codigo: '6175', nombre: 'PRIME RIB CON TAPA NATURAL PIEZA BASICA SAN CARLOS', tipo_ganado: 'San Carlos', activo: true },
  { id: 98, codigo: '6035', nombre: 'RECORTE 70/30 NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 99, codigo: '6084', nombre: 'RECORTE 90/10 NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 100, codigo: '6149', nombre: 'RECORTE PULPA PULPA SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 101, codigo: '6176', nombre: 'RIÑON DE RES SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 102, codigo: '6036', nombre: 'RIB EYE ROLL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 103, codigo: '6156', nombre: 'SET DE PULPAS NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 104, codigo: '6040', nombre: 'SET DE PULPAS SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 105, codigo: '6088', nombre: 'SUADERO SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 106, codigo: '6177', nombre: 'SUADERO SAN CARLOS NATURAL PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 107, codigo: '6038', nombre: 'T-BONE SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 108, codigo: '6178', nombre: 'T-BONE SAN CARLOS NATURAL PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 109, codigo: '6039', nombre: 'TOP SIRLOIN SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
  { id: 110, codigo: '6179', nombre: 'TOP SIRLOIN NATURAL SAN CARLOS PIEZA BASICA', tipo_ganado: 'San Carlos', activo: true },
];

let memProductos = [...MEM_DEFAULT];
let seq = MEM_DEFAULT.length + 1;

async function dbOk() {
  try { await pool.query('SELECT 1'); return true; } catch { return false; }
}

router.get('/', auth, async (req, res) => {
  if (await dbOk()) {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, ie.nombre AS ingrediente_nombre, ie.texto AS ingrediente_texto
        FROM productos p
        LEFT JOIN ingredientes_etiqueta ie ON p.ingrediente_id = ie.id
        ORDER BY p.codigo
      `);
      if (rows.length) return res.json(rows);
    } catch { /* tabla no existe */ }
  }
  res.json(memProductos);
});

router.get('/tipos-ganado', auth, (_req, res) => res.json(TIPOS));

router.post('/', auth, requireAdmin, async (req, res) => {
  const { codigo, nombre, tipo_ganado, ingrediente_id } = req.body;
  if (!codigo || !nombre) return res.status(400).json({ error: 'codigo y nombre son requeridos' });

  if (await dbOk()) {
    try {
      const [result] = await pool.query(
        'INSERT INTO productos (codigo, nombre, tipo_ganado, ingrediente_id, activo) VALUES (?,?,?,?,1)',
        [codigo, nombre, tipo_ganado || 'Ambos', ingrediente_id ? Number(ingrediente_id) : null]
      );
      const [rows] = await pool.query(`
        SELECT p.*, ie.nombre AS ingrediente_nombre, ie.texto AS ingrediente_texto
        FROM productos p
        LEFT JOIN ingredientes_etiqueta ie ON p.ingrediente_id = ie.id
        WHERE p.id=?
      `, [result.insertId]);
      return res.json(rows[0]);
    } catch { /* fallback */ }
  }

  const prod = { id: seq++, codigo, nombre, tipo_ganado: tipo_ganado || 'Ambos', ingrediente_id: ingrediente_id || null, activo: true };
  memProductos.push(prod);
  res.json(prod);
});

router.put('/:id', auth, requireAdmin, async (req, res) => {
  const { codigo, nombre, tipo_ganado, ingrediente_id, activo } = req.body;

  if (await dbOk()) {
    try {
      await pool.query(
        'UPDATE productos SET codigo=?, nombre=?, tipo_ganado=?, ingrediente_id=?, activo=? WHERE id=?',
        [
          codigo,
          nombre,
          tipo_ganado,
          ingrediente_id !== undefined ? (ingrediente_id ? Number(ingrediente_id) : null) : null,
          activo !== undefined ? (activo ? 1 : 0) : 1,
          req.params.id
        ]
      );
      const [rows] = await pool.query(`
        SELECT p.*, ie.nombre AS ingrediente_nombre, ie.texto AS ingrediente_texto
        FROM productos p
        LEFT JOIN ingredientes_etiqueta ie ON p.ingrediente_id = ie.id
        WHERE p.id=?
      `, [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
      return res.json(rows[0]);
    } catch { /* fallback */ }
  }

  const idx = memProductos.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  memProductos[idx] = { ...memProductos[idx], codigo, nombre, tipo_ganado, ingrediente_id, activo };
  res.json(memProductos[idx]);
});

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  if (await dbOk()) {
    try {
      await pool.query('UPDATE productos SET activo=0 WHERE id=?', [req.params.id]);
      return res.json({ ok: true });
    } catch { /* fallback */ }
  }
  const idx = memProductos.findIndex(p => p.id === Number(req.params.id));
  if (idx !== -1) memProductos[idx].activo = false;
  res.json({ ok: true });
});

module.exports = router;
