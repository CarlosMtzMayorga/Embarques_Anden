# Instrucciones para actualizar embarques.carnesfinaselanden.com.mx (backend PHP)

Usa esto solo si el sistema **ya está instalado** (ver `PRIMERA-INSTALACION.md`
si es la primera vez). Esta carpeta trae:

- `embarques-php.zip` — el sitio completo actualizado (backend PHP + frontend
  compilado).
- `actualizacion-BD-incremental.sql` — script para actualizar la base de datos
  **sin borrar nada**: solo agrega columnas/índices/tablas que falten. Es
  seguro correrlo aunque ya lo hayas corrido antes.

Sigue los pasos EN ORDEN. Ninguno requiere línea de comandos.

## 0. Respaldo (recomendado, toma 10 segundos)

cPanel → **phpMyAdmin** → selecciona tu base de datos → pestaña **Exportar**
→ método "Rápido" → **Continuar**. Guarda el archivo por si acaso.

## 1. Actualizar la base de datos

1. cPanel → **phpMyAdmin** → selecciona tu base de datos.
2. Pestaña **SQL**.
3. Abre `actualizacion-BD-incremental.sql` con el Bloc de notas, copia todo
   el contenido y pégalo en el cuadro de texto.
4. Botón **Continuar/Ejecutar** — al final debe decir "Actualización de base
   de datos completada".

## 2. Subir los archivos

1. cPanel → **Administrador de archivos** → entra a la carpeta
   `embarques.carnesfinaselanden.com.mx`.
2. **Importante:** localiza tu `api/config.php` actual y **no lo borres, no
   lo toques** — tiene las credenciales reales de tu base de datos y no viene
   en este paquete.
3. Sube `embarques-php.zip` ahí y dale clic derecho → **Extraer**. Cuando
   pregunte si quieres reemplazar archivos existentes, dile que sí a todo
   **excepto** a `api/config.php`.
4. Puedes borrar el .zip después de extraerlo.

No hay que instalar dependencias ni reiniciar ningún servicio — es PHP puro,
Apache toma el código nuevo en la siguiente petición.

## 3. Verificar

1. Entra a https://embarques.carnesfinaselanden.com.mx/login e inicia sesión.
2. Revisa que el sistema cargue normal y que tus datos (lotes, entradas,
   salidas, clientes) sigan ahí.
3. Prueba el flujo o la función específica que motivó esta actualización.

Si algo no carga o da error después de estos pasos, mándame el mensaje exacto
que veas y lo revisamos.
