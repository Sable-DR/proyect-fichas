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
const tabReportes = document.getElementById('tab-reportes');
const btnRespaldar = document.getElementById('btn-respaldar-db');

const cardUsuarios = document.getElementById('card-usuarios');
const cardConfig = document.getElementById('card-configuracion');
const cardReportes = document.getElementById('card-reportes');

if (!esSuperAdminSesion) {
    if (tabConfig) tabConfig.remove();
    if (cardConfig) cardConfig.remove();
    if (btnRespaldar) btnRespaldar.remove();
}

function activarPestana(tabSeleccionada, cardSeleccionada) {
    [tabUsuarios, tabConfig, tabReportes].forEach(t => {
        if (t) t.classList.remove('active');
    });
    [cardUsuarios, cardConfig, cardReportes].forEach(c => {
        if (c) c.style.display = 'none';
    });

    if (tabSeleccionada) tabSeleccionada.classList.add('active');
    if (cardSeleccionada) cardSeleccionada.style.display = 'block';
}

tabUsuarios.addEventListener('click', (e) => {
    e.preventDefault();
    activarPestana(tabUsuarios, cardUsuarios);
    window.AdminUsuarios.cargarUsuarios();
});

if (tabConfig && esSuperAdminSesion) {
    tabConfig.addEventListener('click', (e) => {
        e.preventDefault();
        activarPestana(tabConfig, cardConfig);
        window.AdminCatalogos.cargarCatalogosAdmin();
    });
}

if (tabReportes) {
    tabReportes.addEventListener('click', (e) => {
        e.preventDefault();
        activarPestana(tabReportes, cardReportes);
        window.AdminEstadisticas.cargarEstadisticas();
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