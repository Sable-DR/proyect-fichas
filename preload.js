const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    login: (username, password) => ipcRenderer.invoke('login-attempt', username, password),
    guardarFicha: (userId, titulo, descripcion) => ipcRenderer.invoke('guardar-ficha', userId, titulo, descripcion),
    obtenerFichas: (userId) => ipcRenderer.invoke('obtener-fichas', userId)
});