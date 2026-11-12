const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    login: (username, password) => ipcRenderer.invoke('login-attempt', username, password),
    registrar: (username, nombreCompleto, password) => ipcRenderer.invoke('registrar-usuario', username, nombreCompleto, password),
    guardarFicha: (userId, titulo, desc, tipo, unidad, estado, fecha, hora, medio, dir, col, veracidad, capturista, lat, lng) => ipcRenderer.invoke('guardar-ficha', userId, titulo, desc, tipo, unidad, estado, fecha, hora, medio, dir, col, veracidad, capturista, lat, lng),
    obtenerFichas: (userId) => ipcRenderer.invoke('obtener-fichas', userId),
    obtenerUsuarios: () => ipcRenderer.invoke('obtener-usuarios'),
    editarUsuario: (id, nuevoNombre) => ipcRenderer.invoke('editar-usuario', id, nuevoNombre),
    cambiarPassword: (id, nuevaPassword) => ipcRenderer.invoke('cambiar-password', id, nuevaPassword),
    cambiarEstadoUsuario: (id, estado) => ipcRenderer.invoke('cambiar-estado-usuario', id, estado),

    // --- CATÁLOGOS DINÁMICOS ---
    obtenerCatalogos: () => ipcRenderer.invoke('obtener-catalogos'),
    agregarUnidad: (nombre) => ipcRenderer.invoke('agregar-unidad', nombre),
    eliminarUnidad: (id) => ipcRenderer.invoke('eliminar-unidad', id),
    agregarAuxilio: (nombre) => ipcRenderer.invoke('agregar-auxilio', nombre),
    eliminarAuxilio: (id) => ipcRenderer.invoke('eliminar-auxilio', id),
    agregarMedio: (nombre) => ipcRenderer.invoke('agregar-medio', nombre),
    eliminarMedio: (id) => ipcRenderer.invoke('eliminar-medio', id),
    agregarColonia: (nombre) => ipcRenderer.invoke('agregar-colonia', nombre),
    eliminarColonia: (id) => ipcRenderer.invoke('eliminar-colonia', id),
    actualizarFicha: (datosFicha) => ipcRenderer.invoke('actualizar-ficha', datosFicha),
});