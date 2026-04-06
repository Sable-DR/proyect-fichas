const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    login: (username, password) => ipcRenderer.invoke('login-attempt', username, password),
    registrar: (username, nombreCompleto, password) => ipcRenderer.invoke('registrar-usuario', username, nombreCompleto, password),
    guardarFicha: (userId, titulo, descripcion, tipoAuxilio, unidad, estado, fecha, hora, medio, direccion, colonia, veracidad, capturista) => ipcRenderer.invoke('guardar-ficha', userId, titulo, descripcion, tipoAuxilio, unidad, estado, fecha, hora, medio, direccion, colonia, veracidad, capturista),
    obtenerFichas: (userId) => ipcRenderer.invoke('obtener-fichas', userId),
    obtenerUsuarios: () => ipcRenderer.invoke('obtener-usuarios'),
    editarUsuario: (id, nuevoNombre) => ipcRenderer.invoke('editar-usuario', id, nuevoNombre),
    cambiarPassword: (id, nuevaPassword) => ipcRenderer.invoke('cambiar-password', id, nuevaPassword),
    cambiarEstadoUsuario: (id, estado) => ipcRenderer.invoke('cambiar-estado-usuario', id, estado)
});