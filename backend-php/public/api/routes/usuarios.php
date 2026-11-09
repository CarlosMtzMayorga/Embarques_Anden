<?php
// Gestión de usuarios (alta, baja/reactivación, edición, restablecer
// contraseña) — solo administradores.

const USUARIOS_ROLES = ['admin', 'operador'];

// Contraseña estándar de alta/restablecimiento: "{usuario}123" (mismo
// patrón que los usuarios demo admin/admin123, embarques/embarques123).
function passwordEstandar(string $usuario): string {
    return $usuario . '123';
}

function contarAdminsActivosExcepto($id): int {
    $stmt = db()->prepare("SELECT COUNT(*) AS n FROM usuarios WHERE rol='admin' AND activo=1 AND id != ?");
    $stmt->execute([$id]);
    return (int) $stmt->fetch()['n'];
}

$router->get('/', function () {
    requireAdmin(requireAuth());
    $rows = db()->query('SELECT id, usuario, nombre, rol, activo FROM usuarios ORDER BY activo DESC, nombre ASC')->fetchAll();
    jsonResponse($rows);
});

$router->post('/', function () {
    $user = requireAuth();
    requireAdmin($user);
    $body = requestBody();
    $usuario = $body['usuario'] ?? null;
    $nombre = $body['nombre'] ?? null;
    if (!$usuario || !$nombre) jsonError(400, 'Usuario y nombre son requeridos');
    $rol = in_array($body['rol'] ?? null, USUARIOS_ROLES, true) ? $body['rol'] : 'operador';

    $pdo = db();
    $existe = $pdo->prepare('SELECT id FROM usuarios WHERE usuario = ?');
    $existe->execute([$usuario]);
    if ($existe->fetch()) jsonError(409, 'Ya existe un usuario con ese nombre de usuario');

    $passwordInicial = passwordEstandar($usuario);
    $hash = password_hash($passwordInicial, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO usuarios (usuario, password_hash, nombre, rol, activo) VALUES (?,?,?,?,1)');
    $stmt->execute([$usuario, $hash, $nombre, $rol]);
    $id = $pdo->lastInsertId();

    $row = $pdo->prepare('SELECT id, usuario, nombre, rol, activo FROM usuarios WHERE id = ?');
    $row->execute([$id]);
    $creado = $row->fetch();

    registrarBitacora($pdo, [
        'usuario_id' => $user['id'] ?? null,
        'usuario_nombre' => $user['usuario'] ?? null,
        'accion' => 'crear',
        'tabla' => 'usuarios',
        'registro_id' => $id,
        'justificacion' => 'Alta de usuario',
        'datos_despues' => $creado,
    ]);

    jsonResponse(array_merge($creado, ['password_inicial' => $passwordInicial]));
});

$router->put('/:id/reset-password', function ($params) {
    $user = requireAuth();
    requireAdmin($user);
    $pdo = db();

    $stmt = $pdo->prepare('SELECT id, usuario FROM usuarios WHERE id = ?');
    $stmt->execute([$params['id']]);
    $row = $stmt->fetch();
    if (!$row) jsonError(404, 'Usuario no encontrado');

    $passwordNueva = passwordEstandar($row['usuario']);
    $hash = password_hash($passwordNueva, PASSWORD_BCRYPT);
    $pdo->prepare('UPDATE usuarios SET password_hash=? WHERE id=?')->execute([$hash, $params['id']]);

    registrarBitacora($pdo, [
        'usuario_id' => $user['id'] ?? null,
        'usuario_nombre' => $user['usuario'] ?? null,
        'accion' => 'editar',
        'tabla' => 'usuarios',
        'registro_id' => $params['id'],
        'justificacion' => 'Restablecimiento de contraseña a la estándar',
    ]);

    jsonResponse(['ok' => true, 'password_nueva' => $passwordNueva]);
});

$router->put('/:id/activo', function ($params) {
    $user = requireAuth();
    requireAdmin($user);
    $body = requestBody();
    $activo = !empty($body['activo']) ? 1 : 0;
    $pdo = db();

    $stmt = $pdo->prepare('SELECT id, usuario, nombre, rol, activo FROM usuarios WHERE id = ?');
    $stmt->execute([$params['id']]);
    $antes = $stmt->fetch();
    if (!$antes) jsonError(404, 'Usuario no encontrado');

    if (!$activo) {
        if ((string) ($user['id'] ?? '') === (string) $params['id']) {
            jsonError(400, 'No puedes desactivar tu propia cuenta');
        }
        if ($antes['rol'] === 'admin' && $antes['activo']) {
            if (contarAdminsActivosExcepto($params['id']) === 0) {
                jsonError(400, 'No puedes desactivar al único administrador activo');
            }
        }
    }

    $pdo->prepare('UPDATE usuarios SET activo=? WHERE id=?')->execute([$activo, $params['id']]);
    $after = $pdo->prepare('SELECT id, usuario, nombre, rol, activo FROM usuarios WHERE id = ?');
    $after->execute([$params['id']]);
    $despues = $after->fetch();

    registrarBitacora($pdo, [
        'usuario_id' => $user['id'] ?? null,
        'usuario_nombre' => $user['usuario'] ?? null,
        'accion' => $activo ? 'editar' : 'eliminar',
        'tabla' => 'usuarios',
        'registro_id' => $params['id'],
        'justificacion' => $activo ? 'Usuario reactivado' : 'Usuario desactivado',
        'datos_antes' => $antes,
        'datos_despues' => $despues,
    ]);

    jsonResponse($despues);
});

$router->put('/:id', function ($params) {
    $user = requireAuth();
    requireAdmin($user);
    $body = requestBody();
    $nombre = $body['nombre'] ?? null;
    $rol = in_array($body['rol'] ?? null, USUARIOS_ROLES, true) ? $body['rol'] : 'operador';
    $pdo = db();

    $stmt = $pdo->prepare('SELECT id, usuario, nombre, rol, activo FROM usuarios WHERE id = ?');
    $stmt->execute([$params['id']]);
    $antes = $stmt->fetch();
    if (!$antes) jsonError(404, 'Usuario no encontrado');

    if ((string) ($user['id'] ?? '') === (string) $params['id'] && $antes['rol'] === 'admin' && $rol !== 'admin') {
        jsonError(400, 'No puedes quitarte tu propio rol de administrador');
    }

    $pdo->prepare('UPDATE usuarios SET nombre=?, rol=? WHERE id=?')->execute([$nombre, $rol, $params['id']]);
    $after = $pdo->prepare('SELECT id, usuario, nombre, rol, activo FROM usuarios WHERE id = ?');
    $after->execute([$params['id']]);
    $despues = $after->fetch();

    registrarBitacora($pdo, [
        'usuario_id' => $user['id'] ?? null,
        'usuario_nombre' => $user['usuario'] ?? null,
        'accion' => 'editar',
        'tabla' => 'usuarios',
        'registro_id' => $params['id'],
        'justificacion' => 'Cambio de datos de usuario',
        'datos_antes' => $antes,
        'datos_despues' => $despues,
    ]);

    jsonResponse($despues);
});
