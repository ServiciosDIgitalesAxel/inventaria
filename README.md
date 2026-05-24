# INVENTARIA - Bomberos Voluntarios

Aplicacion web para control de stock, vencimientos y equipos asignados al personal.

## Camino recomendado: costo cero

La primera version real esta preparada para funcionar como Web App de Google Apps Script:

- La pantalla vive en `index.html`.
- El backend de `code.gs` crea una planilla privada de Google Sheets con inventario, personal, asignaciones, movimientos, observaciones, archivos, alertas, configuracion y usuarios.
- Las fotos y documentos de cada ficha se guardan en una carpeta privada de Google Drive y se descargan desde la aplicacion, sin publicar enlaces abiertos.
- Un disparador diario de Apps Script envia por correo las alarmas pendientes al cumplirse cada etapa: 1 ano, 6 meses, 1 mes, 2 semanas, 1 dia o vencido.
- Cada etapa se notifica una vez; desde la interfaz puede resolverse, ocultarse o reactivarse dejando responsable y observacion.
- La app se ejecuta como la cuenta administradora: los usuarios autorizados no necesitan acceso directo a la Sheet ni a la carpeta de Drive.
- El acceso se valida mediante un codigo temporal enviado al correo registrado; no se almacenan contrasenas.
- Si se marca "Mantener sesion iniciada en este equipo", la sesion queda activa por 365 dias y se renueva automaticamente cada vez que se abre la app.
- Cada movimiento conserva el responsable declarado y la identidad de la cuenta autenticada que lo registro.
- La vista Calendario muestra vencimientos, asignaciones, cambios, bajas y movimientos relevantes por fecha.

Esta solucion no necesita contratar hosting, base de datos ni servicio de notificaciones. Usa los servicios de la cuenta de Google que publique el sistema y queda sujeta a las cuotas de Apps Script y espacio disponible en Drive.

## Probar en localhost

En PowerShell, dentro de esta carpeta:

```powershell
npm run dev
```

Luego abrir `http://localhost:5173/`.

Si aparece `EADDRINUSE`, ya existe una vista local corriendo en el puerto `5173`: abra esa URL o cierre esa terminal con `Ctrl+C` antes de volver a iniciar el comando.

En localhost se muestran datos de demostracion y las modificaciones duran hasta recargar la pagina. El indicador superior dice `Modo local - demostracion`.

Para probar el puente real contra GAS desde localhost, use la URL `/exec` publicada y abra la app con `?api=1`:

```powershell
$env:GAS_WEBAPP_URL="https://script.google.com/macros/s/REEMPLAZAR/exec"
npm run dev
```

Luego abrir `http://localhost:5173/?api=1`. Sin `GAS_WEBAPP_URL`, el endpoint local `/api/gas/*` responde como mock de prueba.

## Publicar en Google Apps Script con acceso seguro

1. Cree un proyecto nuevo de Apps Script con la cuenta Google que sera propietaria privada de la informacion.
2. Copie `code.gs` dentro del archivo `Code.gs` del proyecto.
3. Cree un archivo HTML llamado `index` y copie `index.html`.
4. En `Code.gs`, verifique que `adminInicial` tenga el correo, nombre y apellido del administrador.
5. Seleccione la funcion `instalarSistemaInicial` en el editor y pulse `Ejecutar`. Autorice Sheets, Drive y envio de correo cuando Google lo solicite.
6. Revise el registro de ejecucion: alli aparece el enlace de la planilla privada creada. No comparta esa planilla con encargados ni usuarios de consulta.
7. Si muestra el manifiesto del proyecto, puede copiar tambien el contenido de `appsscript.json` para usar la zona horaria de Cordoba.
8. En `Implementar > Nueva implementacion`, elija `Aplicacion web`.
9. En `Ejecutar como`, seleccione `Yo` o la cuenta administradora que creo el proyecto.
10. En `Quien tiene acceso`, seleccione usuarios con cuenta Google (`Cualquier usuario` que haya iniciado sesion, si aparece esa opcion). El correo autorizado dentro de la app es la segunda barrera de acceso.
11. Abra la URL terminada en `/exec`, escriba el correo del administrador inicial y reciba el codigo temporal.
12. Una vez dentro, abra `Configuracion`, defina el correo de alarmas y active o desactive las notificaciones.
13. Abra `Usuarios` y agregue los correos del equipo con rol `Encargado` o `Consulta`.

La instalacion inicial crea la planilla y la carpeta privada, sin datos de prueba. El boton `Configuracion` permite activar el disparador diario de alarmas. Solamente el administrador ve el enlace a la planilla y el panel de usuarios.

## Roles implementados

| Rol | Alcance desde la app |
| --- | --- |
| Administrador | Control total, configuracion y alta/eliminacion de usuarios. La eliminacion de usuarios no se registra en bitacora. |
| Encargado | Operaciones de stock, personal, alertas, fichas, archivos y exportaciones; no administra usuarios. |
| Consulta | Lectura de inventario, personal, alertas y bitacora; sin cambios ni exportaciones. |

Para actualizar codigo luego de la primera prueba, edite el proyecto y cree una nueva version de la implementacion web. La planilla y usuarios existentes se conservan.

## Publicar como PWA en Cloudflare Pages

Cloudflare Pages puede alojar `index.html`, `manifest.webmanifest` y `service-worker.js` como PWA. La carpeta `functions/api/gas/[name].js` agrega un puente privado: el navegador llama a `/api/gas/guardarEstado` y Cloudflare reenvia la solicitud al Web App `/exec` de Google Apps Script.

Pasos:

1. Publique primero el backend en Google Apps Script y copie la URL terminada en `/exec`.
   - Para usar Cloudflare como puente, la Web App de Apps Script debe permitir acceso a `Cualquier persona`. Cloudflare llama al `/exec` desde servidor, sin una sesion Google del navegador. La seguridad queda dentro de INVENTARIA: token, OTP por correo y roles.
2. En Cloudflare, cree un proyecto de Pages desde esta carpeta o desde un repositorio Git.
3. Build command: dejar vacio. Output directory: `/` o raiz del proyecto.
4. En `Settings > Environment variables`, agregue `GAS_WEBAPP_URL` con la URL `/exec` de Apps Script.
5. Haga deploy y abra la URL `*.pages.dev`.
6. Ingrese con el correo autorizado. En telefono, use la opcion del navegador para instalar la app.

Si no se configura `GAS_WEBAPP_URL`, la PWA se abre pero no puede conectar con Sheets. Ese estado sirve solo para revisar pantalla, instalacion y cache.

## Si se publico como Worker (`workers.dev`)

Una URL terminada en `workers.dev` no ejecuta la carpeta `functions/`; esa carpeta es de Cloudflare Pages. Para Worker use `cloudflare-worker.js` junto con `wrangler.toml`.

Si el Worker esta conectado a GitHub:

1. Suba al repositorio `cloudflare-worker.js`, `wrangler.toml`, `.assetsignore`, `index.html`, `manifest.webmanifest` y `service-worker.js`.
2. En Cloudflare, el deploy command puede ser `npm run deploy`.
3. `wrangler.toml` ya define `GAS_WEBAPP_URL`, `main = "./cloudflare-worker.js"` y los assets estaticos desde la raiz del proyecto.
4. `.assetsignore` evita publicar como archivos publicos el codigo de GAS, README, configuraciones y scripts locales.
5. Haga push a `main`; Cloudflare deberia reconstruir automaticamente.

Si `/api/gas/solicitarCodigoAcceso` devuelve 404, el Worker no esta ejecutando `cloudflare-worker.js` o la ruta API no quedo publicada. Si devuelve 502, Cloudflare si llego al Worker, pero Apps Script no devolvio JSON: revise la implementacion de GAS y el acceso `Cualquier persona`.

## Rendimiento

La interfaz trabaja primero en memoria del navegador para que los botones respondan rapido. Los cambios se agrupan durante una pausa corta y luego se sincronizan con GAS, evitando una llamada al servidor por cada click.

En GAS se aplica cache de lectura durante 30 minutos y se evita revisar la estructura de hojas en cada llamada. La escritura conserva el modelo de planilla, pero limpia solo las filas usadas en vez de recorrer toda la hoja completa.

Cuando otro usuario guarda cambios, las pantallas abiertas consultan una revision liviana cada pocos segundos. Si detectan cambios remotos, actualizan inventario, personal, bitacora y calendario sin recargar la pagina. Si la pantalla local tiene un guardado pendiente, espera a terminar para no pisar la operacion en curso.

## Calendario operativo

La seccion `Calendario` cruza fechas del inventario, fichas y bitacora:

- Vencimientos de equipos disponibles en stock.
- Vencimientos de equipos actualmente asignados al personal.
- Fechas de asignacion.
- Fechas de cambio, baja o devolucion.
- Registros relevantes de bitacora, sin incluir exportaciones.

El calendario no reemplaza las alarmas por correo: las complementa. La alarma empuja el aviso; el calendario permite planificar controles y revisar el mes completo.

## PWA y avisos push

La version incluida ya trae manifiesto PWA y service worker para alojamiento estatico. En Google Apps Script puro se mantiene como web app normal; en Cloudflare Pages puede instalarse como PWA en el telefono.

Por ahora, las alarmas reales siguen por correo desde Apps Script. Las notificaciones push conviene dejarlas como segunda etapa: requieren guardar suscripciones por dispositivo y manejar permisos del navegador, algo que es viable, pero mejor encararlo despues de validar el flujo diario con el cuartel.
