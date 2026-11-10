-- ============================================================
-- Script de INSTALACIÓN INICIAL (primera vez) para producción
-- Sistema de Embarques — Carnes Finas el Andén (TIF 680)
-- ============================================================
-- Úsalo SOLO la primera vez, sobre una base de datos recién
-- creada y vacía. Crea todas las tablas desde cero y siembra:
--   - 2 usuarios: admin/admin123 y embarques/embarques123
--     (CAMBIA ESAS CONTRASEÑAS después de tu primer login)
--   - El catálogo completo de productos
--   - El consecutivo de lote (arranca en 0 → el primer lote
--     nuevo que captures será el lote 1)
--
-- Cómo usarlo: cPanel > phpMyAdmin > selecciona la base de datos
-- que acabas de crear > pestaña "SQL" > pega todo este archivo >
-- Continuar.
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario       VARCHAR(50)  UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  rol           ENUM('admin','operador') DEFAULT 'operador',
  activo        TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS productos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(20)  NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  tipo_ganado VARCHAR(50)  DEFAULT 'Ambos',
  activo      TINYINT(1)  DEFAULT 1
);

CREATE TABLE IF NOT EXISTS lotes (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  numero           VARCHAR(50)  NOT NULL,
  fecha            DATE         NOT NULL,
  fecha_sacrificio DATE,
  tipo_ganado      VARCHAR(50),
  romaneaje        VARCHAR(100),
  romaneaje_pdf    VARCHAR(255),
  observaciones    TEXT
);

CREATE TABLE IF NOT EXISTS canales (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  lote_id        INT            NOT NULL,
  consecutivo    INT            NOT NULL,
  tipo           VARCHAR(50),
  peso_caliente  DECIMAL(10,2),
  peso_frio      DECIMAL(10,2),
  diferencia_pct DECIMAL(5,2),
  medio_1        DECIMAL(10,2) DEFAULT 0,
  medio_2        DECIMAL(10,2) DEFAULT 0,
  cuarto_1       DECIMAL(10,2) DEFAULT 0,
  cuarto_2       DECIMAL(10,2) DEFAULT 0,
  cuarto_3       DECIMAL(10,2) DEFAULT 0,
  cuarto_4       DECIMAL(10,2) DEFAULT 0,
  fecha          DATE,
  observaciones  TEXT,
  FOREIGN KEY (lote_id) REFERENCES lotes(id)
);

CREATE TABLE IF NOT EXISTS clientes (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  nombre   VARCHAR(100) NOT NULL,
  rfc      VARCHAR(20),
  contacto VARCHAR(100),
  telefono VARCHAR(20),
  activo   TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS entradas (
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

CREATE TABLE IF NOT EXISTS salidas (
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
-- que entran o salen de existencias. Cada movimiento se solicita y debe ser
-- autorizado por administración antes de contar en existencias. No confundir
-- con `salidas`, que son embarques a cliente.
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
  comentario_autorizacion  TEXT,
  FOREIGN KEY (solicitado_por) REFERENCES usuarios(id),
  FOREIGN KEY (autorizado_por) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS contador_lotes (
  id     INT PRIMARY KEY DEFAULT 1,
  actual INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contador_cajas (
  lote_id INT         NOT NULL,
  codigo  VARCHAR(20) NOT NULL,
  actual  INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (lote_id, codigo),
  FOREIGN KEY (lote_id) REFERENCES lotes(id)
);

-- Código de barras canónico: CODIGO-LOTE-CAJA-KILOS (ej. 600-26-1-15.70)
-- El consecutivo de caja es por producto dentro del lote (lote_id, codigo).
CREATE TABLE IF NOT EXISTS etiquetas (
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
CREATE TABLE IF NOT EXISTS bitacora (
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
INSERT IGNORE INTO contador_lotes (id, actual) VALUES (1, 0);

-- ── Usuarios (cambia las contraseñas después de tu primer login) ──
-- admin / admin123
-- embarques / embarques123
INSERT INTO usuarios (usuario, password_hash, nombre, rol, activo) VALUES
('admin', '$2b$10$CqQWQvjw78.7e6dWZTFVNOwNV5Z9T2oM461Ev7c4Ut86KJvWZy7Ta', 'Administrador', 'admin', 1),
('embarques', '$2b$10$CBULYMIk9yvQdt7yHZrqEer/qiC/DuC0r3sIGzxvl/60PRlfORyZ2', 'Op. Embarques', 'operador', 1)
ON DUPLICATE KEY UPDATE usuario = usuario;

-- ── Catálogo de productos (110 artículos) ──
INSERT INTO productos (codigo, nombre, tipo_ganado, activo) VALUES
('6077', 'AGUJA NORTEÑA PIEZA BASICA', 'Engorda', 1),
('2178', 'AGUJA NORTEÑA NATURAL', 'Engorda', 1),
('6078', 'ARRACHERA MARINADA PIEZA BASICA', 'Engorda', 1),
('2129', 'ARRACHERA MARINADA FLAP MEAT PIEZA BASICA', 'Engorda', 1),
('2124', 'ARRACHERA NATURAL PIEZA BASICA', 'Engorda', 1),
('6079', 'BRISKET PIEZA BASICA', 'Engorda', 1),
('2179', 'BRISKET NATURAL PIEZA BASICA', 'Engorda', 1),
('2007', 'CABRERIA PIEZA BASICA', 'Engorda', 1),
('2180', 'CABRERIA NATURAL PIEZA BASICA', 'Engorda', 1),
('6117', 'CARNE PARA ASAR MARINADA PIEZA BASICA', 'Engorda', 1),
('2122', 'CHAMBERETE PIEZA BASICA', 'Engorda', 1),
('2181', 'CHAMBERETE NATURAL PIEZA BASICA', 'Engorda', 1),
('2182', 'CHULETA DE LOMO/CLUB STEAK PIEZA BASICA', 'Engorda', 1),
('2172', 'CONCHA PIEZA BASICA', 'Engorda', 1),
('2183', 'CONCHA NATURAL PIEZA BASICA', 'Engorda', 1),
('2174', 'COLA DE RES PIEZA BASICA', 'Engorda', 1),
('2157', 'COSTILLA CARGADA - SHORT RIB (PIEZA BASICA)', 'Engorda', 1),
('2184', 'COSTILLA CARGADA/SHORT RIB NATURAL (PIEZA BASICA)', 'Engorda', 1),
('2021', 'COSTILLA COUNTRY PIEZA BASICA', 'Engorda', 1),
('2185', 'COSTILLA COUNTRY NATURAL PIEZA BASICA', 'Engorda', 1),
('2135', 'COSTILLA DE RIB EYE PIEZA BASICA', 'Engorda', 1),
('2164', 'COSTILLA SIMPLE CON FLECHA NATURAL PIEZA BASICA', 'Engorda', 1),
('2131', 'COSTILLA SIMPLE CON FLECHA PIEZA BASICA', 'Engorda', 1),
('2026', 'COSTILLA TABLITA PIEZA BASICA', 'Engorda', 1),
('2027', 'COW BOY PIEZA BASICA', 'Engorda', 1),
('2128', 'DESHEBRE PIEZA BASICA', 'Engorda', 1),
('2186', 'DESHEBRE NATURAL PIEZA BASICA', 'Engorda', 1),
('6080', 'DIEZMILLO CON HUESO PIEZA BASICA', 'Engorda', 1),
('2134', 'FILETE DE RES PIEZA BASICA', 'Engorda', 1),
('2187', 'FILETE DE RES NATURAL PIEZA BASICA', 'Engorda', 1),
('2188', 'FURLON DE RES', 'Engorda', 1),
('6075', 'HUESO TUETANERO PIEZA BASICA', 'Engorda', 1),
('2049', 'MOLLEJA DE RES PIEZA BASICA', 'Engorda', 1),
('2144', 'NEW YORK PIEZA BASICA', 'Engorda', 1),
('2189', 'NEW YORK NATURAL PIEZA BASICA', 'Engorda', 1),
('6109', 'PALETA CON HUESO PIEZA BASICA', 'Engorda', 1),
('2190', 'PALETA CON HUESO NATURAL PIEZA BASICA', 'Engorda', 1),
('2191', 'PALETA CON HUESO ROLADA PIEZA BASICA', 'Engorda', 1),
('2192', 'PALETA CON HUESO ROLADA NATURALPIEZA BASICA', 'Engorda', 1),
('6100', 'PECHO CON HUESO PIEZA BASICA', 'Engorda', 1),
('2193', 'PECHO CON HUESO NATURAL PIEZA BASICA', 'Engorda', 1),
('2156', 'PECHO SIN BRISKET PIEZA BASICA', 'Engorda', 1),
('6115', 'PESCUEZO CON HUESO NATURAL PIEZA BASICA', 'Engorda', 1),
('6064', 'PESCUEZO CON HUESO PIEZA BASICA', 'Engorda', 1),
('2136', 'PESCUEZO SIN HUESO PIEZA BASICA', 'Engorda', 1),
('2194', 'PESCUEZO SIN HUESO NATURAL PIEZA BASICA', 'Engorda', 1),
('2123', 'PRIME RIB CON TAPA PIEZA BASICA', 'Engorda', 1),
('2195', 'PRIME RIB CON TAPA NATURAL PIEZA BASICA', 'Engorda', 1),
('2054', 'PICANHA PIEZA BASICA', 'Engorda', 1),
('2133', 'RECORTE 80/20 NATURAL PIEZA BASICA', 'Engorda', 1),
('2132', 'RECORTE 90/10 NATURAL PIEZA BASICA', 'Engorda', 1),
('2105', 'RIB EYE LIP ON PIEZA BASICA', 'Engorda', 1),
('2196', 'RIB EYE LIP ON NATURAL PIEZA BASICA', 'Engorda', 1),
('2065', 'RIB EYE ROLL PIEZA BASICA', 'Engorda', 1),
('2197', 'RIB EYE ROLL NATURAL PIEZA BASICA', 'Engorda', 1),
('2198', 'RIÑON DE RES PIEZA BASICA', 'Engorda', 1),
('2113', 'SET DE PULPAS NATURAL PIEZA BASICA', 'Engorda', 1),
('2171', 'SUADERO PIEZA BASICA', 'Engorda', 1),
('2199', 'SUADERO NATURAL PIEZA BASICA', 'Engorda', 1),
('2072', 'T-BONE PIEZA BASICA', 'Engorda', 1),
('2200', 'T-BONE NATURAL PIEZA BASICA', 'Engorda', 1),
('2073', 'TOMAHAWK', 'Engorda', 1),
('2126', 'TOP SIRLOIN NATURAL PIEZA BASICA', 'Engorda', 1),
('2076', 'TOP SIRLOIN PIEZA BASICA', 'Engorda', 1),
('6081', 'AGUJA NORTEÑA SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6163', 'AGUJA NORTEÑA NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6085', 'ARRACHERA MARINADA SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6162', 'CABEZA DE FILETE NATURAL SAN CARLOS', 'San Carlos', 1),
('6164', 'CABEZA DE FILETE NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6113', 'CARNE PARA ASAR MARINADA SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6024', 'CHAMBERETE SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6165', 'CHAMBERETE NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6056', 'CHULETA DE LOMO / CLUB STEAK SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6128', 'COSTILLA CARGADA/SHORT RIB SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6087', 'CONCHA SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6166', 'COSTILLA CARGADA/SHORT RIB NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6042', 'COSTILLA COUNTRY SAN CARLOS', 'San Carlos', 1),
('6025', 'COSTILLA SIMPLE CON FLECHA SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6167', 'COSTILLA SIMPLE CON FLECHA NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6127', 'COSTILLA TABLITA SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6168', 'COSTILLA TABLITA NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6027', 'DESHEBRE SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6169', 'DESHEBRE NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6028', 'DIEZMILLO C/HUESO SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6082', 'FILETE DE RES SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6170', 'FILETE DE RES NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6083', 'HUESO TUETANERO SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6029', 'PALETA CON HUESO SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6171', 'PALETA CON HUESO NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6172', 'PALETA CON HUESO ROLADA SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6096', 'PECHO SIN BRISKET SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6031', 'PESCUEZO CON HUESO SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6173', 'PESCUEZO CON HUESO NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('2162', 'PESCUEZO DESHUESADO SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6174', 'PESCUEZO DESHUESADO NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6137', 'PRIME RIB CON TAPA PIEZA BASICA SAN CARLOS', 'San Carlos', 1),
('6175', 'PRIME RIB CON TAPA NATURAL PIEZA BASICA SAN CARLOS', 'San Carlos', 1),
('6035', 'RECORTE 70/30 NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6084', 'RECORTE 90/10 NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6149', 'RECORTE PULPA PULPA SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6176', 'RIÑON DE RES SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6036', 'RIB EYE ROLL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6156', 'SET DE PULPAS NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6040', 'SET DE PULPAS SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6088', 'SUADERO SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6177', 'SUADERO SAN CARLOS NATURAL PIEZA BASICA', 'San Carlos', 1),
('6038', 'T-BONE SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6178', 'T-BONE SAN CARLOS NATURAL PIEZA BASICA', 'San Carlos', 1),
('6039', 'TOP SIRLOIN SAN CARLOS PIEZA BASICA', 'San Carlos', 1),
('6179', 'TOP SIRLOIN NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos', 1);

-- ── Clientes de ejemplo (agrega/edita los reales desde la pantalla Clientes) ──
INSERT INTO clientes (nombre, rfc, contacto, telefono, activo) VALUES
('Abastos', '', '', '', 1),
('Torreón Jardín', '', '', '', 1);

SELECT 'Instalación inicial completada' AS resultado;
