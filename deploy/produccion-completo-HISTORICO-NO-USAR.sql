-- ============================================================
-- Script de actualización COMPLETA para producción
-- Sistema de Embarques — Carnes Finas el Andén (TIF 680)
-- ============================================================
-- ADVERTENCIA: este script BORRA las tablas existentes (usuarios,
-- productos, lotes, canales, clientes, entradas, salidas,
-- movimientos_inventario, etc.) y las vuelve a crear desde cero,
-- ya con la estructura nueva completa. Confirmaste que en
-- producción solo hay datos de prueba, así que este es el camino
-- más simple y seguro.
--
-- Si tienes cualquier duda, antes de correr este script ve a
-- phpMyAdmin > tu base de datos > pestaña "Exportar" > Exportar,
-- y guarda ese archivo como respaldo (toma 10 segundos).
--
-- Cómo usarlo: cPanel > phpMyAdmin > selecciona tu base de datos
-- > pestaña "SQL" > pega todo este archivo > Continuar.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS bitacora;
DROP TABLE IF EXISTS etiquetas;
DROP TABLE IF EXISTS contador_cajas;
DROP TABLE IF EXISTS contador_lotes;
DROP TABLE IF EXISTS movimientos_inventario;
DROP TABLE IF EXISTS bajas;
DROP TABLE IF EXISTS salidas;
DROP TABLE IF EXISTS entradas;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS canales;
DROP TABLE IF EXISTS lotes;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS usuarios;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario       VARCHAR(50)  UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  rol           ENUM('admin','operador') DEFAULT 'operador',
  activo        TINYINT(1) DEFAULT 1
);

CREATE TABLE productos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(20)  NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  tipo_ganado VARCHAR(50)  DEFAULT 'Ambos',
  activo      TINYINT(1)  DEFAULT 1
);

CREATE TABLE lotes (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  numero           VARCHAR(50)  NOT NULL,
  fecha            DATE         NOT NULL,
  fecha_sacrificio DATE,
  tipo_ganado      VARCHAR(50),
  romaneaje        VARCHAR(100),
  romaneaje_pdf    VARCHAR(255),
  observaciones    TEXT
);

CREATE TABLE canales (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  lote_id       INT            NOT NULL,
  consecutivo   INT            NOT NULL,
  tipo          VARCHAR(50),
  peso_caliente DECIMAL(10,2),
  peso_frio     DECIMAL(10,2),
  diferencia_pct DECIMAL(5,2),
  medio_1       DECIMAL(10,2) DEFAULT 0,
  medio_2       DECIMAL(10,2) DEFAULT 0,
  cuarto_1      DECIMAL(10,2) DEFAULT 0,
  cuarto_2      DECIMAL(10,2) DEFAULT 0,
  cuarto_3      DECIMAL(10,2) DEFAULT 0,
  cuarto_4      DECIMAL(10,2) DEFAULT 0,
  fecha         DATE,
  observaciones TEXT,
  FOREIGN KEY (lote_id) REFERENCES lotes(id)
);

CREATE TABLE clientes (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  nombre   VARCHAR(100) NOT NULL,
  rfc      VARCHAR(20),
  contacto VARCHAR(100),
  telefono VARCHAR(20),
  activo   TINYINT(1) DEFAULT 1
);

CREATE TABLE entradas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  lote_id     INT,
  lote_num    VARCHAR(50),
  fecha       DATE        NOT NULL,
  tipo_ganado VARCHAR(50),
  codigo      VARCHAR(20),
  caja        INT,
  etiqueta_id INT,
  producto    VARCHAR(100),
  cajas       INT         DEFAULT 0,
  kilos       DECIMAL(10,2) DEFAULT 0,
  INDEX idx_entradas_etiqueta_id (etiqueta_id)
);

CREATE TABLE salidas (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  folio          INT,
  fecha          DATE         NOT NULL,
  cliente_id     INT,
  cliente_nombre VARCHAR(100),
  lote_canal     VARCHAR(50),
  codigo         VARCHAR(20),
  producto       VARCHAR(100),
  tipo_ganado    VARCHAR(50),
  cajas          INT          DEFAULT 0,
  kilos          DECIMAL(10,2) DEFAULT 0,
  barcode        VARCHAR(80),
  entregado_por  VARCHAR(100),
  observaciones  TEXT
);

-- Movimientos de inventario: ajustes internos (mermas, decomisos, correcciones)
-- que entran o salen de existencias. Cada movimiento se solicita (embarque)
-- y debe ser autorizado por oficina/administración antes de contar en
-- existencias. No confundir con `salidas`, que son embarques a cliente.
CREATE TABLE movimientos_inventario (
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
  comentario_autorizacion  TEXT,
  FOREIGN KEY (solicitado_por) REFERENCES usuarios(id),
  FOREIGN KEY (autorizado_por) REFERENCES usuarios(id)
);

CREATE TABLE contador_lotes (
  id     INT PRIMARY KEY DEFAULT 1,
  actual INT NOT NULL DEFAULT 0
);

CREATE TABLE contador_cajas (
  lote_id INT         NOT NULL,
  codigo  VARCHAR(20) NOT NULL,
  actual  INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (lote_id, codigo),
  FOREIGN KEY (lote_id) REFERENCES lotes(id)
);

-- Código de barras canónico: CODIGO-LOTE-CAJA-KILOS (ej. 600-26-1-15.70)
-- El consecutivo de caja es por producto dentro del lote (lote_id, codigo).
CREATE TABLE etiquetas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  lote_id       INT,
  lote_num      VARCHAR(50)   NOT NULL,
  codigo        VARCHAR(20)   NOT NULL,
  producto      VARCHAR(100),
  caja          INT           NOT NULL,
  kilos         DECIMAL(10,2) NOT NULL,
  barcode       VARCHAR(80)   NOT NULL,
  fecha         DATE          NOT NULL,
  romaneaje     VARCHAR(100),
  activa        TINYINT(1)    DEFAULT 1,
  veces_impresa INT           DEFAULT 1,
  usuario_id    INT,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lote_id) REFERENCES lotes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  UNIQUE KEY uq_etiqueta_caja (lote_id, codigo, caja),
  UNIQUE KEY uq_etiqueta_barcode (barcode)
);

-- Bitácora de auditoría: toda edición/eliminación/autorización queda
-- registrada con una justificación. Solo el administrador debe poder
-- consultarla.
CREATE TABLE bitacora (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id     INT,
  usuario_nombre VARCHAR(100),
  accion         VARCHAR(20)  NOT NULL,   -- 'editar' | 'eliminar' | 'autorizar' | 'rechazar'
  tabla          VARCHAR(50)  NOT NULL,
  registro_id    INT,
  justificacion  TEXT         NOT NULL,
  datos_antes    JSON,
  datos_despues  JSON,
  fecha          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ── Consecutivo de lote: arranca en 0 (el primer lote nuevo será el 1) ──
INSERT INTO contador_lotes (id, actual) VALUES (1, 0);

-- ── Usuarios (cambia las contraseñas después de tu primer login) ──
-- admin / admin123
-- embarques / embarques123
INSERT INTO usuarios (usuario, password_hash, nombre, rol, activo) VALUES
('admin', '$2b$10$CqQWQvjw78.7e6dWZTFVNOwNV5Z9T2oM461Ev7c4Ut86KJvWZy7Ta', 'Administrador', 'admin', 1),
('embarques', '$2b$10$CBULYMIk9yvQdt7yHZrqEer/qiC/DuC0r3sIGzxvl/60PRlfORyZ2', 'Op. Embarques', 'operador', 1);

-- ── Catálogo de productos ──
INSERT INTO productos (codigo, nombre, tipo_ganado, activo) VALUES
('101', 'Lomo completo',        'Ambos', 1),
('102', 'Lomo fino',            'Ambos', 1),
('103', 'Costilla cargada',     'Ambos', 1),
('104', 'Costilla corta',       'Ambos', 1),
('105', 'Espaldilla completa',  'Ambos', 1),
('106', 'Chambarete delantero', 'Ambos', 1),
('107', 'Chambarete trasero',   'Ambos', 1),
('108', 'Pierna completa',      'Ambos', 1),
('109', 'Bola de pierna',       'Ambos', 1),
('110', 'Cuete',                'Ambos', 1),
('111', 'Pulpa negra',          'Ambos', 1),
('112', 'Paleta completa',      'Ambos', 1),
('113', 'Pescuezo',             'Ambos', 1),
('114', 'Falda',                'Ambos', 1),
('115', 'Vísceras',             'Ambos', 1),
('591', 'Corte especial 591',   'De Procarne', 1);

-- ── Clientes de ejemplo (agrega/edita los reales desde la pantalla Clientes) ──
INSERT INTO clientes (nombre, rfc, contacto, telefono, activo) VALUES
('Abastos', '', '', '', 1),
('Torreón Jardín', '', '', '', 1);
