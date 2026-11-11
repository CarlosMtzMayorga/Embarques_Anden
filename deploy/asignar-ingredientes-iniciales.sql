-- ============================================================================
-- SCRIPT: Asignación masiva de ingredientes a los 110 productos
-- ============================================================================
-- ID 1: 'Detallado (inyectado, con aditivos)' -> Marinados (con sales, fosfatos, etc.)
-- ID 2: 'Simple (solo carne y/o hueso de res)' -> Cortes naturales / con hueso
-- ============================================================================

-- 1. Asignar 'Simple' (ID 2) por defecto a todos los productos activos
UPDATE productos 
SET ingrediente_id = 2 
WHERE activo = 1;

-- 2. Asignar 'Detallado' (ID 1) a los productos marinados / inyectados
UPDATE productos 
SET ingrediente_id = 1 
WHERE nombre LIKE '%MARINAD%' AND activo = 1;

-- 3. Verificación de asignación
SELECT 
  ie.nombre AS formula_ingrediente,
  COUNT(p.id) AS total_productos
FROM productos p
LEFT JOIN ingredientes_etiqueta ie ON p.ingrediente_id = ie.id
GROUP BY ie.nombre;
