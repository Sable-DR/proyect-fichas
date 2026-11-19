(() => {
    const { escaparHTML, mostrarToast, confirmarAccion } = window.AdminUtils;

    const tabla = document.getElementById('tabla-usuarios');
    const modal = document.getElementById('mi-modal');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalInput = document.getElementById('modal-input');
    const modalId = document.getElementById('modal-id');
    const modalAccion = document.getElementById('modal-accion');

    function cerrarModal() {
        modal.classList.remove('show');
        modalInput.value = '';
    }

    function abrirModalUsuario(id, accion, titulo, valorInicial = '', tipoInput = 'text') {
        modalTitulo.textContent = titulo;
        modalInput.type = tipoInput;
        modalInput.value = valorInicial;
        modalId.value = id;
        modalAccion.value = accion;
        modal.classList.add('show');
        setTimeout(() => modalInput.focus(), 50);
    }

    async function cargarUsuarios() {
        const response = await window.api.obtenerUsuarios();
        const rolActual = localStorage.getItem('userRol');
        const idActual = String(localStorage.getItem('userId'));
        const soySuperAdmin = rolActual === 'superadmin';

        if (response.success) {
            tabla.innerHTML = '';

            response.data.forEach(user => {
                const tr = document.createElement('tr');
                const estadoTexto = user.activo ? '🟢 Activo' : '🔴 Inactivo';

                const targetEsSuperAdmin = user.rol === 'superadmin';
                const targetEsAdmin = user.rol === 'admin';
                const esMiPropioUsuario = String(user.id) === idActual;

                let rolBadge = '<span class="badge-user">User</span>';
                if (targetEsSuperAdmin) {
                    rolBadge = '<span class="badge-admin" style="background-color: #7c3aed;">SuperAdmin</span>';
                } else if (targetEsAdmin) {
                    rolBadge = '<span class="badge-admin">Admin</span>';
                }

                const nuevoRol = targetEsAdmin ? 'user' : 'admin';
                const textoBtnRol = targetEsAdmin ? 'Quitar Admin' : 'Hacer Admin';

                const toggleAction = user.activo ? 0 : 1;
                const toggleColorClass = user.activo ? 'btn-disable' : 'btn-toggle';
                const toggleBtnText = user.activo ? 'Desactivar' : 'Activar';

                const usernameSeguro = escaparHTML(user.username);
                const nombreSeguro = escaparHTML(user.nombre_completo || 'N/A');

                let botonesAccion = '';

                if (soySuperAdmin) {
                    botonesAccion += `
                        <button type="button" class="btn-action btn-edit" data-accion="editar-nombre" data-id="${user.id}" data-username="${usernameSeguro}">Nombre Corto</button>
                        <button type="button" class="btn-action btn-pass" data-accion="cambiar-pass" data-id="${user.id}" data-username="${usernameSeguro}">Contraseña</button>
                    `;
                    if (!targetEsSuperAdmin && !esMiPropioUsuario) {
                        botonesAccion += `
                            <button type="button" class="btn-action btn-role" data-accion="cambiar-rol" data-id="${user.id}" data-rol="${nuevoRol}" data-username="${usernameSeguro}">${textoBtnRol}</button>
                            <button type="button" class="btn-action ${toggleColorClass}" data-accion="toggle-estado" data-id="${user.id}" data-estado="${toggleAction}" data-username="${usernameSeguro}">${toggleBtnText}</button>
                        `;
                    }
                } else {
                    // Vista para Admin estándar: solo gestiona operadores ('user')
                    if (!targetEsSuperAdmin && !targetEsAdmin) {
                        botonesAccion += `
                            <button type="button" class="btn-action btn-edit" data-accion="editar-nombre" data-id="${user.id}" data-username="${usernameSeguro}">Nombre Corto</button>
                            <button type="button" class="btn-action btn-pass" data-accion="cambiar-pass" data-id="${user.id}" data-username="${usernameSeguro}">Contraseña</button>
                            <button type="button" class="btn-action ${toggleColorClass}" data-accion="toggle-estado" data-id="${user.id}" data-estado="${toggleAction}" data-username="${usernameSeguro}">${toggleBtnText}</button>
                        `;
                    } else {
                        botonesAccion = `<span style="color: #9ca3af; font-size: 0.82rem; font-style: italic;">Protegido</span>`;
                    }
                }

                tr.innerHTML = `
                    <td>${user.id}</td>
                    <td><strong>${usernameSeguro}</strong></td>
                    <td>${nombreSeguro}</td>
                    <td>${rolBadge}</td>
                    <td>${estadoTexto}</td>
                    <td>${botonesAccion}</td>
                `;
                tabla.appendChild(tr);
            });
        } else {
            mostrarToast('Error al cargar usuarios: ' + response.message, 'error');
        }
    }

    document.getElementById('modal-btn-cancelar').addEventListener('click', cerrarModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModal(); });

    modalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('modal-btn-guardar').click();
        if (e.key === 'Escape') cerrarModal();
    });

    document.getElementById('modal-btn-guardar').addEventListener('click', async () => {
        const id = modalId.value;
        const accion = modalAccion.value;
        const nuevoValor = modalInput.value.trim();

        if (!nuevoValor) {
            mostrarToast('El campo no puede estar vacío.', 'warning');
            modalInput.focus();
            return;
        }

        if (accion === 'nombre') {
            const res = await window.api.editarUsuario(id, nuevoValor);
            if (res.success) {
                mostrarToast('Nombre de usuario actualizado.');
                cargarUsuarios();
                cerrarModal();
            } else {
                mostrarToast('Error: ' + res.message, 'error');
            }
        } else if (accion === 'pass') {
            const res = await window.api.cambiarPassword(id, nuevoValor);
            if (res.success) {
                mostrarToast('Contraseña actualizada con éxito.');
                cerrarModal();
            } else {
                mostrarToast('Error: ' + res.message, 'error');
            }
        }
    });

    tabla.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-accion]');
        if (!btn) return;

        const { accion, id, username, rol, estado } = btn.dataset;

        if (accion === 'editar-nombre') {
            abrirModalUsuario(id, 'nombre', 'Nuevo nombre de usuario (corto):', username, 'text');
        } else if (accion === 'cambiar-pass') {
            abrirModalUsuario(id, 'pass', `Nueva contraseña para ${username}:`, '', 'password');
        } else if (accion === 'cambiar-rol') {
            const esPromocion = rol === 'admin';
            const confirmado = await confirmarAccion({
                titulo: esPromocion ? 'Otorgar permisos de Admin' : 'Quitar permisos de Admin',
                mensaje: esPromocion
                    ? `¿Deseas otorgar permisos de ADMINISTRADOR a "${username}"?`
                    : `¿Deseas cambiar a "${username}" a usuario estándar (USER)?`,
                btnTexto: esPromocion ? 'Hacer Admin' : 'Quitar Admin',
                btnColor: '#8b5cf6'
            });

            if (confirmado) {
                const res = await window.api.cambiarRolUsuario(id, rol);
                if (res.success) {
                    if (String(id) === String(localStorage.getItem('userId')) && rol !== 'admin') {
                        localStorage.setItem('userRol', 'user');
                        window.location.href = '../dashboard/dashboard.html';
                        return;
                    }
                    mostrarToast(`Rol de ${username} actualizado.`);
                    cargarUsuarios();
                } else {
                    mostrarToast('Error: ' + res.message, 'error');
                }
            }
        } else if (accion === 'toggle-estado') {
            const nuevoEstado = Number(estado);
            const activar = nuevoEstado === 1;
            const confirmado = await confirmarAccion({
                titulo: activar ? 'Activar usuario' : 'Desactivar usuario',
                mensaje: `¿Estás seguro de que deseas ${activar ? 'ACTIVAR' : 'DESACTIVAR'} a "${username}"?`,
                btnTexto: activar ? 'Activar' : 'Desactivar',
                btnColor: activar ? '#10b981' : '#ef4444'
            });

            if (confirmado) {
                const res = await window.api.cambiarEstadoUsuario(id, nuevoEstado);
                if (res.success) {
                    mostrarToast(`Usuario ${activar ? 'activado' : 'desactivado'}.`);
                    cargarUsuarios();
                } else {
                    mostrarToast('Error: ' + res.message, 'error');
                }
            }
        }
    });

    window.AdminUsuarios = { cargarUsuarios };
})();