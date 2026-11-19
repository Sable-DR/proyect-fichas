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

// Control de permisos por rol
const esSuperAdminSesion = localStorage.getItem('userRol') === 'superadmin';

// Navegación entre pestañas del panel lateral
const tabUsuarios = document.getElementById('tab-usuarios');
const tabConfig = document.getElementById('tab-configuracion');
const btnRespaldar = document.getElementById('btn-respaldar-db');
const cardUsuarios = document.getElementById('card-usuarios');
const cardConfig = document.getElementById('card-configuracion');

if (!esSuperAdminSesion) {
    if (tabConfig) tabConfig.remove();
    if (cardConfig) cardConfig.remove();
    if (btnRespaldar) btnRespaldar.remove();
}

tabUsuarios.addEventListener('click', (e) => {
    e.preventDefault();
    tabUsuarios.classList.add('active');
    if (tabConfig) tabConfig.classList.remove('active');
    cardUsuarios.style.display = 'block';
    if (cardConfig) cardConfig.style.display = 'none';
});

if (tabConfig && esSuperAdminSesion) {
    tabConfig.addEventListener('click', (e) => {
        e.preventDefault();
        tabConfig.classList.add('active');
        tabUsuarios.classList.remove('active');
        cardUsuarios.style.display = 'none';
        cardConfig.style.display = 'block';
        window.AdminCatalogos.cargarCatalogosAdmin();
    });
}

// Carga inicial
window.AdminUsuarios.cargarUsuarios();

// Respaldo manual de base de datos
if (btnRespaldar && esSuperAdminSesion) {
    btnRespaldar.addEventListener('click', async (e) => {
        e.preventDefault();
        const res = await window.api.respaldarBD();

        if (res.canceled) return;

        if (res.success) {
            window.AdminUtils.mostrarToast('Respaldo de base de datos guardado con éxito.');
        } else {
            window.AdminUtils.mostrarToast('Error al respaldar: ' + res.message, 'error');
        }
    });
}