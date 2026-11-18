// Encabezado y menú desplegable
const currentFullName = localStorage.getItem('userFullName') || localStorage.getItem('userName') || 'Usuario';
document.getElementById('header-username').textContent = 'Hola, ' + currentFullName;

const menuBtn = document.getElementById('user-menu-btn');
const dropdownMenu = document.getElementById('dropdown-menu');

menuBtn.addEventListener('click', (event) => {
    dropdownMenu.classList.toggle('show');
    event.stopPropagation();
});

window.addEventListener('click', (event) => {
    if (!event.target.closest('.user-menu-container') && dropdownMenu.classList.contains('show')) {
        dropdownMenu.classList.remove('show');
    }
});

document.getElementById('btn-logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('userId');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRol');
    window.location.href = '../login/index.html';
});

// Navegación entre pestañas del panel lateral
const tabUsuarios = document.getElementById('tab-usuarios');
const tabConfig = document.getElementById('tab-configuracion');
const cardUsuarios = document.getElementById('card-usuarios');
const cardConfig = document.getElementById('card-configuracion');

tabUsuarios.addEventListener('click', (e) => {
    e.preventDefault();
    tabUsuarios.classList.add('active');
    tabConfig.classList.remove('active');
    cardUsuarios.style.display = 'block';
    cardConfig.style.display = 'none';
});

tabConfig.addEventListener('click', (e) => {
    e.preventDefault();
    tabConfig.classList.add('active');
    tabUsuarios.classList.remove('active');
    cardUsuarios.style.display = 'none';
    cardConfig.style.display = 'block';
    window.AdminCatalogos.cargarCatalogosAdmin();
});

// Carga inicial
window.AdminUsuarios.cargarUsuarios();

// Respaldo manual de base de datos
document.getElementById('btn-respaldar-db')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const res = await window.api.respaldarBD();

    if (res.canceled) return;

    if (res.success) {
        window.AdminUtils.mostrarToast('Respaldo de base de datos guardado con éxito.');
    } else {
        window.AdminUtils.mostrarToast('Error al respaldar: ' + res.message, 'error');
    }
});