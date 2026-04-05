const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path'); require('./database.js');
const AuthController = require('./controllers/AuthController');
const FichaController = require('./controllers/FichaController');

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
  ipcMain.handle('login-attempt', AuthController.login);
  ipcMain.handle('guardar-ficha', FichaController.guardarFicha);
  ipcMain.handle('obtener-fichas', FichaController.listarFichas);
  ipcMain.handle('obtener-usuarios', AuthController.obtenerUsuarios);
  ipcMain.handle('editar-usuario', AuthController.editarUsuario);
  ipcMain.handle('cambiar-password', AuthController.cambiarPassword);
  ipcMain.handle('cambiar-estado-usuario', AuthController.cambiarEstadoUsuario);
  ipcMain.handle('registrar-usuario', AuthController.registrar);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});