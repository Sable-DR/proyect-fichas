if (localStorage.getItem('tema') === 'oscuro') document.body.classList.add('dark-theme');

const userId = localStorage.getItem('userId');
if (!userId) window.location.href = 'index.html';

const currentFullName = localStorage.getItem('userFullName');
const currentUserName = localStorage.getItem('userName');
const currentRol = localStorage.getItem('userRol');
const capturista = currentFullName ? currentFullName : (currentUserName ? currentUserName : 'Usuario Desconocido');

document.addEventListener('DOMContentLoaded', () => {

    const headerUser = document.getElementById('header-username');
    if (headerUser) headerUser.textContent = 'Hola, ' + capturista;

    if (currentRol === 'admin') {
        const btnAdmin = document.getElementById('btn-admin');
        if (btnAdmin) btnAdmin.style.display = 'block';
    }
    const menuBtn = document.getElementById('user-menu-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (menuBtn && dropdownMenu) {
        menuBtn.addEventListener('click', (event) => {
            dropdownMenu.classList.toggle('show');
            event.stopPropagation();
        });

        window.addEventListener('click', (event) => {
            if (!event.target.closest('.user-menu-container')) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
    setFechaHoraActuales();
    cargarFichas();
});


const inputFecha = document.getElementById('fecha');
const inputHora = document.getElementById('hora');
const formFicha = document.getElementById('form-ficha');
const contenedorFichas = document.getElementById('contenedor-fichas');

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

async function cargarFichas() {
    const respuesta = await window.api.obtenerFichas(userId);
    contenedorFichas.innerHTML = '';

    if (respuesta.success && respuesta.data.length > 0) {
        respuesta.data.forEach(ficha => {
            const tarjeta = crearTarjetaFicha(ficha);
            contenedorFichas.appendChild(tarjeta);
        });
    } else {
        contenedorFichas.innerHTML = '<p style="grid-column: 1 / -1; color: #6b7280; text-align: center;">Aún no hay fichas en tu turno.</p>';
    }
}


function crearTarjetaFicha(ficha) {
    const tarjeta = document.createElement('div');
    const estadoClase = ficha.estado ? ficha.estado.toLowerCase() : 'pendiente';
    tarjeta.className = `ficha-card estado-${estadoClase}`;
    const veracidadText = ficha.veracidad === 'Falsa' ? 'REPORTE FALSO' : 'VERÍDICO';
    const veracidadColor = ficha.veracidad === 'Falsa' ? '#ef4444' : '#10b981';
    const capMostrar = ficha.capturista || 'Usuario Desconocido';
    const fechaMostrar = ficha.fecha || (ficha.fecha_creacion ? new Date(ficha.fecha_creacion).toLocaleDateString() : 'Sin fecha');
    const horaMostrar = ficha.hora || 'Sin hora';
    const medioMostrar = ficha.medio || 'No especificado';
    const direccionMostrar = ficha.direccion || 'Sin dirección';
    const coloniaMostrar = ficha.colonia || 'Sin colonia';
    const unidadMostrar = ficha.unidad || 'Sin unidad';
    const tipoMostrar = ficha.tipoAuxilio || ficha.tipo || 'Sin tipo';
    const estadoMostrar = ficha.estado || 'PENDIENTE';

    tarjeta.innerHTML = `
        <div class="ficha-header">
            <h4>${ficha.titulo}</h4>
            <span class="badge ${estadoMostrar === 'PENDIENTE' ? 'bg-warning' : 'bg-success'}">${estadoMostrar}</span>
        </div>
        <div class="ficha-body">
            <p style="color: ${veracidadColor}; font-weight: bold; font-size: 0.8rem; margin-top: 5px;">
                ${veracidadText}
            </p>
            <p><strong>Fecha/Hora:</strong> ${fechaMostrar} a las ${horaMostrar}</p>
            <p><strong>Ubicación:</strong> ${direccionMostrar}, ${coloniaMostrar}</p>
            <p><strong>Reporte por:</strong> ${medioMostrar}</p>
            <p><strong>Atiende:</strong> ${unidadMostrar} (${tipoMostrar})</p>
            <p class="desc-text">${ficha.descripcion}</p>
        </div>
        <div class="ficha-footer">
            <small>Capturado por: ${capMostrar}</small>
        </div>
    `;
    return tarjeta;
}

if (formFicha) {
    formFicha.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombreParaGuardar = localStorage.getItem('userFullName') || localStorage.getItem('userName') || 'Usuario';
        const fTitulo = document.getElementById('titulo').value;
        const fDesc = document.getElementById('descripcion').value;
        const fTipo = document.getElementById('tipo-auxilio').value;
        const fUnidad = document.getElementById('unidad').value;
        const fEstado = document.getElementById('estado').value;
        const fFecha = document.getElementById('fecha').value;
        const fHora = document.getElementById('hora').value;
        const fMedio = document.getElementById('medio-reporte').value;
        const fDir = document.getElementById('direccion').value;
        const fCol = document.getElementById('colonia').value;
        const fVerdad = document.getElementById('veracidad').value;
        const respuesta = await window.api.guardarFicha(
            userId, fTitulo, fDesc, fTipo, fUnidad, fEstado,
            fFecha, fHora, fMedio, fDir, fCol, fVerdad, nombreParaGuardar
        );

        if (respuesta.success) {
            formFicha.reset();
            setFechaHoraActuales();
            if (document.getElementById('estado')) document.getElementById('estado').value = 'PENDIENTE';
            if (document.getElementById('veracidad')) document.getElementById('veracidad').value = 'Verdadera';

            cargarFichas();
        } else {
            alert('Error al guardar: ' + respuesta.message);
        }
    });
}