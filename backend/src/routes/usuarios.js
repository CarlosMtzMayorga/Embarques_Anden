const router = require('express').Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const pool = require('../db');
const { registrarBitacora } = require('../lib/bitacora');

const ROLES = ['admin', 'operador'];

// Contraseña estándar de alta/restablecimiento: "{usuario}123" (mismo
// patrón que los usuarios demo admin/admin123, embarques/embarques123).
function passwordEstandar(usuario) {
  return `${usuario}123`;
}

async function contarAdminsActivosExcepto(id) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS n FROM usuarios WHERE rol='admin' AND activo=1 AND id != ?",
    [id]
  );
  return rows[0].n;
}

router.get('/', auth, requireAdmin, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, usuario, nombre, rol, activo FROM usuarios ORDER BY activo DESC, nombre ASC'
  );
  res.json(rows);
});

router.post('/', auth, requireAdmin, async (req, res) => {
  const { usuario, nombre, rol } = req.body;
  if (!usuario || !nombre) {
    return res.status(400).json({ error: 'Usuario y nombre son requeridos' });
  }
  const rolFinal = ROLES.includes(rol) ? rol : 'operador';

  const [existe] = await pool.query('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
  if (existe.length) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese nombre de usuario' });
  }

  const passwordInicial = passwordEstandar(usuario);
  const hash = await bcrypt.hash(passwordInicial, 10);
  const [result] = await pool.query(
    'INSERT INTO usuarios (usuario, password_hash, nombre, rol, activo) VALUES (?,?,?,?,1)',
    [usuario, hash, nombre, rolFinal]
  );
  const [rows] = await pool.query(
    'SELECT id, usuario, nombre, rol, activo FROM usuarios WHERE id = ?',
    [result.insertId]
  );

  await registrarBitacora(pool, {
    usuario_id: req.user?.id,
    usuario_nombre: req.user?.usuario,
    accion: 'crear',
    tabla: 'usuarios',
    registro_id: result.insertId,
    justificacion: 'Alta de usuario',
    datos_despues: rows[0],
  });

  res.json({ ...rows[0], password_inicial: passwordInicial });
});

router.put('/:id', auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre, rol } = req.body;
  const rolFinal = ROLES.includes(rol) ? rol : 'operador';

  const [antesRows] = await pool.query(
    'SELECT id, usuario, nombre, rol, activo FROM usuarios WHERE id = ?',
    [id]
  );
  if (!antesRows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  const antes = antesRows[0];

  if (String(req.user?.id) === String(id) && antes.rol === 'admin' && rolFinal !== 'admin') {
    return res.status(400).json({ error: 'No puedes quitarte tu propio rol de administrador' });
  }

  await pool.query('UPDATE usuarios SET nombre=?, rol=? WHERE id=?', [nombre, rolFinal, id]);
  const [despuesRows] = await pool.query(
    'SELECT id, usuario, nombre, rol, activo FROM usuarios WHERE id = ?',
    [id]
  );

  await registrarBitacora(pool, {
    usuario_id: req.user?.id,
    usuario_nombre: req.user?.usuario,
    accion: 'editar',
    tabla: 'usuarios',
    registro_id: id,
    justificacion: 'Cambio de datos de usuario',
    datos_antes: antes,
    datos_despues: despuesRows[0],
  });

  res.json(despuesRows[0]);
});

router.put('/:id/reset-password', auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT id, usuario FROM usuarios WHERE id = ?', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

  const passwordNueva = passwordEstandar(rows[0].usuario);
  const hash = await bcrypt.hash(passwordNueva, 10);
  await pool.query('UPDATE usuarios SET password_hash=? WHERE id=?', [hash, id]);

  await registrarBitacora(pool, {
    usuario_id: req.user?.id,
    usuario_nombre: req.user?.usuario,
    accion: 'editar',
    tabla: 'usuarios',
    registro_id: id,
    justificacion: 'Restablecimiento de contraseña a la estándar',
  });

  res.json({ ok: true, password_nueva: passwordNueva });
});

router.put('/:id/activo', auth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const activo = req.body.activo ? 1 : 0;

  const [rows] = await pool.query('SELECT id, usuario, nombre, rol, activo FROM usuarios WHERE id = ?', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  const antes = rows[0];

  if (!activo) {
    if (String(req.user?.id) === String(id)) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }
    if (antes.rol === 'admin' && antes.activo) {
      const otrosAdmins = await contarAdminsActivosExcepto(id);
      if (otrosAdmins === 0) {
        return res.status(400).json({ error: 'No puedes desactivar al único administrador activo' });
      }
    }
  }

  await pool.query('UPDATE usuarios SET activo=? WHERE id=?', [activo, id]);
  const [despuesRows] = await pool.query('SELECT id, usuario, nombre, rol, activo FROM usuarios WHERE id = ?', [id]);

  await registrarBitacora(pool, {
    usuario_id: req.user?.id,
    usuario_nombre: req.user?.usuario,
    accion: activo ? 'editar' : 'eliminar',
    tabla: 'usuarios',
    registro_id: id,
    justificacion: activo ? 'Usuario reactivado' : 'Usuario desactivado',
    datos_antes: antes,
    datos_despues: despuesRows[0],
  });

  res.json(despuesRows[0]);
});

module.exports = router;
