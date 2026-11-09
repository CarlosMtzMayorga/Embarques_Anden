# Sistema de Embarques — Carnes Finas el Andén (TIF 680)

Sistema web para el control de producción, embarques, inventario y trazabilidad de cajas y canales de la empacadora. 

- **Producción:** [embarques.carnesfinaselanden.com.mx](https://embarques.carnesfinaselanden.com.mx/login)
- **Repositorio:** [github.com/CarlosMtzMayorga/Embarques_Anden](https://github.com/CarlosMtzMayorga/Embarques_Anden.git)

---

## Estructura del proyecto

```
backend/                 API en Express (Node.js) + MySQL (desarrollo local)
  src/
    routes/              Rutas por módulo (canales, entradas, salidas, movimientos, usuarios, etc.)
    middleware/          auth.js (JWT), requireAdmin.js (solo administrador)
    lib/                 barcode.js, zpl.js, bitacora.js
    db/                  Conexión a MySQL (mysql2)
  public/                Build de React integrado para correr todo en un solo puerto
  schema.sql             Esquema de base de datos
  reset-y-carga-articulos.sql  Script para resetear BD e importar catálogo de 110 artículos
  setup.js               Siembra usuarios iniciales + catálogo de 110 productos
  migrate.js             Migración incremental segura para MySQL

backend-php/             Backend en PHP nativo (para cPanel / hosting compartido sin Node.js)
  public/api/            Endpoints PHP espejo del backend Node.js

frontend/                SPA en React + Vite + Tailwind CSS
  src/
    pages/               Vistas por módulo (Canales, Entradas, Salidas, Existencias, Usuarios, etc.)
    components/          Componentes UI reutilizables (Sidebar, Table, Modal, Button, etc.)
    api/                 Cliente axios y servicios de comunicación con la API
    lib/                 Generador de código de barras, formateadores y exportación CSV
```

---

## Cómo correr en desarrollo local

### Opción A: Sistema unificado (Recomendado)
El backend en Node.js ya incluye el build del frontend compilado en `public/`. Con un solo comando tienes todo corriendo en un solo puerto:

```bash
cd backend
npm install
npm run dev      # Corre en http://localhost:3001
```

Abre en tu navegador: **[http://localhost:3001](http://localhost:3001)**

### Opción B: Modo desarrollo separado (Hot-Reload)
Si vas a realizar modificaciones continuas a la interfaz de React:

1. **Backend:**
   ```bash
   cd backend
   npm run dev   # Puerto 3001
   ```
2. **Frontend:**
   ```bash
   cd frontend
   npm run dev   # Puerto 5173 (con proxy configurado hacia :3001)
   ```

### Usuarios de prueba locales (Modo Demo / Desarrollo)
- **Administrador:** `admin` / `admin123`
- **Operador:** `embarques` / `embarques123`

> [!NOTE]
> El backend cuenta con fallback automático en memoria: si no tienes MySQL activo localmente, el sistema arranca con datos de prueba y el catálogo completo de 110 productos en memoria.

---

## Reseteo de Base de Datos y Carga de Artículos

Para arrancar el sistema en blanco desde cero y dar de alta el catálogo completo de **110 artículos** oficiales (líneas Engorda y San Carlos):

1. Abre **cPanel > phpMyAdmin**.
2. Selecciona tu base de datos (ej. `carnesf1_embarques`).
3. Ve a la pestaña **SQL**.
4. Ejecuta el script [`backend/reset-y-carga-articulos.sql`](backend/reset-y-carga-articulos.sql).

El script realiza:
- Limpieza total de transacciones y pruebas (`entradas`, `salidas`, `movimientos_inventario`, `etiquetas`, `canales`, `lotes`, `bitacora`).
- Reinicio de consecutivos: el siguiente lote que se cree arrancará en el folio **#1**.
- Alta automática de los **110 artículos** con sus códigos, nombres y tipo de ganado.
- Conserva intactos a tus usuarios administradores y operadores ya existentes.

---

## Módulos del Sistema

### 1. Canales / Romaneaje (`/canales`)
- Registro de lotes con folio consecutivo automático real.
- Captura de canales por lote con cálculo automático de peso frío (medios o cuartos).
- Carga y visualización de archivo PDF de romaneaje por lote.
- Edición y eliminación auditada con justificación obligatoria.

### 2. Entradas de Producto Terminado (`/entradas`)
- Captura por caja individual con consecutivo por producto dentro del lote.
- Identificación inmediata al teclear o escanear el código del producto.
- Generación automática de etiqueta ZPL con código de barras en formato canónico `CODIGO-LOTE-CAJA-KILOS`.
- Integración directa con Zebra Browser Print para impresión térmica.

### 3. Salidas / Embarques (`/salidas`)
- Registro de salidas por cliente (incluyendo tiendas propias).
- Folio automático consecutivo y campo de observaciones.
- Escaneo continuo de cajas con validación en tiempo real.

### 4. Movimientos de Inventario (`/movimientos`)
- Control de ajustes internos: mermas, decomisos y correcciones de inventario.
- Flujo de autorización: los operadores solicitan el movimiento en estado *pendiente* y únicamente el administrador puede *autorizar* o *rechazar*.

### 5. Existencias (`/existencias`)
- Inventario en tiempo real por producto y tipo de ganado: Entradas − Salidas ± Movimientos autorizados.
- Consulta de existencias históricas a cualquier fecha seleccionada.

### 6. Inventario Inicial (`/inventario-inicial`)
- Alta rápida de cajas físicas existentes mediante escaneo directo de código de barras.

### 7. Etiquetas (`/etiquetas`)
- Consulta, filtro y reimpresión de etiquetas generadas.
- Cancelación lógica de etiquetas con justificación obligatoria.

### 8. Gestión de Usuarios (`/usuarios`, Administrador)
- Creación, modificación de rol (admin / operador) y activación/desactivación de usuarios del sistema.

### 9. Bitácora de Auditoría (`/bitacora`, Administrador)
- Registro histórico de cualquier edición, baja o autorización en el sistema: usuario, fecha, motivo/justificación y comparativa antes/después (JSON).

### 10. Catálogos (`/clientes`, `/productos`)
- Mantenimiento CRUD de clientes y artículos/productos (código, nombre y tipo de ganado).

---

## Despliegue en Servidor de Producción (cPanel)

El servidor en producción corre bajo **Apache + PHP 8.1+** utilizando la versión nativa ubicada en `backend-php/`.

1. En el Administrador de Archivos de cPanel, dentro de la raíz del dominio `embarques.carnesfinaselanden.com.mx`:
   - Colocar los archivos de `backend-php/public/` (`api/`, `.htaccess`).
   - Colocar el build compilado del frontend (`index.html`, `assets/`, `logo-anden.png`, `icons.svg`).
2. En `api/config.php` configurar las credenciales de la base de datos MySQL de producción y la ruta segura de subida de romaneajes.
3. No requiere reinicio de servicios ni dependencias en el servidor.
