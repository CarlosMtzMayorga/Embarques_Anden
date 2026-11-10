-- ============================================================
-- Script de ACTUALIZACIÓN INCREMENTAL para producción
-- Sistema de Embarques — Carnes Finas el Andén (TIF 680)
-- ============================================================
-- A diferencia de "produccion-completo.sql" (que usaste la vez
-- pasada), este script NO borra ninguna tabla ni ningún dato.
-- Solo agrega columnas/índices/tablas que todavía no existan.
-- Es exactamente lo mismo que hace "node migrate.js" en el
-- backend, pero en SQL puro para pegarlo en phpMyAdmin.
--
-- Seguro de correr varias veces (es idempotente): si una columna
-- o tabla ya existe, ese paso simplemente no hace nada.
--
-- Cómo usarlo: cPanel > phpMyAdmin > selecciona tu base de datos
-- > pestaña "SQL" > pega todo este archivo > Continuar.
--
-- Nota sobre la báscula: la báscula NO necesitó cambios de base
-- de datos — su configuración se guarda en el navegador de la
-- máquina donde se usa, no en esta base de datos.
-- ============================================================

SET @dbname = DATABASE();

-- entradas.caja
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'entradas' AND COLUMN_NAME = 'caja');
SET @sql = IF(@exists = 0,
  'ALTER TABLE entradas ADD COLUMN caja INT NULL AFTER codigo',
  'SELECT ''entradas.caja ya existía'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- entradas.etiqueta_id
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'entradas' AND COLUMN_NAME = 'etiqueta_id');
SET @sql = IF(@exists = 0,
  'ALTER TABLE entradas ADD COLUMN etiqueta_id INT NULL AFTER caja',
  'SELECT ''entradas.etiqueta_id ya existía'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- índice entradas.idx_entradas_etiqueta_id
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'entradas' AND INDEX_NAME = 'idx_entradas_etiqueta_id');
SET @sql = IF(@exists = 0,
  'ALTER TABLE entradas ADD INDEX idx_entradas_etiqueta_id (etiqueta_id)',
  'SELECT ''índice idx_entradas_etiqueta_id ya existía'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- lotes.romaneaje_pdf
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'lotes' AND COLUMN_NAME = 'romaneaje_pdf');
SET @sql = IF(@exists = 0,
  'ALTER TABLE lotes ADD COLUMN romaneaje_pdf VARCHAR(255) NULL AFTER romaneaje',
  'SELECT ''lotes.romaneaje_pdf ya existía'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- bajas -> movimientos_inventario (solo si sigues en el nombre viejo)
SET @has_bajas = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'bajas');
SET @has_mov = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'movimientos_inventario');
SET @sql = IF(@has_bajas > 0 AND @has_mov = 0,
  'RENAME TABLE bajas TO movimientos_inventario',
  'SELECT ''no se requiere renombrar bajas'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- si nunca existieron ni "bajas" ni "movimientos_inventario", se crea nueva
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  fecha                    DATE         NOT NULL,
  tipo_movimiento          ENUM('entrada','salida') NOT NULL DEFAULT 'salida',
  lote_num                 VARCHAR(50),
  codigo                   VARCHAR(20),
  producto                 VARCHAR(100),
  tipo_ganado              VARCHAR(50),
  cajas                    INT          DEFAULT 0,
  kilos                    DECIMAL(10,2) DEFAULT 0,
  motivo                   VARCHAR(50)  DEFAULT 'otro',
  observaciones            TEXT,
  estado                   ENUM('pendiente','autorizado','rechazado') NOT NULL DEFAULT 'pendiente',
  solicitado_por           INT,
  autorizado_por           INT,
  fecha_autorizacion       DATETIME,
  comentario_autorizacion  TEXT
);

-- columnas de movimientos_inventario (por si la tabla venía de "bajas" y le faltan)
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'movimientos_inventario' AND COLUMN_NAME = 'tipo_movimiento');
SET @sql = IF(@exists = 0,
  'ALTER TABLE movimientos_inventario ADD COLUMN tipo_movimiento ENUM(''entrada'',''salida'') NOT NULL DEFAULT ''salida'' AFTER fecha',
  'SELECT ''movimientos_inventario.tipo_movimiento ya existía'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'movimientos_inventario' AND COLUMN_NAME = 'estado');
SET @sql = IF(@exists = 0,
  'ALTER TABLE movimientos_inventario ADD COLUMN estado ENUM(''pendiente'',''autorizado'',''rechazado'') NOT NULL DEFAULT ''autorizado'' AFTER motivo',
  'SELECT ''movimientos_inventario.estado ya existía'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'movimientos_inventario' AND COLUMN_NAME = 'solicitado_por');
SET @sql = IF(@exists = 0,
  'ALTER TABLE movimientos_inventario ADD COLUMN solicitado_por INT NULL',
  'SELECT ''movimientos_inventario.solicitado_por ya existía'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'movimientos_inventario' AND COLUMN_NAME = 'autorizado_por');
SET @sql = IF(@exists = 0,
  'ALTER TABLE movimientos_inventario ADD COLUMN autorizado_por INT NULL',
  'SELECT ''movimientos_inventario.autorizado_por ya existía'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'movimientos_inventario' AND COLUMN_NAME = 'fecha_autorizacion');
SET @sql = IF(@exists = 0,
  'ALTER TABLE movimientos_inventario ADD COLUMN fecha_autorizacion DATETIME NULL',
  'SELECT ''movimientos_inventario.fecha_autorizacion ya existía'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'movimientos_inventario' AND COLUMN_NAME = 'comentario_autorizacion');
SET @sql = IF(@exists = 0,
  'ALTER TABLE movimientos_inventario ADD COLUMN comentario_autorizacion TEXT NULL',
  'SELECT ''movimientos_inventario.comentario_autorizacion ya existía'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- salidas.observaciones
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'salidas' AND COLUMN_NAME = 'observaciones');
SET @sql = IF(@exists = 0,
  'ALTER TABLE salidas ADD COLUMN observaciones TEXT NULL',
  'SELECT ''salidas.observaciones ya existía'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- salidas.barcode
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'salidas' AND COLUMN_NAME = 'barcode');
SET @sql = IF(@exists = 0,
  'ALTER TABLE salidas ADD COLUMN barcode VARCHAR(80) NULL AFTER kilos',
  'SELECT ''salidas.barcode ya existía'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- etiquetas.lote_id debe aceptar NULL (inventario inicial sin lote real)
SET @is_nullable = (SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'etiquetas' AND COLUMN_NAME = 'lote_id');
SET @sql = IF(@is_nullable = 'NO',
  'ALTER TABLE etiquetas MODIFY lote_id INT NULL',
  'SELECT ''etiquetas.lote_id ya aceptaba NULL'' AS info');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- tabla bitacora (auditoría) — se crea si no existe, no toca nada si ya está
CREATE TABLE IF NOT EXISTS bitacora (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id     INT,
  usuario_nombre VARCHAR(100),
  accion         VARCHAR(20)  NOT NULL,
  tabla          VARCHAR(50)  NOT NULL,
  registro_id    INT,
  justificacion  TEXT         NOT NULL,
  datos_antes    JSON,
  datos_despues  JSON,
  fecha          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- siembra el consecutivo de lote solo si contador_lotes está vacío
-- (continúa desde el último número real ya capturado, no reinicia en 1)
INSERT IGNORE INTO contador_lotes (id, actual)
SELECT 1, COALESCE(MAX(CAST(numero AS UNSIGNED)), 0) FROM lotes;

SELECT 'Actualización de base de datos completada' AS resultado;
