const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('./database.js');

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