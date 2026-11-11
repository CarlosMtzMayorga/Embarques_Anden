<?php
// Espejo de backend/src/routes/ingredientes.js

$router->get('/', function () {
    requireAuth();
    $rows = db()->query('SELECT * FROM ingredientes_etiqueta ORDER BY id')->fetchAll();
    jsonResponse($rows);
});

$router->post('/', function () {
    requireAdmin(requireAuth());
    $body = requestBody();
    $nombre = isset($body['nombre']) ? trim($body['nombre']) : null;
    $texto = isset($body['texto']) ? trim($body['texto']) : null;

    if (!$nombre || !$texto) {
        jsonError(400, 'Nombre y texto son requeridos');
    }

    try {
        $stmt = db()->prepare('INSERT INTO ingredientes_etiqueta (nombre, texto, activo) VALUES (?, ?, 1)');
        $stmt->execute([$nombre, $texto]);
        $id = db()->lastInsertId();
        $row = db()->prepare('SELECT * FROM ingredientes_etiqueta WHERE id = ?');
        $row->execute([$id]);
        jsonResponse($row->fetch());
    } catch (PDOException $e) {
        if ($e->getCode() == 23000 || strpos($e->getMessage(), 'Duplicate entry') !== false) {
            jsonError(409, 'Ya existe una configuración con ese nombre');
        }
        jsonError(500, 'Error al crear ingrediente');
    }
});

$router->put('/:id', function ($params) {
    requireAdmin(requireAuth());
    $body = requestBody();
    $nombre = isset($body['nombre']) ? trim($body['nombre']) : null;
    $texto = isset($body['texto']) ? trim($body['texto']) : null;
    $activo = array_key_exists('activo', $body) ? (($body['activo']) ? 1 : 0) : 1;

    try {
        $stmt = db()->prepare('UPDATE ingredientes_etiqueta SET nombre=?, texto=?, activo=? WHERE id=?');
        $stmt->execute([$nombre, $texto, $activo, $params['id']]);

        $row = db()->prepare('SELECT * FROM ingredientes_etiqueta WHERE id = ?');
        $row->execute([$params['id']]);
        $result = $row->fetch();
        if (!$result) jsonError(404, 'No encontrado');
        jsonResponse($result);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000 || strpos($e->getMessage(), 'Duplicate entry') !== false) {
            jsonError(409, 'Ya existe una configuración con ese nombre');
        }
        jsonError(500, 'Error al actualizar ingrediente');
    }
});

$router->delete('/:id', function ($params) {
    requireAdmin(requireAuth());
    $stmt = db()->prepare('UPDATE ingredientes_etiqueta SET activo=0 WHERE id=?');
    $stmt->execute([$params['id']]);
    jsonResponse(['ok' => true]);
});
