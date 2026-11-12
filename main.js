const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database.js');

const AuthController = require('./controllers/AuthController');
const FichaController = require('./controllers/FichaController');
const CatalogoController = require('./controllers/CatalogoController'); // <-- Nuevo controlador

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.maximize();

  win.loadFile('index.html');
}

app.whenReady().then(() => {
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
                colonia = ?
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