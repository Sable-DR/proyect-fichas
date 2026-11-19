// Guardia de acceso para administradores y superadministradores
const rolSesion = localStorage.getItem('userRol');
if (!localStorage.getItem('userId') || (rolSesion !== 'admin' && rolSesion !== 'superadmin')) {
    window.location.href = '../dashboard/dashboard.html';
}

// Control de Modo Oscuro / Claro
const btnThemeAdmin = document.getElementById('btn-theme-admin');

function aplicarTemaAdmin(esOscuro) {
    if (esOscuro) {
        document.body.classList.add('dark-theme');
        if (btnThemeAdmin) btnThemeAdmin.textContent = 'Modo Claro';
    } else {
        document.body.classList.remove('dark-theme');
        if (btnThemeAdmin) btnThemeAdmin.textContent = 'Modo Oscuro';
    }
}

aplicarTemaAdmin(localStorage.getItem('tema') === 'oscuro');

if (btnThemeAdmin) {
    btnThemeAdmin.addEventListener('click', (e) => {
        e.preventDefault();
        const activarOscuro = !document.body.classList.contains('dark-theme');
        localStorage.setItem('tema', activarOscuro ? 'oscuro' : 'claro');
        aplicarTemaAdmin(activarOscuro);
    });
}

// Utilidades compartidas entre módulos
window.AdminUtils = {
    escaparHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto ?? '';
        return div.innerHTML;
    },

    mostrarToast(mensaje, tipo = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.textContent = mensaje;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 250);
        }, 3200);
    },

    confirmarAccion({ titulo = 'Confirmar acción', mensaje = '', btnTexto = 'Confirmar', btnColor = '#ef4444' }) {
        return new Promise((resolve) => {
            const modalConfirm = document.getElementById('modal-confirm');
            const elTitulo = document.getElementById('confirm-titulo');
            const elMensaje = document.getElementById('confirm-mensaje');
            const btnCancelar = document.getElementById('confirm-btn-cancelar');
            const btnAceptar = document.getElementById('confirm-btn-aceptar');

            if (!modalConfirm) {
                resolve(false);
                return;
            }

            elTitulo.textContent = titulo;
            elMensaje.textContent = mensaje;
            btnAceptar.textContent = btnTexto;
            btnAceptar.style.backgroundColor = btnColor;

            modalConfirm.classList.add('show');
            btnAceptar.focus();

            const limpiarYCerrar = (resultado) => {
                modalConfirm.classList.remove('show');
                btnCancelar.removeEventListener('click', onCancelar);
                btnAceptar.removeEventListener('click', onAceptar);
                modalConfirm.removeEventListener('click', onFondo);
                document.removeEventListener('keydown', onTecla);
                resolve(resultado);
            };

            const onCancelar = () => limpiarYCerrar(false);
            const onAceptar = () => limpiarYCerrar(true);
            const onFondo = (e) => { if (e.target === modalConfirm) limpiarYCerrar(false); };
            const onTecla = (e) => { if (e.key === 'Escape') limpiarYCerrar(false); };

            btnCancelar.addEventListener('click', onCancelar);
            btnAceptar.addEventListener('click', onAceptar);
            modalConfirm.addEventListener('click', onFondo);
            document.addEventListener('keydown', onTecla);
        });
    }
};