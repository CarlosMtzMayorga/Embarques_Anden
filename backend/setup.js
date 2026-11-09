// Ejecutar UNA VEZ después de crear las tablas:
//   node setup.js
// Crea el usuario admin y carga el catálogo de productos iniciales.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool   = require('./src/db');

const PRODUCTOS = [
  ['6077', 'AGUJA NORTEÑA PIEZA BASICA', 'Engorda'],
  ['2178', 'AGUJA NORTEÑA NATURAL', 'Engorda'],
  ['6078', 'ARRACHERA MARINADA PIEZA BASICA', 'Engorda'],
  ['2129', 'ARRACHERA MARINADA FLAP MEAT PIEZA BASICA', 'Engorda'],
  ['2124', 'ARRACHERA NATURAL PIEZA BASICA', 'Engorda'],
  ['6079', 'BRISKET PIEZA BASICA', 'Engorda'],
  ['2179', 'BRISKET NATURAL PIEZA BASICA', 'Engorda'],
  ['2007', 'CABRERIA PIEZA BASICA', 'Engorda'],
  ['2180', 'CABRERIA NATURAL PIEZA BASICA', 'Engorda'],
  ['6117', 'CARNE PARA ASAR MARINADA PIEZA BASICA', 'Engorda'],
  ['2122', 'CHAMBERETE PIEZA BASICA', 'Engorda'],
  ['2181', 'CHAMBERETE NATURAL PIEZA BASICA', 'Engorda'],
  ['2182', 'CHULETA DE LOMO/CLUB STEAK PIEZA BASICA', 'Engorda'],
  ['2172', 'CONCHA PIEZA BASICA', 'Engorda'],
  ['2183', 'CONCHA NATURAL PIEZA BASICA', 'Engorda'],
  ['2174', 'COLA DE RES PIEZA BASICA', 'Engorda'],
  ['2157', 'COSTILLA CARGADA - SHORT RIB (PIEZA BASICA)', 'Engorda'],
  ['2184', 'COSTILLA CARGADA/SHORT RIB NATURAL (PIEZA BASICA)', 'Engorda'],
  ['2021', 'COSTILLA COUNTRY PIEZA BASICA', 'Engorda'],
  ['2185', 'COSTILLA COUNTRY NATURAL PIEZA BASICA', 'Engorda'],
  ['2135', 'COSTILLA DE RIB EYE PIEZA BASICA', 'Engorda'],
  ['2164', 'COSTILLA SIMPLE CON FLECHA NATURAL PIEZA BASICA', 'Engorda'],
  ['2131', 'COSTILLA SIMPLE CON FLECHA PIEZA BASICA', 'Engorda'],
  ['2026', 'COSTILLA TABLITA PIEZA BASICA', 'Engorda'],
  ['2027', 'COW BOY PIEZA BASICA', 'Engorda'],
  ['2128', 'DESHEBRE PIEZA BASICA', 'Engorda'],
  ['2186', 'DESHEBRE NATURAL PIEZA BASICA', 'Engorda'],
  ['6080', 'DIEZMILLO CON HUESO PIEZA BASICA', 'Engorda'],
  ['2134', 'FILETE DE RES PIEZA BASICA', 'Engorda'],
  ['2187', 'FILETE DE RES NATURAL PIEZA BASICA', 'Engorda'],
  ['2188', 'FURLON DE RES', 'Engorda'],
  ['6075', 'HUESO TUETANERO PIEZA BASICA', 'Engorda'],
  ['2049', 'MOLLEJA DE RES PIEZA BASICA', 'Engorda'],
  ['2144', 'NEW YORK PIEZA BASICA', 'Engorda'],
  ['2189', 'NEW YORK NATURAL PIEZA BASICA', 'Engorda'],
  ['6109', 'PALETA CON HUESO PIEZA BASICA', 'Engorda'],
  ['2190', 'PALETA CON HUESO NATURAL PIEZA BASICA', 'Engorda'],
  ['2191', 'PALETA CON HUESO ROLADA PIEZA BASICA', 'Engorda'],
  ['2192', 'PALETA CON HUESO ROLADA NATURALPIEZA BASICA', 'Engorda'],
  ['6100', 'PECHO CON HUESO PIEZA BASICA', 'Engorda'],
  ['2193', 'PECHO CON HUESO NATURAL PIEZA BASICA', 'Engorda'],
  ['2156', 'PECHO SIN BRISKET PIEZA BASICA', 'Engorda'],
  ['6115', 'PESCUEZO CON HUESO NATURAL PIEZA BASICA', 'Engorda'],
  ['6064', 'PESCUEZO CON HUESO PIEZA BASICA', 'Engorda'],
  ['2136', 'PESCUEZO SIN HUESO PIEZA BASICA', 'Engorda'],
  ['2194', 'PESCUEZO SIN HUESO NATURAL PIEZA BASICA', 'Engorda'],
  ['2123', 'PRIME RIB CON TAPA PIEZA BASICA', 'Engorda'],
  ['2195', 'PRIME RIB CON TAPA NATURAL PIEZA BASICA', 'Engorda'],
  ['2054', 'PICANHA PIEZA BASICA', 'Engorda'],
  ['2133', 'RECORTE 80/20 NATURAL PIEZA BASICA', 'Engorda'],
  ['2132', 'RECORTE 90/10 NATURAL PIEZA BASICA', 'Engorda'],
  ['2105', 'RIB EYE LIP ON PIEZA BASICA', 'Engorda'],
  ['2196', 'RIB EYE LIP ON NATURAL PIEZA BASICA', 'Engorda'],
  ['2065', 'RIB EYE ROLL PIEZA BASICA', 'Engorda'],
  ['2197', 'RIB EYE ROLL NATURAL PIEZA BASICA', 'Engorda'],
  ['2198', 'RIÑON DE RES PIEZA BASICA', 'Engorda'],
  ['2113', 'SET DE PULPAS NATURAL PIEZA BASICA', 'Engorda'],
  ['2171', 'SUADERO PIEZA BASICA', 'Engorda'],
  ['2199', 'SUADERO NATURAL PIEZA BASICA', 'Engorda'],
  ['2072', 'T-BONE PIEZA BASICA', 'Engorda'],
  ['2200', 'T-BONE NATURAL PIEZA BASICA', 'Engorda'],
  ['2073', 'TOMAHAWK', 'Engorda'],
  ['2126', 'TOP SIRLOIN NATURAL PIEZA BASICA', 'Engorda'],
  ['2076', 'TOP SIRLOIN PIEZA BASICA', 'Engorda'],
  ['6081', 'AGUJA NORTEÑA SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6163', 'AGUJA NORTEÑA NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6085', 'ARRACHERA MARINADA SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6162', 'CABEZA DE FILETE NATURAL SAN CARLOS', 'San Carlos'],
  ['6164', 'CABEZA DE FILETE NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6113', 'CARNE PARA ASAR MARINADA SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6024', 'CHAMBERETE SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6165', 'CHAMBERETE NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6056', 'CHULETA DE LOMO / CLUB STEAK SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6128', 'COSTILLA CARGADA/SHORT RIB SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6087', 'CONCHA SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6166', 'COSTILLA CARGADA/SHORT RIB NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6042', 'COSTILLA COUNTRY SAN CARLOS', 'San Carlos'],
  ['6025', 'COSTILLA SIMPLE CON FLECHA SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6167', 'COSTILLA SIMPLE CON FLECHA NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6127', 'COSTILLA TABLITA SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6168', 'COSTILLA TABLITA NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6027', 'DESHEBRE SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6169', 'DESHEBRE NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6028', 'DIEZMILLO C/HUESO SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6082', 'FILETE DE RES SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6170', 'FILETE DE RES NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6083', 'HUESO TUETANERO SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6029', 'PALETA CON HUESO SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6171', 'PALETA CON HUESO NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6172', 'PALETA CON HUESO ROLADA SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6096', 'PECHO SIN BRISKET SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6031', 'PESCUEZO CON HUESO SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6173', 'PESCUEZO CON HUESO NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['2162', 'PESCUEZO DESHUESADO SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6174', 'PESCUEZO DESHUESADO NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6137', 'PRIME RIB CON TAPA PIEZA BASICA SAN CARLOS', 'San Carlos'],
  ['6175', 'PRIME RIB CON TAPA NATURAL PIEZA BASICA SAN CARLOS', 'San Carlos'],
  ['6035', 'RECORTE 70/30 NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6084', 'RECORTE 90/10 NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6149', 'RECORTE PULPA PULPA SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6176', 'RIÑON DE RES SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6036', 'RIB EYE ROLL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6156', 'SET DE PULPAS NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6040', 'SET DE PULPAS SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6088', 'SUADERO SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6177', 'SUADERO SAN CARLOS NATURAL PIEZA BASICA', 'San Carlos'],
  ['6038', 'T-BONE SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6178', 'T-BONE SAN CARLOS NATURAL PIEZA BASICA', 'San Carlos'],
  ['6039', 'TOP SIRLOIN SAN CARLOS PIEZA BASICA', 'San Carlos'],
  ['6179', 'TOP SIRLOIN NATURAL SAN CARLOS PIEZA BASICA', 'San Carlos'],
];

async function main() {
  console.log('Conectando a la base de datos...');

  // Usuario admin
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO usuarios (usuario, password_hash, nombre, rol, activo)
     VALUES ('admin', ?, 'Administrador', 'admin', 1)
     ON DUPLICATE KEY UPDATE usuario=usuario`,
    [hash]
  );
  console.log('✓ Usuario admin creado (password: admin123)');

  // Usuario operador
  const hash2 = await bcrypt.hash('embarques123', 10);
  await pool.query(
    `INSERT INTO usuarios (usuario, password_hash, nombre, rol, activo)
     VALUES ('embarques', ?, 'Op. Embarques', 'operador', 1)
     ON DUPLICATE KEY UPDATE usuario=usuario`,
    [hash2]
  );
  console.log('✓ Usuario embarques creado (password: embarques123)');

  // Catálogo de productos
  for (const [codigo, nombre, tipo_ganado] of PRODUCTOS) {
    await pool.query(
      `INSERT INTO productos (codigo, nombre, tipo_ganado, activo)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE codigo=codigo`,
      [codigo, nombre, tipo_ganado]
    );
  }
  console.log('✓ Catálogo de productos cargado');

  console.log('\nSetup completado. Ya puedes iniciar el servidor con: npm start');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
