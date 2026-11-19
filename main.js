const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain, Menu, MenuItem, session, dialog } = require('electron');
const db = require('./database.js');

const AuthController = require('./controllers/AuthController');
const FichaController = require('./controllers/FichaController');
const CatalogoController = require('./controllers/CatalogoController');

function generarRespaldoSQLite(rutaDestino) {
  return new Promise((resolve, reject) => {
    try {
      // VACUUM INTO requiere que el archivo destino no exista previamente
      if (fs.existsSync(rutaDestino)) {
        fs.unlinkSync(rutaDestino);
      }
      const rutaEscapada = rutaDestino.replace(/'/g, "''");
      db.run(`VACUUM INTO '${rutaEscapada}'`, (err) => {
        if (err) reject(err);
        else resolve(rutaDestino);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Respaldo automático diario al iniciar Electron (conserva los últimos 7)
async function ejecutarRespaldoAutomatico() {
  try {
    const carpetaBackups = path.join(__dirname, 'backups');
    if (!fs.existsSync(carpetaBackups)) {
      fs.mkdirSync(carpetaBackups, { recursive: true });
    }

    const hoy = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const archivoHoy = path.join(carpetaBackups, `auto_fichas_${hoy}.db`);

    await generarRespaldoSQLite(archivoHoy);

    // Eliminar respaldos automáticos antiguos (mantener máximo 7)
    const archivos = fs.readdirSync(carpetaBackups)
      .filter(f => f.startsWith('auto_fichas_') && f.endsWith('.db'))
      .sort()
      .reverse();

    archivos.slice(7).forEach(antiguo => {
      fs.unlinkSync(path.join(carpetaBackups, antiguo));
    });
  } catch (error) {
    console.error('Error en respaldo automático:', error);
  }
}

// Manejador para el botón "Respaldar Base de Datos" en el panel Admin
ipcMain.handle('respaldar-bd', async (event) => {
  try {
    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10);
    const hora = ahora.toTimeString().slice(0, 5).replace(':', '-');
    const nombreSugerido = `respaldo_fichas_${fecha}_${hora}.db`;

    const ventanaActual = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(ventanaActual, {
      title: 'Guardar respaldo de base de datos',
      defaultPath: path.join(app.getPath('documents'), nombreSugerido),
      filters: [{ name: 'Base de datos SQLite', extensions: ['db'] }]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    await generarRespaldoSQLite(filePath);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error al respaldar BD:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('exportar-csv', async (event, contenido, nombreSugerido) => {
  try {
    const ventanaActual = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(ventanaActual, {
      title: 'Exportar reporte de fichas a Excel (CSV)',
      defaultPath: path.join(app.getPath('documents'), nombreSugerido || 'reporte_fichas.csv'),
      filters: [{ name: 'Archivo CSV (Excel)', extensions: ['csv'] }]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    fs.writeFileSync(filePath, contenido, 'utf8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    return { success: false, message: error.message };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true
    }
  });

  // Menú contextual (clic derecho) con sugerencias ortográficas y edición
  win.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    // Sugerencias de corrección si se hizo clic sobre una palabra subrayada
    for (const suggestion of params.dictionarySuggestions) {
      menu.append(new MenuItem({
        label: suggestion,
        click: () => win.webContents.replaceMisspelling(suggestion)
      }));
    }

    // Permitir guardar nombres locales o términos propios en el diccionario
    if (params.misspelledWord) {
      if (params.dictionarySuggestions.length > 0) {
        menu.append(new MenuItem({ type: 'separator' }));
      }
      menu.append(new MenuItem({
        label: `Agregar "${params.misspelledWord}" al diccionario`,
        click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
      }));
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Opciones estándar de edición
    if (params.isEditable) {
      menu.append(new MenuItem({ label: 'Cortar', role: 'cut', enabled: params.editFlags.canCut }));
      menu.append(new MenuItem({ label: 'Copiar', role: 'copy', enabled: params.editFlags.canCopy }));
      menu.append(new MenuItem({ label: 'Pegar', role: 'paste', enabled: params.editFlags.canPaste }));
    } else if (params.selectionText) {
      menu.append(new MenuItem({ label: 'Copiar', role: 'copy' }));
    }

    if (menu.items.length > 0) {
      menu.popup();
    }
  });

  win.maximize();

  win.loadFile('login/index.html');
}

app.whenReady().then(() => {
  ejecutarRespaldoAutomatico();
  session.defaultSession.setSpellCheckerLanguages(['es-MX', 'es']);

  createWindow();

  // Autenticación y Usuarios
  ipcMain.handle('login-attempt', AuthController.login);
  ipcMain.handle('obtener-usuarios', AuthController.obtenerUsuarios);
  ipcMain.handle('editar-usuario', AuthController.editarUsuario);
  ipcMain.handle('cambiar-password', AuthController.cambiarPassword);
  ipcMain.handle('cambiar-estado-usuario', AuthController.cambiarEstadoUsuario);
  ipcMain.handle('registrar-usuario', AuthController.registrar);
  ipcMain.handle('cambiar-rol-usuario', AuthController.cambiarRolUsuario);

  // Fichas
  ipcMain.handle('guardar-ficha', FichaController.guardarFicha);
  ipcMain.handle('obtener-fichas', FichaController.listarFichas);

  // Catálogos Dinámicos
  ipcMain.handle('obtener-catalogos', CatalogoController.obtenerCatalogos);
  ipcMain.handle('agregar-unidad', CatalogoController.agregarUnidad);
  ipcMain.handle('eliminar-unidad', CatalogoController.eliminarUnidad);
  ipcMain.handle('agregar-auxilio', CatalogoController.agregarAuxilio);
  ipcMain.handle('eliminar-auxilio', CatalogoController.eliminarAuxilio);
  ipcMain.handle('agregar-medio', CatalogoController.agregarMedio);
  ipcMain.handle('eliminar-medio', CatalogoController.eliminarMedio);
  ipcMain.handle('agregar-colonia', CatalogoController.agregarColonia);
  ipcMain.handle('eliminar-colonia', CatalogoController.eliminarColonia);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('actualizar-ficha', async (event, ficha) => {
  return new Promise((resolve) => {
    const query = `
            UPDATE fichas 
            SET titulo = ?,
                tipo_auxilio = ?, 
                descripcion = ?, 
                unidad = ?, 
                estado = ?, 
                veracidad = ?, 
                fecha = ?, 
                hora = ?, 
                medio = ?, 
                direccion = ?, 
                colonia = ?,
                latitud = ?,
                longitud = ?
            WHERE id = ?
        `;

    const params = [
      ficha.tipoAuxilio,
      ficha.tipoAuxilio,
      ficha.descripcion,
      ficha.unidad,
      ficha.estado,
      ficha.veracidad,
      ficha.fecha,
      ficha.hora,
      ficha.medio,
      ficha.direccion,
      ficha.colonia,
      ficha.latitud || '',
      ficha.longitud || '',
      ficha.id
    ];

    db.run(query, params, function (err) {
      if (err) {
        console.error('Error al actualizar ficha en SQLite:', err);
        resolve({ success: false, message: err.message });
      } else {
        resolve({ success: true, message: 'Ficha actualizada correctamente' });
      }
    });
  });
});