const { app, BrowserWindow, ipcMain, Menu, MenuItem, session } = require('electron');
const path = require('path');
const db = require('./database.js');

const AuthController = require('./controllers/AuthController');
const FichaController = require('./controllers/FichaController');
const CatalogoController = require('./controllers/CatalogoController');

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

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  // Configurar corrector ortográfico en español
  session.defaultSession.setSpellCheckerLanguages(['es-MX', 'es']);

  createWindow();

  // Autenticación y Usuarios
  ipcMain.handle('login-attempt', AuthController.login);
  ipcMain.handle('obtener-usuarios', AuthController.obtenerUsuarios);
  ipcMain.handle('editar-usuario', AuthController.editarUsuario);
  ipcMain.handle('cambiar-password', AuthController.cambiarPassword);
  ipcMain.handle('cambiar-estado-usuario', AuthController.cambiarEstadoUsuario);
  ipcMain.handle('registrar-usuario', AuthController.registrar);

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