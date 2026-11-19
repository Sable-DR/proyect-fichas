// Aplicar tema de inmediato para evitar parpadeo visual
if (localStorage.getItem('tema') === 'oscuro') {
    document.body.classList.add('dark-theme');
}

// Guardia de sesión
const userId = localStorage.getItem('userId');
if (!userId) {
    window.location.href = '../login/index.html';
}

const currentFullName = localStorage.getItem('userFullName');
const currentUserName = localStorage.getItem('userName');
const currentRol = (localStorage.getItem('userRol') || '').toLowerCase();
const capturista = currentFullName || currentUserName || 'Usuario Desconocido';

// Estado compartido entre los módulos del dashboard
window.DashboardState = {
    userId,
    currentRol,
    capturista,
    fichaEditandoActual: null,
    latSelected: 20.6896,
    lngSelected: -88.2015
};

function mostrarNotificacion(mensaje, tipo = 'info') {
    let toast = document.getElementById('toast-alerta-global');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-alerta-global';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            color: #ffffff;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
            z-index: 10000;
            transition: opacity 0.3s ease, transform 0.3s ease;
            opacity: 0;
            transform: translateY(10px);
            pointer-events: none;
        `;
        document.body.appendChild(toast);
    }

    const colores = {
        error: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        info: '#3b82f6'
    };

    toast.style.backgroundColor = colores[tipo] || colores.info;
    toast.innerText = mensaje;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(window.toastTimerGlobal);
    window.toastTimerGlobal = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
    }, 3500);
}

function setFechaHoraActuales() {
    const fFecha = document.getElementById('fecha');
    const fHora = document.getElementById('hora');
    if (fFecha && fHora) {
        const ahora = new Date();
        const año = ahora.getFullYear();
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const dia = String(ahora.getDate()).padStart(2, '0');
        fFecha.value = `${año}-${mes}-${dia}`;
        fHora.value = ahora.toTimeString().substring(0, 5);
    }
}

function actualizarOpcionesVeracidadPorIds(selectEstadoId, selectVeracidadId, seleccionarPorDefecto = true) {
    const selectEstado = document.getElementById(selectEstadoId);
    const selectVeracidad = document.getElementById(selectVeracidadId);
    if (!selectEstado || !selectVeracidad) return;

    const estado = selectEstado.value;
    selectVeracidad.innerHTML = '';

    if (estado === 'PENDIENTE') {
        const opt = document.createElement('option');
        opt.value = 'Pendiente';
        opt.textContent = 'Pendiente de verificar';
        opt.selected = true;
        selectVeracidad.appendChild(opt);
        selectVeracidad.disabled = true;
    } else if (estado === 'LISTO') {
        selectVeracidad.disabled = false;

        const optReal = document.createElement('option');
        optReal.value = 'Verdadera';
        optReal.textContent = 'Reporte Real';
        if (seleccionarPorDefecto) optReal.selected = true;

        const optFalso = document.createElement('option');
        optFalso.value = 'Falsa';
        optFalso.textContent = 'Reporte Falso';

        selectVeracidad.appendChild(optReal);
        selectVeracidad.appendChild(optFalso);
    } else if (estado === 'CANALIZADO') {
        const opt = document.createElement('option');
        opt.value = 'Canalizado';
        opt.textContent = 'Reporte Canalizado';
        opt.selected = true;
        selectVeracidad.appendChild(opt);
        selectVeracidad.disabled = true;
    }
}

function actualizarOpcionesVeracidad() {
    actualizarOpcionesVeracidadPorIds('estado', 'veracidad', true);
}

function actualizarOpcionesVeracidadEdit() {
    actualizarOpcionesVeracidadPorIds('edit-estado', 'edit-veracidad', false);
}

function inicializarHeaderYMenu() {
    const headerUser = document.getElementById('header-username');
    if (headerUser) headerUser.textContent = 'Hola, ' + capturista;

    // Control de acceso al Panel de Administrador
    const btnPanelAdmin = document.getElementById('btn-admin') || document.querySelector('#dropdown-menu a[href*="admin.html"]');
    if (btnPanelAdmin) {
        if (currentRol === 'admin') {
            btnPanelAdmin.style.display = 'block';
        } else {
            btnPanelAdmin.remove();
        }
    }

    // Modo Oscuro / Claro
    const btnThemeDashboard = document.getElementById('btn-theme-dashboard');
    const iconoTemaDashboard = document.getElementById('icono-tema-dashboard');
    const textoTemaDashboard = document.getElementById('texto-tema-dashboard');

    function aplicarTemaDashboard(esOscuro) {
        if (esOscuro) {
            document.body.classList.add('dark-theme');
            if (iconoTemaDashboard) iconoTemaDashboard.className = 'fa-solid fa-sun';
            if (textoTemaDashboard) textoTemaDashboard.textContent = 'Modo Claro';
        } else {
            document.body.classList.remove('dark-theme');
            if (iconoTemaDashboard) iconoTemaDashboard.className = 'fa-solid fa-moon';
            if (textoTemaDashboard) textoTemaDashboard.textContent = 'Modo Oscuro';
        }
    }

    aplicarTemaDashboard(localStorage.getItem('tema') === 'oscuro');

    if (btnThemeDashboard) {
        btnThemeDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            const activarOscuro = !document.body.classList.contains('dark-theme');
            localStorage.setItem('tema', activarOscuro ? 'oscuro' : 'claro');
            aplicarTemaDashboard(activarOscuro);
        });
    }

    // Cierre de sesión
    const btnCerrarSesion = document.getElementById('btn-logout')
        || document.getElementById('btn-cerrar-sesion')
        || document.querySelector('#dropdown-menu a.text-danger');

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('userId');
            localStorage.removeItem('userFullName');
            localStorage.removeItem('userName');
            localStorage.removeItem('userRol');
            window.location.href = '../login/index.html';
        });
    }

    // Menú desplegable de usuario
    const userMenuBtn = document.getElementById('user-menu-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (userMenuBtn && dropdownMenu) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        window.addEventListener('click', () => {
            dropdownMenu.classList.remove('show');
        });
    }
}

window.DashboardUtils = {
    mostrarNotificacion,
    setFechaHoraActuales,
    actualizarOpcionesVeracidad,
    actualizarOpcionesVeracidadEdit,
    inicializarHeaderYMenu
};