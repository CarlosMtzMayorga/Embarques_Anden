<?php
// Espejo de backend/src/routes/productos.js

const PRODUCTOS_TIPOS = ['Ambos', 'De Procarne', 'San Carlos', 'Engorda', 'Corriente'];

$router->get('/', function () {
    requireAuth();
    $rows = db()->query('
        SELECT p.*, ie.nombre AS ingrediente_nombre, ie.texto AS ingrediente_texto
        FROM productos p
        LEFT JOIN ingredientes_etiqueta ie ON p.ingrediente_id = ie.id
        ORDER BY p.codigo
    ')->fetchAll();
    jsonResponse($rows);
});

$router->get('/tipos-ganado', function () {
    requireAuth();
    jsonResponse(PRODUCTOS_TIPOS);
});

$router->post('/', function () {
    requireAdmin(requireAuth());
    $body = requestBody();
    $codigo = $body['codigo'] ?? null;
    $nombre = $body['nombre'] ?? null;
    $ingrediente_id = !empty($body['ingrediente_id']) ? (int)$body['ingrediente_id'] : null;
    if (!$codigo || !$nombre) jsonError(400, 'codigo y nombre son requeridos');

    $stmt = db()->prepare('INSERT INTO productos (codigo, nombre, tipo_ganado, ingrediente_id, activo) VALUES (?,?,?,?,1)');
    $stmt->execute([$codigo, $nombre, $body['tipo_ganado'] ?? 'Ambos', $ingrediente_id]);
    $id = db()->lastInsertId();
    $row = db()->prepare('
        SELECT p.*, ie.nombre AS ingrediente_nombre, ie.texto AS ingrediente_texto
        FROM productos p
        LEFT JOIN ingredientes_etiqueta ie ON p.ingrediente_id = ie.id
        WHERE p.id = ?
    ');
    $row->execute([$id]);
    jsonResponse($row->fetch());
});

$router->put('/:id', function ($params) {
    requireAdmin(requireAuth());
    $body = requestBody();
    $activo = array_key_exists('activo', $body) ? (($body['activo']) ? 1 : 0) : 1;
    $ingrediente_id = !empty($body['ingrediente_id']) ? (int)$body['ingrediente_id'] : null;

    $stmt = db()->prepare('UPDATE productos SET codigo=?, nombre=?, tipo_ganado=?, ingrediente_id=?, activo=? WHERE id=?');
    $stmt->execute([$body['codigo'] ?? null, $body['nombre'] ?? null, $body['tipo_ganado'] ?? null, $ingrediente_id, $activo, $params['id']]);

    $row = db()->prepare('
        SELECT p.*, ie.nombre AS ingrediente_nombre, ie.texto AS ingrediente_texto
        FROM productos p
        LEFT JOIN ingredientes_etiqueta ie ON p.ingrediente_id = ie.id
        WHERE p.id = ?
    ');
    $row->execute([$params['id']]);
    $result = $row->fetch();
    if (!$result) jsonError(404, 'No encontrado');
    jsonResponse($result);
});

$router->delete('/:id', function ($params) {
    requireAdmin(requireAuth());
    $stmt = db()->prepare('UPDATE productos SET activo=0 WHERE id=?');
    $stmt->execute([$params['id']]);
    jsonResponse(['ok' => true]);
});
