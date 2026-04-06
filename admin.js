if (localStorage.getItem('tema') === 'oscuro') {
    document.body.classList.add('dark-theme');
}

const currentFullName = localStorage.getItem('userFullName') || localStorage.getItem('userName') || 'Usuario';
document.getElementById('header-username').textContent = 'Hola, ' + currentFullName;

const tabla = document.getElementById('tabla-usuarios');

async function cargarUsuarios() {
    const response = await window.api.obtenerUsuarios();

    if (response.success) {
        tabla.innerHTML = '';

        response.data.forEach(user => {
            const tr = document.createElement('tr');
            const estadoTexto = user.activo ? '🟢 Activo' : '🔴 Inactivo';
            const rolBadge = user.rol === 'admin' ? '<span class="badge-admin">Admin</span>' : '<span class="badge-user">User</span>';
            const toggleAction = user.activo ? 0 : 1;
            const toggleColorClass = user.activo ? 'btn-disable' : 'btn-toggle';
            const toggleBtnText = user.activo ? 'Desactivar' : 'Activar';
            const isSuperAdmin = user.id === 1;

            tr.innerHTML = `
                <td>${user.id}</td>
                <td><strong>${user.username}</strong></td>
                <td>${user.nombre_completo || 'N/A'}</td>
                <td>${rolBadge}</td>
                <td>${estadoTexto}</td>
                <td>
                    <button class="btn-action btn-edit" onclick="editar(${user.id}, '${user.username}')">Nombre Corto</button>
                    <button class="btn-action btn-pass" onclick="cambiarPass(${user.id})">Contraseña</button>
                    ${!isSuperAdmin ? `<button class="btn-action ${toggleColorClass}" onclick="toggleEstado(${user.id}, ${toggleAction})">${toggleBtnText}</button>` : ''}
                </td>
            `;
            tabla.appendChild(tr);
        });
    } else {
        alert('Error al cargar usuarios: ' + response.message);
    }
}

const modal = document.getElementById('mi-modal');
const modalTitulo = document.getElementById('modal-titulo');
const modalInput = document.getElementById('modal-input');
const modalId = document.getElementById('modal-id');
const modalAccion = document.getElementById('modal-accion');

function cerrarModal() {
    modal.classList.remove('show');
    modalInput.value = '';
}
document.getElementById('modal-btn-cancelar').addEventListener('click', cerrarModal);

window.editar = function (id, nombreActual) {
    modalTitulo.textContent = "Nuevo nombre de usuario (corto):";
    modalInput.type = "text";
    modalInput.value = nombreActual;
    modalId.value = id;
    modalAccion.value = "nombre";
    modal.classList.add('show');
    modalInput.focus();
}

window.cambiarPass = function (id) {
    modalTitulo.textContent = "Nueva contraseña:";
    modalInput.type = "password";
    modalInput.value = "";
    modalId.value = id;
    modalAccion.value = "pass";
    modal.classList.add('show');
    modalInput.focus();
}

document.getElementById('modal-btn-guardar').addEventListener('click', async () => {
    const id = modalId.value;
    const accion = modalAccion.value;
    const nuevoValor = modalInput.value.trim();

    if (!nuevoValor) {
        alert("El campo no puede estar vacío");
        return;
    }

    if (accion === 'nombre') {
        const res = await window.api.editarUsuario(id, nuevoValor);
        if (res.success) {
            cargarUsuarios();
            cerrarModal();
        } else {
            alert('Error: ' + res.message);
        }
    } else if (accion === 'pass') {
        const res = await window.api.cambiarPassword(id, nuevoValor);
        if (res.success) {
            alert('Contraseña actualizada con éxito.');
            cerrarModal();
        } else {
            alert('Error: ' + res.message);
        }
    }
});

window.toggleEstado = async function (id, nuevoEstado) {
    const accion = nuevoEstado === 1 ? 'ACTIVAR' : 'DESACTIVAR';
    if (confirm(`¿Estás seguro de que deseas ${accion} a este usuario?`)) {
        const res = await window.api.cambiarEstadoUsuario(id, nuevoEstado);
        if (res.success) {
            cargarUsuarios();
        } else {
            alert('Error: ' + res.message);
        }
    }
}

const menuBtn = document.getElementById('user-menu-btn');
const dropdownMenu = document.getElementById('dropdown-menu');

menuBtn.addEventListener('click', (event) => {
    dropdownMenu.classList.toggle('show');
    event.stopPropagation();
});

window.addEventListener('click', (event) => {
    if (!event.target.closest('.user-menu-container')) {
        if (dropdownMenu.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
        }
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

cargarUsuarios();