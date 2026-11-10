# Primera instalación en embarques.carnesfinaselanden.com.mx (backend PHP)

Hostgator confirmó que el plan de hosting compartido **no soporta Node.js**, así
que el backend se reescribió completo en **PHP puro** (sin dependencias/Composer)
para correr nativamente en ese hosting — el frontend (React) y la base de datos
MySQL no cambiaron en nada.

Usa estos 2 archivos de esta carpeta:

- `embarques-php.zip` — el sitio completo listo para extraer: el backend PHP
  (`api/`) + el frontend ya compilado, todo junto (así es como se sirve: un
  solo document root, sin build ni npm install en el servidor).
- `instalacion-inicial-BD.sql` — crea las 13 tablas desde cero y siembra
  usuarios (`admin`/`admin123`, `embarques`/`embarques123`) + los 16 productos
  del catálogo. Ya se probó completo en una base vacía y corre limpio.

No uses `INSTRUCCIONES.md` ni `actualizacion-BD-incremental.sql` hoy — esos son
para cuando ya esté instalado y subas una actualización futura.

Sigue los pasos EN ORDEN.

## 1. Crear la base de datos MySQL

1. cPanel → **Bases de datos MySQL®**.
2. En "Crear una base de datos nueva", pon un nombre (ej. `embarques`) →
   **Crear base de datos**. cPanel le pone un prefijo automático, algo como
   `carnesf1_embarques`. Anota el nombre completo que quede.
3. Baja a "MySQL® Usuarios" → crea un usuario nuevo (ej. `embarques_app`) con
   una contraseña fuerte → **anota la contraseña**, no la vas a poder ver
   después. cPanel también le pone prefijo: `carnesf1_embarques_app`.
4. Baja a "Añadir usuario a la base de datos" → selecciona ese usuario y esa
   base de datos → **Añadir** → marca **Todos los privilegios (ALL
   PRIVILEGES)** → **Hacer cambios**.

Con esto ya tienes 3 datos que vas a necesitar en el paso 3: nombre completo
de la base, usuario completo, contraseña.

## 2. Crear las tablas (phpMyAdmin)

1. cPanel → **phpMyAdmin** → selecciona la base de datos que acabas de crear.
2. Pestaña **SQL**.
3. Abre `instalacion-inicial-BD.sql` con el Bloc de notas, copia todo el
   contenido y pégalo en el cuadro de texto.
4. Botón **Continuar/Ejecutar**.
5. Debe terminar con "Instalación inicial completada" y, si haces clic en la
   base de datos en la columna izquierda, debes ver 13 tablas.

## 3. Elegir la versión de PHP

1. cPanel → **MultiPHP Manager** (búscalo en el buscador de arriba si no lo
   ves en la lista de Tools).
2. Busca el dominio `embarques.carnesfinaselanden.com.mx` en la lista y
   asígnale **PHP 8.1 o superior** (el código funciona desde PHP 7.4, pero
   usa la versión más reciente disponible).
3. Guarda el cambio.

## 4. Subir los archivos

1. cPanel → **Administrador de archivos** → entra a la carpeta
   `embarques.carnesfinaselanden.com.mx` (la que viste vacía).
2. Sube `embarques-php.zip` ahí y dale clic derecho → **Extraer**.
3. Puedes borrar el .zip después de extraerlo. Al terminar, la carpeta debe
   quedar con `index.html`, `assets/`, `api/`, y el archivo `.htaccess`
   directamente adentro (no dentro de una subcarpeta).
4. Dentro de `api/`, **renombra** `config.php.example` a `config.php`, ábrelo
   con el editor de código de cPanel, y llena los 3 valores de MySQL con los
   que anotaste en el paso 1:

   ```php
   'db' => [
       'host'     => 'localhost',
       'port'     => 3306,
       'database' => 'carnesf1_embarques',
       'user'     => 'carnesf1_embarques_app',
       'password' => 'la_contraseña_que_pusiste_en_el_paso_1',
   ],
   'jwt_secret' => 'escribe_aqui_una_frase_larga_y_unica_que_nadie_mas_sepa',
   ```

   Guarda el archivo. **Este archivo no debe compartirse ni subirse a ningún
   lado más** — tiene las credenciales reales.
5. Fuera de la carpeta que acabas de extraer (un nivel arriba, junto a
   `embarques.carnesfinaselanden.com.mx`, NO adentro), crea una carpeta
   llamada `embarques_uploads` con una subcarpeta `romaneajes` adentro — ahí
   se van a guardar los PDF de romaneaje, fuera del alcance directo del
   navegador por seguridad. Luego edita `config.php` y ajusta la ruta:

   ```php
   'uploads_dir' => '/home2/carnesf1/embarques_uploads/romaneajes',
   ```

   (Usa la ruta real que te muestre el Administrador de archivos — el
   "Directorio Principal" que aparece en la pantalla de inicio de cPanel,
   más `/embarques_uploads/romaneajes`.)

No hay que instalar dependencias ni reiniciar ningún servicio — es PHP puro,
Apache lo sirve directo en cuanto subes los archivos.

## 5. Verificar

1. Entra a https://embarques.carnesfinaselanden.com.mx/login
2. Inicia sesión con `admin` / `admin123`. **Cambia esa contraseña** (y la de
   `embarques`) en cuanto puedas.
3. Revisa que el menú lateral muestre: Canales/Romaneaje, Entradas, Salidas,
   Existencias, Etiquetas, Reportes, Clientes/Productos, Movimientos de
   inventario, Inventario inicial, **Báscula**, y (como admin) Bitácora.
4. Prueba el flujo completo:
   - Crea un lote nuevo en **Canales**.
   - Entra a **Entradas**, ábrelo desde la lista, captura una caja (código de
     producto y Enter, kilos y Enter) — debe registrar e imprimir.
   - Sube un PDF de romaneaje a un lote y ábrelo de vuelta — confirma que se
     ve el mismo PDF.
   - Entra a **Salidas** → "+ Nueva salida", elige un cliente, escanea el
     código de barras de la caja que acabas de crear y Enter.
   - Revisa que **Existencias** y **Reportes** muestren esos movimientos.
   - Edita o elimina algo con justificación y confirma que aparezca en
     **Bitácora**.
5. **Báscula**: entra a esa pantalla desde la máquina donde está conectada la
   báscula por puerto serial, usando **Google Chrome o Microsoft Edge**.
   Configura velocidad/paridad y el patrón para leer el peso, "Guardar y
   conectar", selecciona el puerto COM. Con la báscula conectada, en
   **Entradas** el campo "Kilos" se llena solo con el peso en vivo — da Enter
   para registrar e imprimir.

Si algo no carga o da error en cualquier paso (sobre todo un "401" en todo o
un error 500 al hacer login), mándame el mensaje exacto o una captura y lo
revisamos — el caso más común es que `config.php` no se haya guardado bien o
que la versión de PHP asignada sea muy vieja.
