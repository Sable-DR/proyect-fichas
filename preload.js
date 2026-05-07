const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    login: (username, password) => ipcRenderer.invoke('login-attempt', username, password),
    registrar: (username, nombreCompleto, password) => ipcRenderer.invoke('registrar-usuario', username, nombreCompleto, password),
    guardarFicha: (userId, titulo, desc, tipo, unidad, estado, fecha, hora, medio, dir, col, veracidad, capturista, lat, lng) => ipcRenderer.invoke('guardar-ficha', userId, titulo, desc, tipo, unidad, estado, fecha, hora, medio, dir, col, veracidad, capturista, lat, lng),
    obtenerFichas: (userId) => ipcRenderer.invoke('obtener-fichas', userId),
    obtenerUsuarios: () => ipcRenderer.invoke('obtener-usuarios'),
    editarUsuario: (id, nuevoNombre) => ipcRenderer.invoke('editar-usuario', id, nuevoNombre),
    cambiarPassword: (id, nuevaPassword) => ipcRenderer.invoke('cambiar-password', id, nuevaPassword),
    cambiarEstadoUsuario: (id, estado) => ipcRenderer.invoke('cambiar-estado-usuario', id, estado)
});