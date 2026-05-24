const APP_CONFIG = {
  nombre: 'INVENTARIA - Control de Stock',
  spreadsheetKey: 'INDUMENTARIA_SPREADSHEET_ID',
  folderKey: 'INDUMENTARIA_FOLDER_ID',
  revisionKey: 'INDUMENTARIA_REVISION',
  emailKey: 'INDUMENTARIA_EMAIL_ALERTAS',
  notificationsKey: 'INDUMENTARIA_ALERTAS_ACTIVAS',
  schemaKey: 'INDUMENTARIA_SCHEMA_VERSION',
  cacheKey: 'INDUMENTARIA_ESTADO_CACHE',
  sheetUpdatedKey: 'INDUMENTARIA_SHEET_UPDATED',
  editTriggerKey: 'INDUMENTARIA_EDIT_TRIGGER_ID',
  fcmServiceAccountKey: 'INVENTARIA_FCM_SERVICE_ACCOUNT_JSON',
  fcmProjectKey: 'INVENTARIA_FCM_PROJECT_ID',
  schemaVersion: '2026-05-24-unidades-pwa-push-1',
  timezone: 'America/Argentina/Cordoba',
  uploadMaxBytes: 5 * 1024 * 1024,
  otpMinutes: 10,
  otpCooldownSeconds: 60,
  sessionHours: 12,
  sessionRememberDays: 365,
  adminInicial: {
    email: 'serviciosdigitalesaxel@gmail.com',
    nombre: 'Axel Alex',
    apellido: 'Lisoni'
  }
};

const SHEETS = {
  Inventario: ['id', 'categoria', 'subcategoria', 'talle', 'cantidad', 'vencimiento', 'marca'],
  Unidades: ['id', 'itemId', 'codigo', 'estado', 'bomberoId', 'asignacionId', 'fechaEstado', 'observacion'],
  Personal: ['id', 'nombre', 'apellido', 'rango', 'tallesJson', 'noCorrespondeJson'],
  Asignaciones: ['id', 'bomberoId', 'itemId', 'cantidad', 'fechaEntrega', 'fechaDevolucion', 'entregadoPor', 'comentario', 'estado', 'cambioJson', 'bajaJson', 'origenCambioJson', 'unidadesJson'],
  Movimientos: ['id', 'tipo', 'item', 'cantidad', 'fecha', 'responsable', 'comentario', 'usuarioEmail', 'usuarioNombre'],
  Observaciones: ['id', 'bomberoId', 'tipo', 'texto', 'responsable', 'fecha'],
  Archivos: ['id', 'bomberoId', 'nombre', 'tipo', 'tamano', 'fecha', 'tipoRegistro', 'responsable', 'url', 'fileId'],
  Alertas: ['key', 'estadoJson'],
  Categorias: ['categoria', 'subcategoria'],
  Configuracion: ['clave', 'valor'],
  Usuarios: ['email', 'nombre', 'apellido', 'rol', 'activo', 'creado', 'ultimoAcceso'],
  PushDispositivos: ['id', 'email', 'nombre', 'token', 'plataforma', 'userAgent', 'idioma', 'activo', 'creado', 'ultimoAcceso']
};

const ROLES = {
  ADMINISTRADOR: 'Administrador',
  ENCARGADO: 'Encargado',
  CONSULTA: 'Consulta',
  REPORTES: 'Reportes'
};

const PERMISOS_POR_ROL = {
  Administrador: ['CONSULTAR', 'OPERAR', 'EXPORTAR', 'CONFIGURAR', 'USUARIOS'],
  Encargado: ['CONSULTAR', 'OPERAR', 'EXPORTAR', 'CONFIGURAR'],
  Consulta: ['CONSULTAR'],
  Reportes: ['CONSULTAR', 'EXPORTAR']
};

function doGet(e) {
  if (e && e.parameter && e.parameter.ping === '1') {
    return ContentService
      .createTextOutput(`INVENTARIA OK - ${new Date().toISOString()}`)
      .setMimeType(ContentService.MimeType.TEXT);
  }

  if (e && e.parameter && e.parameter.movil === '1') {
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
        <head>
          <base target="_top">
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>INVENTARIA - Prueba móvil</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              min-height: 100vh;
              display: grid;
              place-items: center;
              margin: 0;
              background: #f7fafc;
              color: #1a202c;
            }
            main {
              max-width: 420px;
              padding: 24px;
              text-align: center;
            }
            img {
              width: 84px;
              height: 84px;
              object-fit: contain;
              margin-bottom: 16px;
            }
            h1 {
              margin: 0 0 8px;
              font-size: 24px;
            }
            p {
              margin: 6px 0;
              line-height: 1.4;
            }
            code {
              display: inline-block;
              margin-top: 12px;
              padding: 8px 10px;
              border-radius: 6px;
              background: #edf2f7;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <main>
            <img src="https://i.imgur.com/YMqwuaR.png" alt="Logo">
            <h1>INVENTARIA OK</h1>
            <p>La Web App de Google Apps Script carga HTML correctamente en este dispositivo.</p>
            <code>${new Date().toISOString()}</code>
          </main>
        </body>
      </html>
    `)
      .setTitle('INVENTARIA - Prueba móvil')
      .setFaviconUrl('https://i.imgur.com/YMqwuaR.png');
  }

  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('INVENTARIA - Control de Stock')
    .setFaviconUrl('https://i.imgur.com/YMqwuaR.png');
}

function ping(message) {
  return {
    ok: true,
    runtime: 'Google Apps Script',
    message: message || 'Conectado',
    timestamp: new Date().toISOString()
  };
}

function doPost(e) {
  try {
    const body = parseJson_(e && e.postData && e.postData.contents) || {};
    const functionName = String(body.functionName || body.fn || body.name || '').trim();
    const payload = Object.prototype.hasOwnProperty.call(body, 'payload') ? body.payload : body;
    const permitidas = {
      ping: ping,
      solicitarCodigoAcceso: solicitarCodigoAcceso,
      validarCodigoAcceso: validarCodigoAcceso,
      obtenerSesion: obtenerSesion,
      obtenerRevision: obtenerRevision,
      cerrarSesion: cerrarSesion,
      configurarSistema: configurarSistema,
      obtenerDatosIniciales: obtenerDatosIniciales,
      guardarEstado: guardarEstado,
      actualizarNotificaciones: actualizarNotificaciones,
      subirArchivoFicha: subirArchivoFicha,
      obtenerArchivoFicha: obtenerArchivoFicha,
      listarUsuarios: listarUsuarios,
      guardarUsuario: guardarUsuario,
      eliminarUsuario: eliminarUsuario,
      registrarDispositivoPush: registrarDispositivoPush,
      desactivarDispositivoPush: desactivarDispositivoPush,
      enviarPushPrueba: enviarPushPrueba
    };
    if (!permitidas[functionName]) {
      throw new Error('Funcion API no permitida: ' + functionName);
    }
    return jsonApi_(permitidas[functionName](payload));
  } catch (error) {
    return jsonApi_({
      ok: false,
      error: error && error.message ? error.message : String(error)
    });
  }
}

function jsonApi_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload || {}))
    .setMimeType(ContentService.MimeType.JSON);
}

function instalarSistemaInicial() {
  const resultado = instalarSistemaInicial_();
  return {
    ok: true,
    mensaje: 'Instalacion completa. Revise el registro de ejecucion para ver el enlace privado de la planilla.'
  };
}

/**
 * Run this function once from the Apps Script editor before publishing the app.
 * It creates private storage and registers the first administrator.
 */
function instalarSistemaInicial_() {
  const admin = APP_CONFIG.adminInicial;
  if (admin.email.indexOf('REEMPLAZAR_') !== -1 || admin.nombre.indexOf('REEMPLAZAR_') !== -1 || admin.apellido.indexOf('REEMPLAZAR_') !== -1) {
    throw new Error('Complete APP_CONFIG.adminInicial con su correo, nombre y apellido antes de ejecutar la instalacion.');
  }
  validarEmail_(admin.email);
  validarNombreCompleto_(admin.nombre + ' ' + admin.apellido);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    let spreadsheet = obtenerSpreadsheet_();
    if (!spreadsheet) {
      spreadsheet = SpreadsheetApp.create(APP_CONFIG.nombre);
      props.setProperty(APP_CONFIG.spreadsheetKey, spreadsheet.getId());
    }
    if (!props.getProperty(APP_CONFIG.folderKey)) {
      const folder = DriveApp.createFolder('INVENTARIA - Archivos del personal');
      props.setProperty(APP_CONFIG.folderKey, folder.getId());
    }

    prepararHojas_(spreadsheet, true);
    guardarUsuario_(spreadsheet, {
      email: admin.email,
      nombre: admin.nombre,
      apellido: admin.apellido,
      rol: ROLES.ADMINISTRADOR,
      activo: true
    });
    if (!props.getProperty(APP_CONFIG.emailKey)) {
      props.setProperty(APP_CONFIG.emailKey, admin.email.trim());
    }
    if (!props.getProperty(APP_CONFIG.notificationsKey)) {
      props.setProperty(APP_CONFIG.notificationsKey, 'false');
    }
    guardarConfiguracion_(spreadsheet);
    instalarTriggerCambiosPlanilla_(spreadsheet);
    actualizarRevision_(spreadsheet);

    Logger.log('Planilla privada: ' + spreadsheet.getUrl());
    Logger.log('Administrador inicial: ' + admin.email);
    return {
      ok: true,
      spreadsheetUrl: spreadsheet.getUrl(),
      administrador: normalizarEmail_(admin.email)
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Sends a temporary access code only when the email is active in Usuarios.
 * The response is intentionally generic so unknown emails are not disclosed.
 */
function solicitarCodigoAcceso(payload) {
  payload = payload || {};
  const email = normalizarEmail_(payload.email);
  validarEmail_(email);
  const mensaje = 'Si el correo esta autorizado, recibira un codigo de acceso valido por ' + APP_CONFIG.otpMinutes + ' minutos.';
  const spreadsheet = obtenerSpreadsheet_();
  if (!spreadsheet) {
    throw new Error('El administrador todavia no instalo el almacenamiento del sistema.');
  }
  prepararHojas_(spreadsheet);
  const usuario = obtenerUsuario_(spreadsheet, email);
  if (!usuario || !usuario.activo) {
    return { ok: true, mensaje: mensaje };
  }

  const props = PropertiesService.getScriptProperties();
  const key = otpKey_(email);
  const anterior = parseJson_(props.getProperty(key)) || {};
  const ahora = new Date().getTime();
  if (anterior.enviadoEn && ahora - anterior.enviadoEn < APP_CONFIG.otpCooldownSeconds * 1000) {
    return { ok: true, mensaje: mensaje };
  }

  const codigo = generarCodigo_();
  props.setProperty(key, JSON.stringify({
    hash: hash_(email + '|' + codigo),
    vence: ahora + APP_CONFIG.otpMinutes * 60 * 1000,
    enviadoEn: ahora,
    intentos: 0
  }));
  MailApp.sendEmail({
    to: email,
    subject: '[INVENTARIA] Codigo de acceso',
    body: [
      'Su codigo temporal para ingresar al sistema es: ' + codigo,
      '',
      'Vence en ' + APP_CONFIG.otpMinutes + ' minutos.',
      'Si usted no solicito este ingreso, ignore este mensaje.'
    ].join('\n'),
    name: 'INVENTARIA'
  });
  return { ok: true, mensaje: mensaje };
}

function validarCodigoAcceso(payload) {
  payload = payload || {};
  const email = normalizarEmail_(payload.email);
  const codigo = String(payload.codigo || '').replace(/\s/g, '');
  validarEmail_(email);
  if (!/^\d{6}$/.test(codigo)) {
    throw new Error('Ingrese el codigo de seis digitos enviado por correo.');
  }

  const spreadsheet = requerirSpreadsheet_();
  const usuario = obtenerUsuario_(spreadsheet, email);
  if (!usuario || !usuario.activo) {
    throw new Error('El codigo es incorrecto o ya vencio.');
  }

  const props = PropertiesService.getScriptProperties();
  const otpKey = otpKey_(email);
  const otp = parseJson_(props.getProperty(otpKey)) || {};
  const ahora = new Date().getTime();
  if (!otp.hash || !otp.vence || otp.vence < ahora || Number(otp.intentos || 0) >= 5) {
    props.deleteProperty(otpKey);
    throw new Error('El codigo es incorrecto o ya vencio.');
  }
  if (otp.hash !== hash_(email + '|' + codigo)) {
    otp.intentos = Number(otp.intentos || 0) + 1;
    props.setProperty(otpKey, JSON.stringify(otp));
    throw new Error('El codigo es incorrecto o ya vencio.');
  }

  const recordar = payload.recordar !== false;
  const token = Utilities.getUuid() + Utilities.getUuid();
  const vence = calcularVencimientoSesion_(recordar);
  props.setProperty(sessionKey_(token), JSON.stringify({ email: email, vence: vence, recordar: recordar }));
  props.deleteProperty(otpKey);
  actualizarUltimoAcceso_(spreadsheet, email);
  return {
    ok: true,
    token: token,
    vence: new Date(vence).toISOString(),
    usuario: usuarioPublico_(usuario)
  };
}

function obtenerSesion(payload) {
  const sesion = exigirSesion_(payload && payload.token);
  return { ok: true, usuario: usuarioPublico_(sesion.usuario) };
}

function obtenerRevision(payload) {
  exigirSesionBasica_(payload && payload.token);
  const spreadsheet = obtenerSpreadsheet_();
  const revision = spreadsheet
    ? sincronizarRevisionConPlanilla_(spreadsheet)
    : PropertiesService.getScriptProperties().getProperty(APP_CONFIG.revisionKey) || '';
  return {
    ok: true,
    revision: revision
  };
}

function cerrarSesion(payload) {
  if (payload && payload.token) {
    PropertiesService.getScriptProperties().deleteProperty(sessionKey_(payload.token));
  }
  return { ok: true };
}

/**
 * Updates notification settings after private storage already exists.
 * The first installation is intentionally not available from the public UI.
 */
function configurarSistema(opciones) {
  opciones = opciones || {};
  const sesion = exigirPermiso_(opciones.token, 'CONFIGURAR');
  validarNombreCompleto_(opciones.responsable);
  validarEmail_(opciones.email);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    const spreadsheet = requerirSpreadsheet_();
    prepararHojas_(spreadsheet);
    props.setProperty(APP_CONFIG.emailKey, opciones.email.trim());
    props.setProperty(APP_CONFIG.notificationsKey, opciones.activadas === false ? 'false' : 'true');

    const estadoExistente = cargarEstadoConCache_(spreadsheet);
    if (estadoExistente.historialMovimientos.length === 0) {
      estadoExistente.historialMovimientos.push(firmarMovimiento_(nuevoMovimiento_(
        [],
        'Configuracion',
        'Sistema',
        0,
        opciones.responsable,
        'Almacenamiento en Google Sheets y avisos por correo activados.'
      ), sesion));
      escribirEstado_(spreadsheet, estadoExistente);
      guardarEstadoEnCache_(estadoExistente);
    }

    guardarConfiguracion_(spreadsheet);
    if (opciones.activadas === false) {
      eliminarTriggersDeAlertas_();
    } else {
      instalarTriggerDiario_();
    }
    actualizarRevision_(spreadsheet);
  } finally {
    lock.releaseLock();
  }

  return obtenerDatosIniciales({ token: opciones.token });
}

function obtenerDatosIniciales(payload) {
  const sesion = exigirPermiso_(payload && payload.token, 'CONSULTAR');
  const spreadsheet = requerirSpreadsheet_();

  prepararHojas_(spreadsheet);
  if (sesion.usuario.rol === ROLES.ADMINISTRADOR) {
    asegurarTriggerCambiosPlanilla_(spreadsheet);
  }
  sincronizarRevisionConPlanilla_(spreadsheet);
  const estado = cargarEstadoConCache_(spreadsheet);
  const props = PropertiesService.getScriptProperties();
  return {
    ok: true,
    configurado: true,
    runtime: 'Google Apps Script',
    revision: props.getProperty(APP_CONFIG.revisionKey) || '',
    emailAlertas: props.getProperty(APP_CONFIG.emailKey) || '',
    notificacionesActivas: props.getProperty(APP_CONFIG.notificationsKey) !== 'false',
    spreadsheetUrl: sesion.usuario.rol === ROLES.ADMINISTRADOR ? spreadsheet.getUrl() : '',
    estado: estado,
    usuario: usuarioPublico_(sesion.usuario)
  };
}

/**
 * Stores a complete UI snapshot while preserving the immutable movement log.
 * Lock + revision avoid overwriting a second operator's recent operation.
 */
function guardarEstado(payload) {
  payload = payload || {};
  const sesion = exigirPermiso_(payload.token, 'OPERAR');
  validarNombreCompleto_(payload.operador);
  const spreadsheet = requerirSpreadsheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const props = PropertiesService.getScriptProperties();
    const revisionServidor = props.getProperty(APP_CONFIG.revisionKey) || '';
    if (payload.revision && revisionServidor && payload.revision !== revisionServidor) {
      return {
        ok: false,
        conflicto: true,
        mensaje: 'Los datos fueron modificados desde otra pantalla. Recargue antes de continuar.'
      };
    }

    const estadoActual = cargarEstadoConCache_(spreadsheet);
    const estadoNuevo = normalizarEstado_(payload.estado);
    validarOperacionAuditada_(estadoActual, estadoNuevo);
    firmarMovimientosNuevos_(estadoActual.historialMovimientos, estadoNuevo.historialMovimientos, sesion);
    conservarFirmasMovimientos_(estadoActual.historialMovimientos, estadoNuevo.historialMovimientos);
    validarMovimientosInmutables_(estadoActual.historialMovimientos, estadoNuevo.historialMovimientos);
    estadoNuevo.alertasGestionadas = conservarNotificacionesEnviadas_(
      estadoActual.alertasGestionadas,
      estadoNuevo.alertasGestionadas
    );

    escribirEstado_(spreadsheet, estadoNuevo);
    guardarEstadoEnCache_(estadoNuevo);
    const revisionNueva = actualizarRevision_(spreadsheet);
    return { ok: true, revision: revisionNueva };
  } finally {
    lock.releaseLock();
  }
}

function actualizarNotificaciones(opciones) {
  opciones = opciones || {};
  const sesion = exigirPermiso_(opciones.token, 'CONFIGURAR');
  validarNombreCompleto_(opciones.responsable);
  validarEmail_(opciones.email);
  const spreadsheet = requerirSpreadsheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty(APP_CONFIG.emailKey, opciones.email.trim());
    props.setProperty(APP_CONFIG.notificationsKey, opciones.activadas === false ? 'false' : 'true');
    guardarConfiguracion_(spreadsheet);

    if (opciones.activadas === false) {
      eliminarTriggersDeAlertas_();
    } else {
      instalarTriggerDiario_();
    }

    const estado = cargarEstadoConCache_(spreadsheet);
    estado.historialMovimientos.unshift(firmarMovimiento_(nuevoMovimiento_(
      estado.historialMovimientos,
      'Configuracion',
      'Notificaciones',
      0,
      opciones.responsable,
      opciones.activadas === false
        ? 'Avisos por correo desactivados.'
        : 'Avisos por correo activados para ' + opciones.email.trim() + '.'
    ), sesion));
    escribirEstado_(spreadsheet, estado);
    guardarEstadoEnCache_(estado);
    actualizarRevision_(spreadsheet);
  } finally {
    lock.releaseLock();
  }

  return obtenerDatosIniciales({ token: opciones.token });
}

function subirArchivoFicha(payload) {
  payload = payload || {};
  exigirPermiso_(payload.token, 'OPERAR');
  validarNombreCompleto_(payload.responsable);
  if (!payload.nombre || !payload.dataUrl) {
    throw new Error('El archivo no contiene datos para guardar.');
  }

  const match = /^data:([^;,]+)?(;base64)?,(.+)$/.exec(payload.dataUrl);
  if (!match || !match[2]) {
    throw new Error('El formato del archivo no es valido.');
  }

  const bytes = Utilities.base64Decode(match[3]);
  if (bytes.length > APP_CONFIG.uploadMaxBytes) {
    throw new Error('Cada archivo puede pesar hasta 5 MB.');
  }

  const folder = obtenerCarpeta_();
  const blob = Utilities.newBlob(bytes, payload.tipo || match[1] || 'application/octet-stream', payload.nombre);
  const file = folder.createFile(blob);
  return {
    nombre: file.getName(),
    tipo: payload.tipo || match[1] || 'application/octet-stream',
    tamano: bytes.length,
    fecha: fechaHoy_(),
    tipoRegistro: payload.tipoRegistro || 'Archivo',
    responsable: payload.responsable.trim(),
    url: file.getUrl(),
    fileId: file.getId()
  };
}

function obtenerArchivoFicha(payload) {
  payload = payload || {};
  exigirPermiso_(payload.token, 'CONSULTAR');
  const fileId = payload.fileId;
  const folder = obtenerCarpeta_();
  const file = DriveApp.getFileById(fileId);
  let perteneceALaCarpeta = false;
  const parents = file.getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === folder.getId()) {
      perteneceALaCarpeta = true;
      break;
    }
  }
  if (!perteneceALaCarpeta) {
    throw new Error('El archivo solicitado no pertenece al sistema.');
  }
  const blob = file.getBlob();
  if (blob.getBytes().length > APP_CONFIG.uploadMaxBytes) {
    throw new Error('El archivo excede el tamano permitido para descarga desde la app.');
  }
  return {
    nombre: file.getName(),
    tipo: blob.getContentType() || 'application/octet-stream',
    dataUrl: 'data:' + (blob.getContentType() || 'application/octet-stream') + ';base64,' + Utilities.base64Encode(blob.getBytes())
  };
}

function listarUsuarios(payload) {
  exigirPermiso_(payload && payload.token, 'USUARIOS');
  const spreadsheet = requerirSpreadsheet_();
  prepararHojas_(spreadsheet);
  return {
    ok: true,
    usuarios: leerObjetos_(spreadsheet, 'Usuarios').map(function(usuario) {
      return usuarioPublico_(normalizarUsuario_(usuario));
    })
  };
}

function guardarUsuario(payload) {
  payload = payload || {};
  const sesion = exigirPermiso_(payload.token, 'USUARIOS');
  const usuario = payload.usuario || {};
  const email = normalizarEmail_(usuario.email);
  validarEmail_(email);
  validarNombreCompleto_(String(usuario.nombre || '') + ' ' + String(usuario.apellido || ''));
  if (!PERMISOS_POR_ROL[usuario.rol]) {
    throw new Error('Seleccione un rol valido.');
  }

  const spreadsheet = requerirSpreadsheet_();
  const activo = usuario.activo !== false;
  if (email === sesion.usuario.email && (!activo || usuario.rol !== ROLES.ADMINISTRADOR)) {
    throw new Error('El administrador conectado no puede quitarse su propio acceso de administracion.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    prepararHojas_(spreadsheet);
    guardarUsuario_(spreadsheet, {
      email: email,
      nombre: String(usuario.nombre).trim(),
      apellido: String(usuario.apellido).trim(),
      rol: usuario.rol,
      activo: activo
    });

    const estado = cargarEstadoConCache_(spreadsheet);
    estado.historialMovimientos.unshift(firmarMovimiento_(nuevoMovimiento_(
      estado.historialMovimientos,
      'Usuarios',
      email,
      0,
      sesion.usuario.nombre + ' ' + sesion.usuario.apellido,
      (activo ? 'Usuario habilitado/actualizado como ' : 'Usuario deshabilitado como ') + usuario.rol + '.'
    ), sesion));
    escribirEstado_(spreadsheet, estado);
    guardarEstadoEnCache_(estado);
    actualizarRevision_(spreadsheet);
  } finally {
    lock.releaseLock();
  }
  return listarUsuarios({ token: payload.token });
}

function eliminarUsuario(payload) {
  payload = payload || {};
  const sesion = exigirPermiso_(payload.token, 'USUARIOS');
  const email = normalizarEmail_(payload.email);
  validarEmail_(email);
  if (email === sesion.usuario.email) {
    throw new Error('No puede eliminar su propio usuario administrador mientras esta conectado.');
  }

  const spreadsheet = requerirSpreadsheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    prepararHojas_(spreadsheet);
    const usuarios = leerObjetos_(spreadsheet, 'Usuarios').map(normalizarUsuario_);
    const filtrados = usuarios.filter(function(usuario) {
      return usuario.email !== email;
    });
    if (filtrados.length === usuarios.length) {
      throw new Error('El usuario no existe.');
    }
    reemplazarFilas_(spreadsheet, 'Usuarios', filtrados.map(function(usuario) {
      return [
        usuario.email,
        usuario.nombre,
        usuario.apellido,
        usuario.rol,
        usuario.activo ? 'Si' : 'No',
        usuario.creado,
        usuario.ultimoAcceso || ''
      ];
    }));
    actualizarRevision_(spreadsheet);
  } finally {
    lock.releaseLock();
  }
  return listarUsuarios({ token: payload.token });
}

function registrarDispositivoPush(payload) {
  payload = payload || {};
  const sesion = exigirPermiso_(payload.token, 'CONSULTAR');
  const token = String(payload.token || '').trim();
  if (!token || token.length < 40) {
    throw new Error('El token push del dispositivo no es valido.');
  }

  const spreadsheet = requerirSpreadsheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    prepararHojas_(spreadsheet);
    const ahora = new Date().toISOString();
    const usuario = usuarioPublico_(sesion.usuario);
    let dispositivos = leerObjetos_(spreadsheet, 'PushDispositivos');
    let encontrado = false;
    dispositivos = dispositivos.map(function(dispositivo) {
      if (String(dispositivo.token || '') === token) {
        encontrado = true;
        return {
          id: dispositivo.id || Utilities.getUuid(),
          email: usuario.email,
          nombre: (usuario.nombre + ' ' + usuario.apellido).trim(),
          token: token,
          plataforma: String(payload.plataforma || dispositivo.plataforma || ''),
          userAgent: String(payload.userAgent || dispositivo.userAgent || '').slice(0, 500),
          idioma: String(payload.idioma || dispositivo.idioma || ''),
          activo: 'Si',
          creado: dispositivo.creado || ahora,
          ultimoAcceso: ahora
        };
      }
      return dispositivo;
    });
    if (!encontrado) {
      dispositivos.push({
        id: Utilities.getUuid(),
        email: usuario.email,
        nombre: (usuario.nombre + ' ' + usuario.apellido).trim(),
        token: token,
        plataforma: String(payload.plataforma || ''),
        userAgent: String(payload.userAgent || '').slice(0, 500),
        idioma: String(payload.idioma || ''),
        activo: 'Si',
        creado: ahora,
        ultimoAcceso: ahora
      });
    }
    escribirDispositivosPush_(spreadsheet, dispositivos);
  } finally {
    lock.releaseLock();
  }

  return {
    ok: true,
    mensaje: 'Dispositivo registrado para notificaciones push.'
  };
}

function desactivarDispositivoPush(payload) {
  payload = payload || {};
  const sesion = exigirSesion_(payload.token);
  const token = String(payload.dispositivoToken || payload.pushToken || '').trim();
  if (!token) return { ok: true };

  const spreadsheet = requerirSpreadsheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    prepararHojas_(spreadsheet);
    const dispositivos = leerObjetos_(spreadsheet, 'PushDispositivos').map(function(dispositivo) {
      if (String(dispositivo.token || '') === token && normalizarEmail_(dispositivo.email) === sesion.usuario.email) {
        dispositivo.activo = 'No';
      }
      return dispositivo;
    });
    escribirDispositivosPush_(spreadsheet, dispositivos);
  } finally {
    lock.releaseLock();
  }

  return { ok: true };
}

function enviarPushPrueba(payload) {
  payload = payload || {};
  const sesion = exigirPermiso_(payload.token, 'CONSULTAR');
  const pushToken = String(payload.pushToken || '').trim();
  if (!pushToken) {
    throw new Error('Primero registre este dispositivo para push.');
  }
  const spreadsheet = requerirSpreadsheet_();
  prepararHojas_(spreadsheet);
  const dispositivo = leerObjetos_(spreadsheet, 'PushDispositivos').find(function(registro) {
    return String(registro.token || '') === pushToken &&
      normalizarEmail_(registro.email) === sesion.usuario.email &&
      registro.activo !== 'No';
  });
  if (!dispositivo) {
    throw new Error('Este dispositivo no esta registrado para push.');
  }
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(APP_CONFIG.fcmServiceAccountKey) || !props.getProperty(APP_CONFIG.fcmProjectKey)) {
    throw new Error('Firebase todavia no esta configurado en Script Properties.');
  }

  enviarPushFCM_([pushToken], {
    title: 'INVENTARIA',
    body: 'Push de prueba enviado correctamente.',
    url: './',
    tag: 'inventaria-prueba'
  });

  return {
    ok: true,
    mensaje: 'Push de prueba enviado. Si Firebase esta configurado, deberia llegar en unos segundos.'
  };
}

/**
 * Trigger handler. It mails each milestone once: one year, six months,
 * one month, two weeks, one day and expired.
 */
function procesarAlertasVencimiento_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty(APP_CONFIG.notificationsKey) === 'false') return;

  const email = props.getProperty(APP_CONFIG.emailKey) || '';
  if (!email) return;

  const spreadsheet = obtenerSpreadsheet_();
  if (!spreadsheet) return;
  const estado = cargarEstadoConCache_(spreadsheet);
  const alertas = crearAlertasVencimiento_(estado);
  const pendientes = [];

  alertas.forEach(function(alerta) {
    const gestion = estado.alertasGestionadas[alerta.key] || {};
    const silenciada = gestion.resolved || (gestion.stages || []).indexOf(alerta.stage.id) !== -1;
    const notificada = gestion.notificados && gestion.notificados[alerta.stage.id];
    if (silenciada || notificada) return;

    pendientes.push(alerta);
    gestion.notificados = gestion.notificados || {};
    gestion.notificados[alerta.stage.id] = fechaHoy_();
    estado.alertasGestionadas[alerta.key] = gestion;
  });

  if (pendientes.length === 0) return;

  const lineas = pendientes.map(function(alerta) {
    return '- ' + alerta.title + ' | ' + alerta.stage.label + ' | vence: ' + alerta.vencimiento;
  });
  const asunto = '[INVENTARIA] ' + pendientes.length + ' equipo(s) requieren control de vencimiento';
  const cuerpo = [
    'Hay equipos con vencimiento que requieren control:',
    '',
    lineas.join('\n'),
    '',
    'Ingrese al sistema para registrar cambio, baja, revision o silenciar el aviso.'
  ].join('\n');

  MailApp.sendEmail({
    to: email,
    subject: asunto,
    body: cuerpo,
    name: 'INVENTARIA'
  });
  enviarPushVencimientos_(spreadsheet, pendientes);
  escribirAlertas_(spreadsheet, estado.alertasGestionadas);
}

function escribirDispositivosPush_(spreadsheet, dispositivos) {
  reemplazarFilas_(spreadsheet, 'PushDispositivos', dispositivos.map(function(dispositivo) {
    return [
      dispositivo.id || Utilities.getUuid(),
      normalizarEmail_(dispositivo.email || ''),
      String(dispositivo.nombre || '').trim(),
      String(dispositivo.token || ''),
      String(dispositivo.plataforma || ''),
      String(dispositivo.userAgent || '').slice(0, 500),
      String(dispositivo.idioma || ''),
      dispositivo.activo === false || dispositivo.activo === 'No' ? 'No' : 'Si',
      dispositivo.creado || '',
      dispositivo.ultimoAcceso || ''
    ];
  }));
}

function enviarPushVencimientos_(spreadsheet, pendientes) {
  if (!pendientes || pendientes.length === 0) return;
  try {
    const tokens = leerObjetos_(spreadsheet, 'PushDispositivos')
      .filter(function(dispositivo) {
        return dispositivo.activo !== 'No' && dispositivo.token;
      })
      .map(function(dispositivo) {
        return String(dispositivo.token);
      });
    if (tokens.length === 0) return;

    enviarPushFCM_(tokens, {
      title: 'INVENTARIA: vencimientos',
      body: pendientes.length + ' equipo(s) requieren control.',
      url: './#calendario',
      tag: 'inventaria-vencimientos'
    });
  } catch (error) {
    Logger.log('No se pudieron enviar push: ' + error.message);
  }
}

function enviarPushFCM_(tokens, mensaje) {
  const props = PropertiesService.getScriptProperties();
  const serviceAccountText = props.getProperty(APP_CONFIG.fcmServiceAccountKey);
  const projectId = props.getProperty(APP_CONFIG.fcmProjectKey);
  if (!serviceAccountText || !projectId) return;

  const accessToken = obtenerFcmAccessToken_(serviceAccountText);
  const endpoint = 'https://fcm.googleapis.com/v1/projects/' + encodeURIComponent(projectId) + '/messages:send';
  tokens.forEach(function(token) {
    const payload = {
      message: {
        token: token,
        notification: {
          title: mensaje.title,
          body: mensaje.body
        },
        data: {
          title: mensaje.title,
          body: mensaje.body,
          url: mensaje.url || './',
          tag: mensaje.tag || 'inventaria'
        },
        webpush: {
          fcm_options: {
            link: mensaje.url || './'
          }
        }
      }
    };
    try {
      UrlFetchApp.fetch(endpoint, {
        method: 'post',
        contentType: 'application/json',
        headers: {
          Authorization: 'Bearer ' + accessToken
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
    } catch (error) {
      Logger.log('Error FCM token: ' + error.message);
    }
  });
}

function obtenerFcmAccessToken_(serviceAccountText) {
  const serviceAccount = parseJson_(serviceAccountText);
  if (!serviceAccount || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('La cuenta de servicio FCM no es valida.');
  }
  const now = Math.floor(new Date().getTime() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  const unsigned = base64Url_(JSON.stringify(header)) + '.' + base64Url_(JSON.stringify(claim));
  const signature = Utilities.computeRsaSha256Signature(unsigned, serviceAccount.private_key);
  const jwt = unsigned + '.' + base64Url_(signature);
  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    payload: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    },
    muteHttpExceptions: true
  });
  const data = parseJson_(response.getContentText()) || {};
  if (!data.access_token) {
    throw new Error('No se pudo obtener token OAuth para FCM.');
  }
  return data.access_token;
}

function obtenerSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(APP_CONFIG.spreadsheetKey);
  if (!id) return null;
  try {
    return SpreadsheetApp.openById(id);
  } catch (error) {
    return null;
  }
}

function requerirSpreadsheet_() {
  const spreadsheet = obtenerSpreadsheet_();
  if (!spreadsheet) {
    throw new Error('Primero debe configurar el almacenamiento del sistema.');
  }
  return spreadsheet;
}

function obtenerCarpeta_() {
  const id = PropertiesService.getScriptProperties().getProperty(APP_CONFIG.folderKey);
  if (!id) throw new Error('Primero debe configurar la carpeta de archivos.');
  return DriveApp.getFolderById(id);
}

function prepararHojas_(spreadsheet, force) {
  const props = PropertiesService.getScriptProperties();
  if (!force && props.getProperty(APP_CONFIG.schemaKey) === APP_CONFIG.schemaVersion) {
    return;
  }
  Object.keys(SHEETS).forEach(function(nombre) {
    let sheet = spreadsheet.getSheetByName(nombre);
    if (!sheet) sheet = spreadsheet.insertSheet(nombre);
    const headers = SHEETS[nombre];
    const lastColumn = Math.max(sheet.getLastColumn(), headers.length);
    const actual = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(String);
    if (actual.join('|') !== headers.join('|')) {
      const existentes = sheet.getLastRow() > 1
        ? sheet.getRange(2, 1, sheet.getLastRow() - 1, lastColumn).getValues()
        : [];
      const migradas = existentes.map(function(row) {
        return headers.map(function(header) {
          const index = actual.indexOf(header);
          return index === -1 ? '' : row[index];
        });
      });
      sheet.clearContents();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      if (migradas.length > 0) {
        sheet.getRange(2, 1, migradas.length, headers.length).setValues(migradas);
      }
    }
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a365d').setFontColor('#ffffff');
  });
  props.setProperty(APP_CONFIG.schemaKey, APP_CONFIG.schemaVersion);
}

function guardarConfiguracion_(spreadsheet) {
  const props = PropertiesService.getScriptProperties();
  reemplazarFilas_(spreadsheet, 'Configuracion', [
    ['emailAlertas', props.getProperty(APP_CONFIG.emailKey) || ''],
    ['notificacionesActivas', props.getProperty(APP_CONFIG.notificationsKey) !== 'false' ? 'Si' : 'No'],
    ['actualizado', new Date().toISOString()]
  ]);
}

function cargarEstadoConCache_(spreadsheet) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(APP_CONFIG.cacheKey);
  if (cached) {
    const estado = parseJson_(cached);
    if (estado) return normalizarEstado_(estado);
  }
  const estado = cargarEstado_(spreadsheet);
  guardarEstadoEnCache_(estado);
  return estado;
}

function guardarEstadoEnCache_(estado) {
  try {
    const texto = JSON.stringify(normalizarEstado_(estado));
    if (texto.length < 95000) {
      CacheService.getScriptCache().put(APP_CONFIG.cacheKey, texto, 1800);
    } else {
      CacheService.getScriptCache().remove(APP_CONFIG.cacheKey);
    }
  } catch (error) {
    try {
      CacheService.getScriptCache().remove(APP_CONFIG.cacheKey);
    } catch (ignored) {
      // Cache best-effort only.
    }
  }
}

function limpiarCacheEstado_() {
  try {
    CacheService.getScriptCache().remove(APP_CONFIG.cacheKey);
  } catch (ignored) {
    // Cache best-effort only.
  }
}

function actualizarRevision_(spreadsheet) {
  const revision = Utilities.getUuid();
  const props = PropertiesService.getScriptProperties();
  props.setProperty(APP_CONFIG.revisionKey, revision);
  registrarMarcaPlanilla_(spreadsheet);
  return revision;
}

function registrarMarcaPlanilla_(spreadsheet) {
  if (!spreadsheet) return '';
  try {
    const marca = String(DriveApp.getFileById(spreadsheet.getId()).getLastUpdated().getTime());
    PropertiesService.getScriptProperties().setProperty(APP_CONFIG.sheetUpdatedKey, marca);
    return marca;
  } catch (ignored) {
    return '';
  }
}

function sincronizarRevisionConPlanilla_(spreadsheet) {
  const props = PropertiesService.getScriptProperties();
  const marcaActual = registrarMarcaPlanillaTemporal_(spreadsheet);
  if (!marcaActual) return props.getProperty(APP_CONFIG.revisionKey) || '';

  const marcaAnterior = props.getProperty(APP_CONFIG.sheetUpdatedKey);
  if (!marcaAnterior) {
    props.setProperty(APP_CONFIG.sheetUpdatedKey, marcaActual);
    return props.getProperty(APP_CONFIG.revisionKey) || '';
  }

  if (marcaActual !== marcaAnterior) {
    limpiarCacheEstado_();
    props.setProperty(APP_CONFIG.sheetUpdatedKey, marcaActual);
    props.setProperty(APP_CONFIG.revisionKey, Utilities.getUuid());
  }

  return props.getProperty(APP_CONFIG.revisionKey) || '';
}

function registrarMarcaPlanillaTemporal_(spreadsheet) {
  if (!spreadsheet) return '';
  try {
    return String(DriveApp.getFileById(spreadsheet.getId()).getLastUpdated().getTime());
  } catch (ignored) {
    return '';
  }
}

function cargarEstado_(spreadsheet) {
  const inventario = leerObjetos_(spreadsheet, 'Inventario').map(function(item) {
    item.id = Number(item.id);
    item.cantidad = Number(item.cantidad);
    item.vencimiento = item.vencimiento || null;
    return item;
  });
  const unidades = leerObjetos_(spreadsheet, 'Unidades').map(function(unidad) {
    unidad.itemId = Number(unidad.itemId);
    return unidad;
  });
  inventario.forEach(function(item) {
    item.unidades = unidades.filter(function(unidad) {
      return Number(unidad.itemId) === Number(item.id);
    });
  });
  const personal = leerPersonal_(spreadsheet);
  const asignaciones = leerObjetos_(spreadsheet, 'Asignaciones');
  const observaciones = leerObjetos_(spreadsheet, 'Observaciones');
  const archivos = leerObjetos_(spreadsheet, 'Archivos');

  const bomberos = personal.map(function(bombero) {
    bombero.tallesPorCategoria = parseJson_(bombero.tallesJson) || {};
    const noCorresponde = parseJson_(bombero.noCorrespondeJson);
    bombero.noCorresponde = Array.isArray(noCorresponde) ? noCorresponde : [];
    delete bombero.tallesJson;
    delete bombero.noCorrespondeJson;
    bombero.asignaciones = asignaciones
      .filter(function(asig) { return asig.bomberoId === bombero.id; })
      .map(function(asig) {
        return {
          itemId: Number(asig.itemId),
          cantidad: Number(asig.cantidad),
          fechaEntrega: asig.fechaEntrega,
          fechaDevolucion: asig.fechaDevolucion || null,
          entregadoPor: asig.entregadoPor,
          comentario: asig.comentario,
          estado: asig.estado,
          cambio: parseJson_(asig.cambioJson),
          baja: parseJson_(asig.bajaJson),
          origenCambio: parseJson_(asig.origenCambioJson),
          unidades: parseJson_(asig.unidadesJson)
        };
      });
    bombero.observaciones = observaciones.filter(function(nota) { return nota.bomberoId === bombero.id; });
    bombero.archivos = archivos.filter(function(archivo) { return archivo.bomberoId === bombero.id; }).map(function(archivo) {
      archivo.tamano = Number(archivo.tamano) || 0;
      return archivo;
    });
    return bombero;
  });

  const historialMovimientos = leerObjetos_(spreadsheet, 'Movimientos').map(function(movimiento) {
    movimiento.id = Number(movimiento.id);
    movimiento.cantidad = Number(movimiento.cantidad);
    return movimiento;
  }).sort(function(a, b) { return b.id - a.id; });

  const alertasGestionadas = {};
  leerObjetos_(spreadsheet, 'Alertas').forEach(function(alerta) {
    alertasGestionadas[alerta.key] = parseJson_(alerta.estadoJson) || {};
  });

  const categorias = {};
  leerObjetos_(spreadsheet, 'Categorias').forEach(function(linea) {
    categorias[linea.categoria] = categorias[linea.categoria] || ['Todos'];
    if (linea.subcategoria && categorias[linea.categoria].indexOf(linea.subcategoria) === -1) {
      categorias[linea.categoria].push(linea.subcategoria);
    }
  });
  if (Object.keys(categorias).length === 0) {
    inventario.forEach(function(item) {
      categorias[item.categoria] = categorias[item.categoria] || ['Todos'];
      if (categorias[item.categoria].indexOf(item.subcategoria) === -1) {
        categorias[item.categoria].push(item.subcategoria);
      }
    });
  }

  return {
    inventario: inventario,
    bomberos: bomberos,
    historialMovimientos: historialMovimientos,
    alertasGestionadas: alertasGestionadas,
    categorias: categorias
  };
}

function normalizarEstado_(estado) {
  estado = estado || {};
  const limpio = {
    inventario: Array.isArray(estado.inventario) ? estado.inventario : [],
    bomberos: Array.isArray(estado.bomberos) ? estado.bomberos : [],
    historialMovimientos: Array.isArray(estado.historialMovimientos) ? estado.historialMovimientos : [],
    alertasGestionadas: estado.alertasGestionadas || {},
    categorias: estado.categorias || {}
  };

  limpio.historialMovimientos.forEach(function(movimiento) {
    validarNombreCompleto_(movimiento.responsable);
  });
  return limpio;
}

function escribirEstado_(spreadsheet, estado) {
  estado = normalizarEstado_(estado);
  reemplazarFilas_(spreadsheet, 'Inventario', estado.inventario.map(function(item) {
    return [item.id, item.categoria, item.subcategoria, item.talle, Number(item.cantidad) || 0, item.vencimiento || '', item.marca];
  }));
  const unidades = [];
  estado.inventario.forEach(function(item) {
    (item.unidades || []).forEach(function(unidad) {
      unidades.push([
        unidad.id || '',
        item.id,
        unidad.codigo || '',
        unidad.estado || 'Disponible',
        unidad.bomberoId || '',
        unidad.asignacionId || '',
        unidad.fechaEstado || '',
        unidad.observacion || ''
      ]);
    });
  });
  reemplazarFilas_(spreadsheet, 'Unidades', unidades);
  reemplazarFilas_(spreadsheet, 'Personal', estado.bomberos.map(function(bombero) {
    return [bombero.id, bombero.nombre, bombero.apellido, bombero.rango, jsonText_(bombero.tallesPorCategoria), jsonText_(bombero.noCorresponde || [])];
  }));

  const asignaciones = [];
  const observaciones = [];
  const archivos = [];
  estado.bomberos.forEach(function(bombero) {
    (bombero.asignaciones || []).forEach(function(asig, index) {
      asignaciones.push([
        bombero.id + '-' + (index + 1),
        bombero.id,
        asig.itemId,
        asig.cantidad,
        asig.fechaEntrega || '',
        asig.fechaDevolucion || '',
        asig.entregadoPor || '',
        asig.comentario || '',
        asig.estado || '',
        jsonText_(asig.cambio),
        jsonText_(asig.baja),
        jsonText_(asig.origenCambio),
        jsonText_(asig.unidades || [])
      ]);
    });
    (bombero.observaciones || []).forEach(function(nota) {
      observaciones.push([nota.id, bombero.id, nota.tipo || 'Observacion', nota.texto || '', nota.responsable || '', nota.fecha || '']);
    });
    (bombero.archivos || []).forEach(function(archivo, index) {
      archivos.push([
        archivo.id || bombero.id + '-A-' + (index + 1),
        bombero.id,
        archivo.nombre || '',
        archivo.tipo || '',
        archivo.tamano || 0,
        archivo.fecha || '',
        archivo.tipoRegistro || '',
        archivo.responsable || '',
        archivo.url || '',
        archivo.fileId || ''
      ]);
    });
  });
  reemplazarFilas_(spreadsheet, 'Asignaciones', asignaciones);
  reemplazarFilas_(spreadsheet, 'Observaciones', observaciones);
  reemplazarFilas_(spreadsheet, 'Archivos', archivos);
  reemplazarFilas_(spreadsheet, 'Movimientos', estado.historialMovimientos.map(function(mov) {
    return [mov.id, mov.tipo, mov.item, mov.cantidad || 0, mov.fecha || '', mov.responsable, mov.comentario || '', mov.usuarioEmail || '', mov.usuarioNombre || ''];
  }));
  escribirAlertas_(spreadsheet, estado.alertasGestionadas);

  const categorias = [];
  Object.keys(estado.categorias || {}).forEach(function(categoria) {
    (estado.categorias[categoria] || []).filter(function(sub) { return sub && sub !== 'Todos'; }).forEach(function(subcategoria) {
      categorias.push([categoria, subcategoria]);
    });
  });
  reemplazarFilas_(spreadsheet, 'Categorias', categorias);
}

function escribirAlertas_(spreadsheet, alertas) {
  reemplazarFilas_(spreadsheet, 'Alertas', Object.keys(alertas || {}).map(function(key) {
    return [key, JSON.stringify(alertas[key])];
  }));
}

function reemplazarFilas_(spreadsheet, nombre, rows) {
  const sheet = spreadsheet.getSheetByName(nombre);
  const headers = SHEETS[nombre];
  const filasActuales = Math.max(sheet.getLastRow() - 1, 0);
  if (filasActuales > 0) {
    sheet.getRange(2, 1, filasActuales, headers.length).clearContent();
  }
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function leerObjetos_(spreadsheet, nombre) {
  const sheet = spreadsheet.getSheetByName(nombre);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const headers = SHEETS[nombre];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getDisplayValues().map(function(row) {
    const object = {};
    headers.forEach(function(header, index) { object[header] = row[index]; });
    return object;
  });
}

function leerPersonal_(spreadsheet) {
  const principal = leerObjetos_(spreadsheet, 'Personal')
    .map(function(fila, index) { return normalizarFilaPersonal_(fila, index); })
    .filter(function(fila) { return fila.nombre || fila.apellido; });
  const claves = {};
  principal.forEach(function(fila) {
    claves[clavePersonal_(fila)] = true;
  });

  leerPersonalRelacion_(spreadsheet).forEach(function(fila) {
    const clave = clavePersonal_(fila);
    if (!claves[clave]) {
      principal.push(fila);
      claves[clave] = true;
    }
  });

  return principal;
}

function leerPersonalRelacion_(spreadsheet) {
  const sheet = obtenerHojaNormalizada_(spreadsheet, [
    'RELACION AL PERSONAL',
    'RELACION PERSONAL',
    'PERSONAL ACTIVO'
  ]);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
  const headers = values[0].map(normalizarTextoPlano_);
  return values.slice(1).map(function(row, index) {
    const apellidoNombre = valorPorAlias_(row, headers, ['apellido y nombre']);
    const nombreCompleto = valorPorAlias_(row, headers, ['nombre completo', 'personal', 'integrante']);
    const separado = apellidoNombre
      ? separarApellidoNombre_(apellidoNombre)
      : separarNombreApellido_(nombreCompleto);
    const fila = {
      id: valorPorAlias_(row, headers, ['id', 'codigo', 'nro', 'numero', 'identificador']),
      nombre: valorPorAlias_(row, headers, ['nombre', 'nombres']) || separado.nombre,
      apellido: valorPorAlias_(row, headers, ['apellido', 'apellidos']) || separado.apellido,
      rango: valorPorAlias_(row, headers, ['rango', 'jerarquia', 'cargo', 'funcion', 'grado']),
      tallesJson: valorPorAlias_(row, headers, ['tallesjson', 'talles json']) || '{}',
      noCorrespondeJson: valorPorAlias_(row, headers, ['nocorrespondejson', 'no corresponde json']) || '[]'
    };
    return normalizarFilaPersonal_(fila, index);
  }).filter(function(fila) { return fila.nombre || fila.apellido; });
}

function obtenerHojaNormalizada_(spreadsheet, nombres) {
  const buscados = nombres.map(normalizarTextoPlano_);
  const sheets = spreadsheet.getSheets();
  for (let i = 0; i < sheets.length; i += 1) {
    if (buscados.indexOf(normalizarTextoPlano_(sheets[i].getName())) !== -1) {
      return sheets[i];
    }
  }
  return null;
}

function valorPorAlias_(row, headers, aliases) {
  const normalizados = aliases.map(normalizarTextoPlano_);
  for (let i = 0; i < headers.length; i += 1) {
    if (normalizados.indexOf(headers[i]) !== -1) {
      return String(row[i] || '').trim();
    }
  }
  return '';
}

function normalizarFilaPersonal_(fila, index) {
  fila = fila || {};
  const nombreCompleto = String(fila.nombreCompleto || fila.personal || '').trim();
  const separado = separarNombreApellido_(nombreCompleto);
  fila.nombre = String(fila.nombre || separado.nombre || '').trim();
  fila.apellido = String(fila.apellido || separado.apellido || '').trim();
  fila.rango = String(fila.rango || '').trim();
  fila.id = String(fila.id || generarIdPersonal_(fila, index)).trim();
  fila.tallesJson = fila.tallesJson || '{}';
  fila.noCorrespondeJson = fila.noCorrespondeJson || '[]';
  return fila;
}

function separarNombreApellido_(texto) {
  texto = String(texto || '').trim();
  if (!texto) return { nombre: '', apellido: '' };
  if (texto.indexOf(',') !== -1) {
    const partesComa = texto.split(',');
    return {
      nombre: partesComa.slice(1).join(' ').trim(),
      apellido: partesComa[0].trim()
    };
  }
  const partes = texto.split(/\s+/).filter(Boolean);
  if (partes.length === 1) return { nombre: partes[0], apellido: '' };
  return {
    nombre: partes.slice(0, -1).join(' '),
    apellido: partes[partes.length - 1]
  };
}

function separarApellidoNombre_(texto) {
  texto = String(texto || '').trim();
  if (!texto) return { nombre: '', apellido: '' };
  if (texto.indexOf(',') !== -1) return separarNombreApellido_(texto);
  const partes = texto.split(/\s+/).filter(Boolean);
  if (partes.length === 1) return { nombre: '', apellido: partes[0] };
  return {
    nombre: partes.slice(1).join(' '),
    apellido: partes[0]
  };
}

function generarIdPersonal_(fila, index) {
  const basePersona = normalizarTextoPlano_([
    fila.nombre || '',
    fila.apellido || '',
    fila.rango || ''
  ].join('|'));
  const base = basePersona || ('fila-' + (index + 2));
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, base);
  return 'P-' + bytes.map(function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('').slice(0, 8).toUpperCase();
}

function clavePersonal_(fila) {
  return String(fila.id || '').trim() || normalizarTextoPlano_(fila.nombre + ' ' + fila.apellido);
}

function normalizarTextoPlano_(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function validarMovimientosInmutables_(anteriores, nuevos) {
  const nuevosPorId = {};
  nuevos.forEach(function(mov) { nuevosPorId[String(mov.id)] = mov; });
  anteriores.forEach(function(anterior) {
    const recibido = nuevosPorId[String(anterior.id)];
    if (!recibido || movimientoComparable_(anterior) !== movimientoComparable_(recibido)) {
      throw new Error('El historial de auditoria no puede modificarse ni eliminarse.');
    }
  });
}

function conservarFirmasMovimientos_(anteriores, nuevos) {
  const anterioresPorId = {};
  (anteriores || []).forEach(function(movimiento) {
    anterioresPorId[String(movimiento.id)] = movimiento;
  });
  (nuevos || []).forEach(function(movimiento) {
    const anterior = anterioresPorId[String(movimiento.id)];
    if (!anterior) return;
    movimiento.usuarioEmail = anterior.usuarioEmail || '';
    movimiento.usuarioNombre = anterior.usuarioNombre || '';
  });
}

function validarOperacionAuditada_(anterior, nuevo) {
  const idsAnteriores = {};
  (anterior.historialMovimientos || []).forEach(function(movimiento) {
    idsAnteriores[String(movimiento.id)] = true;
  });
  const tieneMovimientoNuevo = (nuevo.historialMovimientos || []).some(function(movimiento) {
    return !idsAnteriores[String(movimiento.id)];
  });
  const datosAnteriores = JSON.stringify([
    anterior.inventario,
    anterior.bomberos,
    anterior.alertasGestionadas,
    anterior.categorias
  ]);
  const datosNuevos = JSON.stringify([
    nuevo.inventario,
    nuevo.bomberos,
    nuevo.alertasGestionadas,
    nuevo.categorias
  ]);
  if (datosAnteriores !== datosNuevos && !tieneMovimientoNuevo) {
    throw new Error('Todo cambio debe incluir un registro en la bitacora.');
  }
}

function movimientoComparable_(movimiento) {
  return JSON.stringify([
    Number(movimiento.id),
    movimiento.tipo || '',
    movimiento.item || '',
    Number(movimiento.cantidad) || 0,
    movimiento.fecha || '',
    movimiento.responsable || '',
    movimiento.comentario || '',
    movimiento.usuarioEmail || '',
    movimiento.usuarioNombre || ''
  ]);
}

function firmarMovimientosNuevos_(anteriores, nuevos, sesion) {
  const idsAnteriores = {};
  (anteriores || []).forEach(function(movimiento) {
    idsAnteriores[String(movimiento.id)] = true;
  });
  (nuevos || []).forEach(function(movimiento) {
    if (!idsAnteriores[String(movimiento.id)]) {
      firmarMovimiento_(movimiento, sesion);
    }
  });
}

function firmarMovimiento_(movimiento, sesion) {
  if (!sesion || !sesion.usuario) return movimiento;
  movimiento.usuarioEmail = sesion.usuario.email;
  movimiento.usuarioNombre = sesion.usuario.nombre + ' ' + sesion.usuario.apellido;
  return movimiento;
}

function conservarNotificacionesEnviadas_(actuales, nuevos) {
  Object.keys(actuales || {}).forEach(function(key) {
    const enviadas = actuales[key] && actuales[key].notificados;
    if (!enviadas) return;
    nuevos[key] = nuevos[key] || {};
    nuevos[key].notificados = Object.assign({}, enviadas, nuevos[key].notificados || {});
  });
  return nuevos;
}

function crearAlertasVencimiento_(estado) {
  const items = {};
  estado.inventario.forEach(function(item) { items[String(item.id)] = item; });
  const alertas = [];

  estado.bomberos.forEach(function(bombero) {
    (bombero.asignaciones || []).forEach(function(asig, index) {
      if (asig.estado !== 'En uso') return;
      const item = items[String(asig.itemId)];
      const stage = etapaVencimiento_(item && item.vencimiento);
      if (!item || !stage) return;
      alertas.push({
        key: 'asignado:' + bombero.id + ':' + index + ':' + item.id,
        title: item.subcategoria + ' - ' + bombero.nombre + ' ' + bombero.apellido,
        vencimiento: item.vencimiento,
        stage: stage
      });
    });
  });
  estado.inventario.forEach(function(item) {
    const stage = etapaVencimiento_(item.vencimiento);
    if (!stage || Number(item.cantidad) <= 0) return;
    alertas.push({
      key: 'stock:' + item.id,
      title: item.subcategoria + ' - stock disponible (' + item.cantidad + ')',
      vencimiento: item.vencimiento,
      stage: stage
    });
  });
  return alertas;
}

function etapaVencimiento_(dateText) {
  if (!dateText) return null;
  const hoy = new Date(fechaHoy_() + 'T00:00:00');
  const fecha = new Date(dateText + 'T00:00:00');
  const days = Math.round((fecha.getTime() - hoy.getTime()) / 86400000);
  if (days < 0) return { id: 'vencido', label: 'Vencido' };
  if (days <= 1) return { id: '1-dia', label: '1 dia o menos' };
  if (days <= 14) return { id: '2-semanas', label: '2 semanas' };
  if (days <= 30) return { id: '1-mes', label: '1 mes' };
  if (days <= 183) return { id: '6-meses', label: '6 meses' };
  if (days <= 365) return { id: '1-anio', label: '1 ano' };
  return null;
}

function instalarTriggerDiario_() {
  eliminarTriggersDeAlertas_();
  ScriptApp.newTrigger('procesarAlertasVencimiento_')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .inTimezone(APP_CONFIG.timezone)
    .create();
}

function eliminarTriggersDeAlertas_() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (['procesarAlertasVencimiento_', 'procesarAlertasVencimiento'].indexOf(trigger.getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function asegurarTriggerCambiosPlanilla_(spreadsheet) {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty(APP_CONFIG.editTriggerKey)) return;
  try {
    instalarTriggerCambiosPlanilla_(spreadsheet);
  } catch (ignored) {
    // La deteccion por fecha de modificacion sigue funcionando como respaldo.
  }
}

function instalarTriggerCambiosPlanilla_(spreadsheet) {
  if (!spreadsheet) return;
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (['registrarCambioManual_', 'registrarCambioManual'].indexOf(trigger.getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  const trigger = ScriptApp.newTrigger('registrarCambioManual_')
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();
  const props = PropertiesService.getScriptProperties();
  props.setProperty(APP_CONFIG.editTriggerKey, trigger.getUniqueId());
  registrarMarcaPlanilla_(spreadsheet);
}

function registrarCambioManual_(e) {
  const spreadsheet = e && e.source ? e.source : obtenerSpreadsheet_();
  limpiarCacheEstado_();
  actualizarRevision_(spreadsheet);
}

function reinstalarSincronizacionPlanilla() {
  const spreadsheet = requerirSpreadsheet_();
  prepararHojas_(spreadsheet);
  instalarTriggerCambiosPlanilla_(spreadsheet);
  actualizarRevision_(spreadsheet);
  return {
    ok: true,
    mensaje: 'Sincronizacion con cambios manuales de la planilla instalada.',
    spreadsheetUrl: spreadsheet.getUrl()
  };
}

function nuevoMovimiento_(movimientos, tipo, item, cantidad, responsable, comentario) {
  validarNombreCompleto_(responsable);
  const maxId = (movimientos || []).reduce(function(max, mov) {
    return Math.max(max, Number(mov.id) || 0);
  }, 0);
  return {
    id: maxId + 1,
    tipo: tipo,
    item: item,
    cantidad: cantidad,
    fecha: fechaHoy_(),
    responsable: responsable.trim(),
    comentario: comentario
  };
}

function validarNombreCompleto_(nombre) {
  if (!nombre || nombre.trim().split(/\s+/).length < 2) {
    throw new Error('Debe ingresar nombre y apellido del responsable.');
  }
}

function validarEmail_(email) {
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    throw new Error('Ingrese un correo valido.');
  }
}

function normalizarEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizarUsuario_(usuario) {
  return {
    email: normalizarEmail_(usuario.email),
    nombre: String(usuario.nombre || '').trim(),
    apellido: String(usuario.apellido || '').trim(),
    rol: usuario.rol || ROLES.CONSULTA,
    activo: usuario.activo === true || String(usuario.activo).toLowerCase() === 'si' || String(usuario.activo).toLowerCase() === 'true',
    creado: usuario.creado || '',
    ultimoAcceso: usuario.ultimoAcceso || ''
  };
}

function usuarioPublico_(usuario) {
  const limpio = normalizarUsuario_(usuario);
  return {
    email: limpio.email,
    nombre: limpio.nombre,
    apellido: limpio.apellido,
    rol: limpio.rol,
    activo: limpio.activo,
    ultimoAcceso: limpio.ultimoAcceso,
    permisos: (PERMISOS_POR_ROL[limpio.rol] || []).slice()
  };
}

function obtenerUsuario_(spreadsheet, email) {
  const buscado = normalizarEmail_(email);
  const fila = leerObjetos_(spreadsheet, 'Usuarios').find(function(usuario) {
    return normalizarEmail_(usuario.email) === buscado;
  });
  return fila ? normalizarUsuario_(fila) : null;
}

function guardarUsuario_(spreadsheet, usuario) {
  const limpio = normalizarUsuario_(usuario);
  const usuarios = leerObjetos_(spreadsheet, 'Usuarios').map(normalizarUsuario_);
  const index = usuarios.findIndex(function(existente) { return existente.email === limpio.email; });
  if (index === -1) {
    limpio.creado = new Date().toISOString();
    usuarios.push(limpio);
  } else {
    limpio.creado = usuarios[index].creado || new Date().toISOString();
    limpio.ultimoAcceso = usuarios[index].ultimoAcceso || '';
    usuarios[index] = limpio;
  }
  reemplazarFilas_(spreadsheet, 'Usuarios', usuarios.map(function(registro) {
    return [
      registro.email,
      registro.nombre,
      registro.apellido,
      registro.rol,
      registro.activo ? 'Si' : 'No',
      registro.creado,
      registro.ultimoAcceso || ''
    ];
  }));
}

function actualizarUltimoAcceso_(spreadsheet, email) {
  const usuarios = leerObjetos_(spreadsheet, 'Usuarios').map(normalizarUsuario_);
  usuarios.forEach(function(usuario) {
    if (usuario.email === normalizarEmail_(email)) {
      usuario.ultimoAcceso = new Date().toISOString();
    }
  });
  reemplazarFilas_(spreadsheet, 'Usuarios', usuarios.map(function(usuario) {
    return [
      usuario.email,
      usuario.nombre,
      usuario.apellido,
      usuario.rol,
      usuario.activo ? 'Si' : 'No',
      usuario.creado,
      usuario.ultimoAcceso || ''
    ];
  }));
}

function exigirPermiso_(token, permiso) {
  const sesion = exigirSesion_(token);
  const permisos = PERMISOS_POR_ROL[sesion.usuario.rol] || [];
  if (permisos.indexOf(permiso) === -1) {
    throw new Error('Su usuario no tiene permiso para realizar esta accion.');
  }
  return sesion;
}

function exigirSesion_(token) {
  if (!token) {
    throw new Error('Debe iniciar sesion para continuar.');
  }
  const props = PropertiesService.getScriptProperties();
  const key = sessionKey_(token);
  const guardada = parseJson_(props.getProperty(key)) || {};
  const ahora = new Date().getTime();
  if (!guardada.email || !guardada.vence || guardada.vence < ahora) {
    props.deleteProperty(key);
    throw new Error('La sesion vencio. Ingrese nuevamente.');
  }
  const spreadsheet = requerirSpreadsheet_();
  const usuario = obtenerUsuario_(spreadsheet, guardada.email);
  if (!usuario || !usuario.activo) {
    props.deleteProperty(key);
    throw new Error('Su usuario no esta habilitado.');
  }
  if (guardada.recordar === true) {
    guardada.vence = calcularVencimientoSesion_(true);
    props.setProperty(key, JSON.stringify(guardada));
  }
  return { usuario: usuario };
}

function exigirSesionBasica_(token) {
  if (!token) {
    throw new Error('Debe iniciar sesion para continuar.');
  }
  const props = PropertiesService.getScriptProperties();
  const key = sessionKey_(token);
  const guardada = parseJson_(props.getProperty(key)) || {};
  const ahora = new Date().getTime();
  if (!guardada.email || !guardada.vence || guardada.vence < ahora) {
    props.deleteProperty(key);
    throw new Error('La sesion vencio. Ingrese nuevamente.');
  }
  if (guardada.recordar === true) {
    guardada.vence = calcularVencimientoSesion_(true);
    props.setProperty(key, JSON.stringify(guardada));
  }
  return guardada;
}

function calcularVencimientoSesion_(recordar) {
  const ahora = new Date().getTime();
  return recordar
    ? ahora + APP_CONFIG.sessionRememberDays * 24 * 60 * 60 * 1000
    : ahora + APP_CONFIG.sessionHours * 60 * 60 * 1000;
}

function generarCodigo_() {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + '|' + new Date().getTime());
  let numero = 0;
  digest.slice(0, 6).forEach(function(byte) {
    numero = (numero * 256 + (byte + 256) % 256) % 1000000;
  });
  return ('000000' + numero).slice(-6);
}

function hash_(texto) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(texto));
  return digest.map(function(byte) {
    const hex = ((byte + 256) % 256).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function otpKey_(email) {
  return 'INDUMENTARIA_OTP_' + hash_(normalizarEmail_(email));
}

function sessionKey_(token) {
  return 'INDUMENTARIA_SESSION_' + hash_(token);
}

function jsonText_(value) {
  return value ? JSON.stringify(value) : '';
}

function base64Url_(value) {
  const encoded = typeof value === 'string'
    ? Utilities.base64EncodeWebSafe(value)
    : Utilities.base64EncodeWebSafe(value);
  return encoded.replace(/=+$/, '');
}

function parseJson_(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function fechaHoy_() {
  return Utilities.formatDate(new Date(), APP_CONFIG.timezone, 'yyyy-MM-dd');
}
