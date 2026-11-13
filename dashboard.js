if (localStorage.getItem('tema') === 'oscuro') document.body.classList.add('dark-theme');

const userId = localStorage.getItem('userId');
if (!userId) window.location.href = 'index.html';

const currentFullName = localStorage.getItem('userFullName');
const currentUserName = localStorage.getItem('userName');
const currentRol = localStorage.getItem('userRol');
const capturista = currentFullName ? currentFullName : (currentUserName ? currentUserName : 'Usuario Desconocido');

let fichaEditandoActual = null;

document.addEventListener('DOMContentLoaded', async () => {

    const headerUser = document.getElementById('header-username');
    if (headerUser) headerUser.textContent = 'Hola, ' + capturista;

    if (currentRol === 'admin') {
        const btnAdmin = document.getElementById('btn-admin');
        if (btnAdmin) btnAdmin.style.display = 'block';
    }
    const userMenuBtn = document.getElementById('user-menu-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');

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

            window.location.href = 'index.html';
        });
    }

    if (userMenuBtn && dropdownMenu) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        window.addEventListener('click', () => {
            dropdownMenu.classList.remove('show');
        });
    }

    setFechaHoraActuales();

    // USAR AWAIT PARA GARANTIZAR QUE LOS DATALISTS TENGAN DATOS ANTES DE VALIDAR
    await cargarCatalogosDashboard();

    cargarFichas();
    aplicarRestriccionesCatalogos();

    // Inicializar listener de veracidad
    const selectEstado = document.getElementById('estado');
    if (selectEstado) {
        selectEstado.addEventListener('change', actualizarOpcionesVeracidad);
    }
    actualizarOpcionesVeracidad();

    const selectEstadoEdit = document.getElementById('edit-estado');
    if (selectEstadoEdit) {
        selectEstadoEdit.addEventListener('change', actualizarOpcionesVeracidadEdit);
    }
});


const inputFecha = document.getElementById('fecha');
const inputHora = document.getElementById('hora');
const formFicha = document.getElementById('form-ficha');
const contenedorFichas = document.getElementById('contenedor-fichas');

// --- LÓGICA DE ESTADO -> VERACIDAD DINÁMICA ---
function actualizarOpcionesVeracidad() {
    const selectEstado = document.getElementById('estado');
    const selectVeracidad = document.getElementById('veracidad');
    if (!selectEstado || !selectVeracidad) return;

    const estado = selectEstado.value;
    selectVeracidad.innerHTML = '';

    if (estado === 'PENDIENTE') {
        const opt = document.createElement('option');
        opt.value = 'Pendiente';
        opt.textContent = 'Pendiente de verificar';
        opt.selected = true;
        selectVeracidad.appendChild(opt);
        selectVeracidad.disabled = true; // No seleccionable si está pendiente
    } else if (estado === 'LISTO') {
        selectVeracidad.disabled = false; // Habilitado para elegir

        const optReal = document.createElement('option');
        optReal.value = 'Verdadera';
        optReal.textContent = 'Reporte Real';
        optReal.selected = true;

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
        selectVeracidad.disabled = true; // Asignado automáticamente
    }
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

async function cargarFichas() {
    const respuesta = await window.api.obtenerFichas(userId);
    contenedorFichas.innerHTML = '';

    if (respuesta.success && respuesta.data.length > 0) {
        const ahora = new Date();
        const diaActual = ahora.getDate();
        const horaActual = ahora.getHours();
        let mesObjetivo = ahora.getMonth();
        let anoObjetivo = ahora.getFullYear();
        if (diaActual === 1 && horaActual < 3) {
            mesObjetivo = ahora.getMonth() - 1;
            if (mesObjetivo < 0) {
                mesObjetivo = 11;
                anoObjetivo--;
            }
        }

        const fichasMes = respuesta.data.filter(ficha => {
            const fechaFicha = ficha.fecha ? new Date(ficha.fecha) : new Date(ficha.fecha_creacion);
            return fechaFicha.getMonth() === mesObjetivo && fechaFicha.getFullYear() === anoObjetivo;
        });

        if (fichasMes.length > 0) {
            actualizarContadores(fichasMes);

            fichasMes.forEach(ficha => {
                const tarjeta = crearTarjetaFicha(ficha);
                contenedorFichas.appendChild(tarjeta);
            });

            iniciarFiltrosYBusqueda(fichasMes);
        } else {
            contenedorFichas.innerHTML = '<p style="grid-column: 1 / -1; color: #6b7280; text-align: center;">No hay fichas registradas para este periodo.</p>';
            reiniciarContadores();
        }
    } else {
        contenedorFichas.innerHTML = '<p style="grid-column: 1 / -1; color: #6b7280; text-align: center;">Aún no hay fichas en tu turno.</p>';
        reiniciarContadores();
    }
}

// --- SISTEMA CATALOGOS EN MEMORIA & QUICK-PICK MODAL ---
const catalogosMemoria = {
    unidades: [],
    auxilios: [],
    medios: [],
    colonias: []
};

// Carga asíncrona de catálogos desde la base de datos a memoria
async function cargarCatalogosDashboard() {
    const response = await window.api.obtenerCatalogos();

    if (response.success) {
        catalogosMemoria.unidades = (response.unidades || []).map(u => u.nombre);
        catalogosMemoria.auxilios = (response.auxilios || []).map(a => a.nombre);
        catalogosMemoria.medios = (response.medios || []).map(m => m.nombre);
        catalogosMemoria.colonias = (response.colonias || []).map(c => c.nombre);
    }
}

// Variables globales del estado del QuickPick
let quickPickState = {
    targetInput: null,
    tipoCatalogo: '',
    opcionesFiltradas: [],
    selectedIndex: -1
};

// Crear la estructura HTML del Modal de Selección de forma dinámica
function inicializarModalQuickPick() {
    if (document.getElementById('quickpick-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'quickpick-modal';
    overlay.className = 'quickpick-overlay';

    overlay.innerHTML = `
        <div class="quickpick-container">
            <div class="quickpick-header">
                <h3 id="quickpick-titulo">Seleccionar Opción</h3>
                <button class="quickpick-close" id="quickpick-btn-cerrar">&times;</button>
            </div>
            <div class="quickpick-search-box">
                <input type="text" id="quickpick-input-busqueda" placeholder="Escribe para buscar..." autocomplete="off">
            </div>
            <ul class="quickpick-list" id="quickpick-lista"></ul>
        </div>
    `;

    document.body.appendChild(overlay);

    const inputBusqueda = document.getElementById('quickpick-input-busqueda');
    const btnCerrar = document.getElementById('quickpick-btn-cerrar');

    // Evento de búsqueda en tiempo real
    inputBusqueda.addEventListener('input', () => {
        filtrarYRenderizarQuickPick(inputBusqueda.value);
    });

    // Navegación por teclado (Flechas, Enter, Escape)
    inputBusqueda.addEventListener('keydown', (e) => {
        const items = document.querySelectorAll('.quickpick-item');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            quickPickState.selectedIndex = (quickPickState.selectedIndex + 1) % items.length;
            actualizarSeleccionVisual(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            quickPickState.selectedIndex = (quickPickState.selectedIndex - 1 + items.length) % items.length;
            actualizarSeleccionVisual(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (quickPickState.selectedIndex >= 0 && quickPickState.selectedIndex < items.length) {
                items[quickPickState.selectedIndex].click();
            } else if (items.length > 0) {
                items[0].click();
            }
        } else if (e.key === 'Escape') {
            cerrarQuickPick();
        }
    });

    btnCerrar.addEventListener('click', cerrarQuickPick);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrarQuickPick();
    });
}

function actualizarSeleccionVisual(items) {
    items.forEach((item, index) => {
        if (index === quickPickState.selectedIndex) {
            item.classList.add('active-item');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('active-item');
        }
    });
}

function abrirQuickPick(titulo, tipoCatalogo, inputId) {
    inicializarModalQuickPick();

    const targetInput = document.getElementById(inputId);
    if (!targetInput) return;

    quickPickState.targetInput = targetInput;
    quickPickState.tipoCatalogo = tipoCatalogo;
    quickPickState.selectedIndex = -1;

    document.getElementById('quickpick-titulo').textContent = `Seleccionar ${titulo}`;
    const inputBusqueda = document.getElementById('quickpick-input-busqueda');

    // Si la casilla dice "PENDIENTE", abrir el buscador vacío para facilitar la edición
    const valorActual = targetInput.value.trim();
    inputBusqueda.value = (valorActual.toUpperCase() === 'PENDIENTE') ? '' : valorActual;

    const overlay = document.getElementById('quickpick-modal');
    overlay.classList.add('active');

    filtrarYRenderizarQuickPick(inputBusqueda.value);

    setTimeout(() => {
        inputBusqueda.focus();
        inputBusqueda.select();
    }, 50);
}

function filtrarYRenderizarQuickPick(criterio = '') {
    const listaUl = document.getElementById('quickpick-lista');
    listaUl.innerHTML = '';

    const opciones = catalogosMemoria[quickPickState.tipoCatalogo] || [];
    const termino = criterio.toLowerCase().trim();

    quickPickState.opcionesFiltradas = termino
        ? opciones.filter(opt => opt.toLowerCase().includes(termino))
        : opciones;

    quickPickState.selectedIndex = -1;

    if (quickPickState.opcionesFiltradas.length === 0) {
        listaUl.innerHTML = '<li class="quickpick-empty">No se encontraron coincidencias en el catálogo</li>';
        return;
    }

    quickPickState.opcionesFiltradas.forEach((optText) => {
        const li = document.createElement('li');
        li.className = 'quickpick-item';
        li.textContent = optText;

        li.addEventListener('click', () => {
            seleccionarOpcionQuickPick(optText);
        });

        listaUl.appendChild(li);
    });
}

function seleccionarOpcionQuickPick(valorSeleccionado) {
    if (quickPickState.targetInput) {
        quickPickState.targetInput.value = valorSeleccionado;

        if (quickPickState.targetInput.id === 'colonia') {
            centrarMapaEnColonia(valorSeleccionado);
        } else if (quickPickState.targetInput.id === 'edit-colonia') {
            actualizarCoordenadasEdicion(valorSeleccionado);
        }
    }
    cerrarQuickPick();
}

async function actualizarCoordenadasEdicion(nombreColonia) {
    if (!nombreColonia.trim() || !fichaEditandoActual) return;

    const nombreLimpio = nombreColonia
        .replace(/^(comisaria|comisaría)\s+(de\s+)?/i, '')
        .trim();

    const busqueda = encodeURIComponent(`${nombreLimpio}, Valladolid, Yucatán`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${busqueda}&limit=1`;

    try {
        const respuesta = await fetch(url);
        const resultados = await respuesta.json();

        if (resultados && resultados.length > 0) {
            const lat = parseFloat(resultados[0].lat);
            const lng = parseFloat(resultados[0].lon);

            fichaEditandoActual.latitud = lat.toString();
            fichaEditandoActual.longitud = lng.toString();

            if (mapEdit && markerEdit) {
                markerEdit.setLatLng([lat, lng]);
                mapEdit.setView([lat, lng], 15);
            }
        }
    } catch (error) {
        console.error('Error al actualizar coordenadas en edición:', error);
    }
}

function cerrarQuickPick() {
    const overlay = document.getElementById('quickpick-modal');
    if (overlay) overlay.classList.remove('active');

    if (quickPickState.targetInput) {
        quickPickState.targetInput.focus();
    }
}

// Vincula las entradas de texto al selector Quick-Pick
function vincularSelectorQuickPick(inputId, titulo, tipoCatalogo) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.removeAttribute('list');
    input.setAttribute('readonly', 'readonly'); // Evita la edición directa para obligar a seleccionar del catálogo
    input.style.cursor = 'pointer';
    input.placeholder = `Haga clic para seleccionar ${titulo.toLowerCase()}...`;

    // Abrir selector con clic o tecla Enter/Espacio
    input.addEventListener('click', () => {
        abrirQuickPick(titulo, tipoCatalogo, inputId);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            abrirQuickPick(titulo, tipoCatalogo, inputId);
        }
    });
}

// Reemplazo completo de aplicarRestriccionesCatalogos
function aplicarRestriccionesCatalogos() {
    // Formulario principal (Nueva Ficha)
    vincularSelectorQuickPick('medio-reporte', 'Medio de Reporte', 'medios');
    vincularSelectorQuickPick('colonia', 'Colonia o Comisaría', 'colonias');
    vincularSelectorQuickPick('tipo-auxilio', 'Tipo de Auxilio', 'auxilios');
    vincularSelectorQuickPick('unidad', 'Unidad que Atiende', 'unidades');

    // Formulario del Modal de Edición
    vincularSelectorQuickPick('edit-medio-reporte', 'Medio de Reporte', 'medios');
    vincularSelectorQuickPick('edit-colonia', 'Colonia o Comisaría', 'colonias');
    vincularSelectorQuickPick('edit-tipo-auxilio', 'Tipo de Auxilio', 'auxilios');
    vincularSelectorQuickPick('edit-unidad', 'Unidad que Atiende', 'unidades');
}


// Notificación flotante visual sin bloquear el foco de Electron
function mostrarNotificacionFiltro(mensaje) {
    let toast = document.getElementById('toast-alerta-catalogo');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-alerta-catalogo';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background-color: #ef4444;
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

    toast.innerText = mensaje;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(window.toastTimerCatalogo);
    window.toastTimerCatalogo = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
    }, 3500);
}


function actualizarContadores(fichas) {
    let pendientes = 0;
    let falsos = 0;
    let verdaderos = 0;
    let canalizado = 0;

    fichas.forEach(f => {
        if (f.estado === 'PENDIENTE') pendientes++;

        if (f.veracidad === 'Falsa') {
            falsos++;
        } else if (f.veracidad === 'Verdadera') {
            verdaderos++;
        } else if (f.veracidad === 'Canalizado' || f.estado === 'CANALIZADO') {
            canalizado++;
        }
    });

    document.getElementById('count-pendientes').textContent = pendientes;
    document.getElementById('count-falsos').textContent = falsos;
    document.getElementById('count-verdaderos').textContent = verdaderos;
    document.getElementById('count-canalizado').textContent = canalizado;
    document.getElementById('count-total').textContent = fichas.length;
}

function reiniciarContadores() {
    document.getElementById('count-pendientes').textContent = '0';
    document.getElementById('count-falsos').textContent = '0';
    document.getElementById('count-verdaderos').textContent = '0';
    document.getElementById('count-canalizado').textContent = '0';
    document.getElementById('count-total').textContent = '0';
}

function iniciarFiltrosYBusqueda(fichasOriginales) {
    const btnTodo = document.getElementById('filtro-todo');
    const btnPendientes = document.getElementById('filtro-pendientes');
    const inputBusqueda = document.getElementById('busqueda-fichas');
    const inputFecha = document.getElementById('filtro-fecha');
    let estadoFiltro = 'TODO';
    const mesActivo = fichasOriginales.length > 0 && fichasOriginales[0].fecha
        ? fichasOriginales[0].fecha.substring(0, 7)
        : new Date().toISOString().substring(0, 7);
    function aplicarFiltros() {
        const termino = inputBusqueda.value.toLowerCase().trim();
        const fechaSeleccionada = inputFecha ? inputFecha.value : ''; // Formato "YYYY-MM-DD"

        if (fechaSeleccionada) {
            const mesSeleccionado = fechaSeleccionada.substring(0, 7);
            if (mesSeleccionado !== mesActivo) {
                mostrarNotificacion(`⚠️ La fecha (${fechaSeleccionada}) no pertenece al mes en turno (${mesActivo}).`, 'warning');
                inputFecha.value = '';
                aplicarFiltros();
                return;
            }
        }

        const fichasFiltradas = fichasOriginales.filter(f => {
            // 1. Filtro por Estado (Todo / Pendiente)
            if (estadoFiltro === 'PENDIENTE' && f.estado !== 'PENDIENTE') {
                return false;
            }

            // 2. Filtro por Fecha exacta
            if (fechaSeleccionada && f.fecha !== fechaSeleccionada) {
                return false;
            }

            // 3. Filtro por Texto (Tipo, Dirección, Colonia, Unidad, Descripción, Capturista)
            if (termino) {
                const tituloAux = f.tipoAuxilio || f.tipo || f.titulo || '';
                const coincideTexto = (
                    tituloAux.toLowerCase().includes(termino) ||
                    (f.direccion && f.direccion.toLowerCase().includes(termino)) ||
                    (f.colonia && f.colonia.toLowerCase().includes(termino)) ||
                    (f.unidad && f.unidad.toLowerCase().includes(termino)) ||
                    (f.descripcion && f.descripcion.toLowerCase().includes(termino)) ||
                    (f.capturista && f.capturista.toLowerCase().includes(termino))
                );
                if (!coincideTexto) return false;
            }

            return true;
        });

        renderizarFichasFiltradas(fichasFiltradas);
    }

    // Eventos de botones de estado
    btnTodo.addEventListener('click', () => {
        estadoFiltro = 'TODO';
        btnTodo.classList.add('active');
        btnPendientes.classList.remove('active');
        aplicarFiltros();
    });

    btnPendientes.addEventListener('click', () => {
        estadoFiltro = 'PENDIENTE';
        btnPendientes.classList.add('active');
        btnTodo.classList.remove('active');
        aplicarFiltros();
    });

    // Eventos de entrada de texto y selección de fecha
    inputBusqueda.addEventListener('input', aplicarFiltros);

    if (inputFecha) {
        inputFecha.addEventListener('change', aplicarFiltros);
    }

    function renderizarFichasFiltradas(datos) {
        contenedorFichas.innerHTML = '';
        if (datos.length > 0) {
            datos.forEach(f => {
                contenedorFichas.appendChild(crearTarjetaFicha(f));
            });
        } else {
            contenedorFichas.innerHTML = `
                <p style="grid-column: 1 / -1; color: #6b7280; text-align: center; padding: 20px;">
                    No se encontraron fichas para los criterios seleccionados.
                </p>`;
        }
    }
}

function crearTarjetaFicha(ficha) {
    const tarjeta = document.createElement('div');
    const estadoClase = ficha.estado ? ficha.estado.toLowerCase() : 'pendiente';

    const tieneDatosPendientes = [
        ficha.medio,
        ficha.direccion,
        ficha.colonia,
        ficha.unidad,
        ficha.descripcion
    ].some(val => val && val.trim().toUpperCase() === 'PENDIENTE');

    const badgeDatosIncompletos = tieneDatosPendientes
        ? `<div style="display: inline-block; background: rgba(245, 158, 11, 0.15); color: #f50b0b; border: 1px solid #f50b0b; font-size: 0.72rem; font-weight: 600; padding: 2px 7px; border-radius: 4px; margin-top: 4px;">FICHA RAPIDA / DATOS INCOMPLETOS</div>`
        : '';

    tarjeta.className = `ficha-card estado-${estadoClase}`;


    const tituloTarjeta = ficha.tipoAuxilio || ficha.tipo || ficha.titulo || 'Sin Tipo de Auxilio';

    let veracidadText = 'REPORTE REAL';
    let veracidadColor = '#10b981';

    if (ficha.veracidad === 'Falsa') {
        veracidadText = 'REPORTE FALSO';
        veracidadColor = '#ef4444';
    } else if (ficha.veracidad === 'Canalizado' || ficha.estado === 'CANALIZADO') {
        veracidadText = 'REPORTE CANALIZADO';
        veracidadColor = '#3b82f6';
    } else if (ficha.veracidad === 'Pendiente' || ficha.estado === 'PENDIENTE') {
        veracidadText = 'PENDIENTE DE VERIFICAR';
        veracidadColor = '#f59e0b';
    }

    const fechaMostrar = ficha.fecha || (ficha.fecha_creacion ? new Date(ficha.fecha_creacion).toLocaleDateString() : 'Sin fecha');
    const horaMostrar = ficha.hora || 'Sin hora';
    const direccionMostrar = ficha.direccion || 'Sin dirección';
    const coloniaMostrar = ficha.colonia || 'Sin colonia';
    const unidadMostrar = ficha.unidad || 'Sin unidad';
    const estadoMostrar = ficha.estado || 'PENDIENTE';

    tarjeta.innerHTML = `
        <div class="ficha-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="width: 70%;">${tituloTarjeta}</h4>
            <span class="badge ${estadoMostrar === 'PENDIENTE' ? 'bg-warning' : (estadoMostrar === 'CANALIZADO' ? 'bg-info' : 'bg-success')}" style="font-size: 0.75rem; padding: 3px 8px; border-radius: 4px;">${estadoMostrar}</span>
        </div>
        <div class="ficha-body">
        ${badgeDatosIncompletos}
            <p style="color: ${veracidadColor}; font-weight: bold; font-size: 0.8rem; margin-top: 5px; margin-bottom: 5px;">
                ${veracidadText}
            </p>
            <p style="margin: 3px 0;"><strong>Fecha/Hora:</strong> ${fechaMostrar} a las ${horaMostrar}</p>
            <p style="margin: 3px 0;"><strong>Ubicación:</strong> ${direccionMostrar}, ${coloniaMostrar}</p>
            <p style="margin: 3px 0;"><strong>Atiende:</strong> ${unidadMostrar}</p>
            <p class="desc-text-corta">${ficha.descripcion}</p>
        </div>
        <button class="btn-ver-mas">Ver detalles completos</button>
    `;

    const btnVerMas = tarjeta.querySelector('.btn-ver-mas');
    btnVerMas.addEventListener('click', () => {
        abrirModalFicha(ficha);
    });

    return tarjeta;
}

if (document.getElementById('btn-cerrar-modal')) {
    document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
        document.getElementById('modal-ficha').style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('modal-ficha');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});


let mapForm;
let markerForm;
let latSelected = 20.6896;
let lngSelected = -88.2015;

function initMapaFormulario() {
    mapForm = L.map('map-formulario').setView([latSelected, lngSelected], 14);

    // Servidor de mapas gratuito de OpenStreetMap (No requiere API Key)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(mapForm);

    markerForm = L.marker([latSelected, lngSelected], {
        draggable: true
    }).addTo(mapForm);

    markerForm.on('dragend', function (e) {
        const position = markerForm.getLatLng();
        latSelected = position.lat;
        lngSelected = position.lng;
    });
}

initMapaFormulario();

let mapEdit = null;
let markerEdit = null;

function initOCentrarMapaEdicion(lat, lng) {
    const latNum = parseFloat(lat) || 20.6896;
    const lngNum = parseFloat(lng) || -88.2015;
    const zoomNivel = (parseFloat(lat) && parseFloat(lng)) ? 15 : 14;

    if (!mapEdit) {
        mapEdit = L.map('map-edicion').setView([latNum, lngNum], zoomNivel);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(mapEdit);

        markerEdit = L.marker([latNum, lngNum], {
            draggable: true
        }).addTo(mapEdit);

        // Actualizar coordenadas en tiempo real al soltar el marcador
        markerEdit.on('dragend', function () {
            const posicion = markerEdit.getLatLng();
            if (fichaEditandoActual) {
                fichaEditandoActual.latitud = posicion.lat.toString();
                fichaEditandoActual.longitud = posicion.lng.toString();
            }
        });
    } else {
        markerEdit.setLatLng([latNum, lngNum]);
        mapEdit.setView([latNum, lngNum], zoomNivel);
    }

    // Recalcular dimensiones del mapa una vez que el modal ya es visible
    setTimeout(() => {
        if (mapEdit) mapEdit.invalidateSize();
    }, 100);
}

async function centrarMapaEnColonia(nombreColonia) {
    if (!nombreColonia.trim()) return;

    // 1. Limpiamos prefijos comunes para que la búsqueda en OpenStreetMap sea exacta
    let nombreLimpio = nombreColonia
        .replace(/^(comisaria|comisaría)\s+(de\s+)?/i, '')
        .trim();

    // 2. Armamos la búsqueda incluyendo la comisaría y la delimitación municipal
    const busqueda = encodeURIComponent(`${nombreLimpio}, Valladolid, Yucatán`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${busqueda}&limit=1`;

    try {
        const respuesta = await fetch(url);
        const resultados = await respuesta.json();

        if (resultados && resultados.length > 0) {
            const lat = parseFloat(resultados[0].lat);
            const lng = parseFloat(resultados[0].lon);

            latSelected = lat;
            lngSelected = lng;

            // Centramos el mapa y movemos el marcador al centro de la comisaría/colonia
            markerForm.setLatLng([lat, lng]);
            mapForm.setView([lat, lng], 15);
        } else {
            console.warn(`No se encontró la ubicación exacta de: ${nombreLimpio}`);
        }
    } catch (error) {
        console.error("Error al conectar con el servicio de mapas:", error);
    }
}

// Lógica de veracidad para el modal de EDICIÓN
function actualizarOpcionesVeracidadEdit() {
    const selectEstado = document.getElementById('edit-estado');
    const selectVeracidad = document.getElementById('edit-veracidad');
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

// Función para abrir y popular el modal de edición
function abrirModalEdicion(ficha) {
    fichaEditandoActual = ficha;

    document.getElementById('edit-id').value = ficha.id;
    document.getElementById('edit-fecha').value = ficha.fecha;
    document.getElementById('edit-hora').value = ficha.hora;
    document.getElementById('edit-tipo-auxilio').value = ficha.tipoAuxilio || ficha.tipo || ficha.titulo || '';
    document.getElementById('edit-medio-reporte').value = ficha.medio || '';
    document.getElementById('edit-direccion').value = ficha.direccion || '';
    document.getElementById('edit-colonia').value = ficha.colonia || '';
    document.getElementById('edit-descripcion').value = ficha.descripcion || '';
    document.getElementById('edit-unidad').value = ficha.unidad || '';

    const selectEstado = document.getElementById('edit-estado');
    selectEstado.value = ficha.estado || 'PENDIENTE';

    // Actualizar las opciones de veracidad según el estado cargado
    actualizarOpcionesVeracidadEdit();

    // Seleccionar la veracidad actual si está en estado LISTO
    if (ficha.estado === 'LISTO') {
        document.getElementById('edit-veracidad').value = ficha.veracidad || 'Verdadera';
    }

    // Cerrar modal de detalles si está abierto y mostrar el de edición
    document.getElementById('modal-ficha').style.display = 'none';
    document.getElementById('modal-editar-ficha').style.display = 'flex';

    initOCentrarMapaEdicion(ficha.latitud, ficha.longitud);
}

function abrirModalFicha(ficha) {
    const modal = document.getElementById('modal-ficha');
    const contenido = document.getElementById('contenido-modal-ficha');
    const tituloAux = ficha.tipoAuxilio || ficha.tipo || ficha.titulo || 'Sin tipo';
    const tieneCoordenadas = ficha.latitud && ficha.longitud;
    const urlGoogleMaps = tieneCoordenadas
        ? `https://www.google.com/maps?q=${ficha.latitud},${ficha.longitud}`
        : null;

    contenido.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 6px;">
            <p style="margin: 0;"><strong>Tipo de Auxilio:</strong> ${tituloAux}</p>
            <button id="btn-copiar-completo-modal" type="button" style="background-color: #4f46e5; color: #ffffff; border: none; padding: 5px 12px; border-radius: 5px; font-size: 0.8rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background-color 0.2s;">
                Copiar Ficha
            </button>
        </div>
        <p><strong>Estado:</strong> ${ficha.estado}</p>
        <p><strong>Veracidad:</strong> ${ficha.veracidad}</p>
        <p><strong>Fecha/Hora:</strong> ${ficha.fecha} a las ${ficha.hora}</p>
        <p><strong>Ubicación:</strong> ${ficha.direccion}, ${ficha.colonia}</p>
        <p><strong>Reporte por:</strong> ${ficha.medio}</p>
        <p><strong>Atiende:</strong> ${ficha.unidad}</p>
        <p><strong>Descripción:</strong></p>
        <div style="background: var(--hover-sidebar); padding: 10px; border-radius: 6px; margin-bottom: 10px;">
            ${ficha.descripcion}
        </div>
        <p><strong>Coordenadas:</strong> ${tieneCoordenadas ? `${ficha.latitud}, ${ficha.longitud}` : 'No asignadas'}</p>
        <p>
            ${urlGoogleMaps
            ? `<a href="${urlGoogleMaps}" target="_blank" style="color: var(--primary-color); text-decoration: none; font-weight: bold;">📍 Abrir en Google Maps</a>`
            : `<span style="color: #9ca3af; font-style: italic;">📍 Ubicación en mapa no asignada</span>`
        }
        </p>
        <hr style="border: 0; border-top: 1px solid var(--border-input); margin: 15px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
            <small>Capturado por: ${ficha.capturista}</small>
            <div style="display: flex; gap: 8px;">
                <button id="btn-copiar-desde-modal" class="btn-submit" style="width: auto; padding: 6px 14px; margin: 0; background-color: #10b981;">Copiar Datos</button>
                <button id="btn-editar-desde-modal" class="btn-submit" style="width: auto; padding: 6px 16px; margin: 0;">Editar Ficha</button>
            </div>
        </div>
    `;

    // 1. Botón superior: Copia TODOS los campos de la ficha con etiquetas

    document.getElementById('btn-copiar-completo-modal').addEventListener('click', async () => {
        const lineasCompletas = `*${tituloAux}*

*FECHA:* ${ficha.fecha}
*HORA:* ${ficha.hora}
*DIRECCIÓN:* ${ficha.direccion}
*MEDIO DEL REPORTE:* ${ficha.medio}
*UNIDAD QUE VERIFICA:* ${ficha.unidad}

*DESCRIPCIÓN DE LOS HECHOS:*

${ficha.descripcion}

*MAPA GOOGLE MAPS:*
${urlGoogleMaps}`;

        try {
            await navigator.clipboard.writeText(lineasCompletas);

            const btnCompleto = document.getElementById('btn-copiar-completo-modal');

            btnCompleto.innerText = '¡Copiado! ✓';
            btnCompleto.style.backgroundColor = '#4f46e5';

            setTimeout(() => {
                if (btnCompleto) {
                    btnCompleto.innerText = 'Copiar Ficha';
                    btnCompleto.style.backgroundColor = '#6366f1';
                }
            }, 2000);

        } catch (err) {
            console.error('Error al copiar ficha completa:', err);
            mostrarNotificacion('No se pudo copiar la ficha completa.', 'error');
        }
    });


    // 2. Botón inferior: Copia el formato corto original
    document.getElementById('btn-copiar-desde-modal').addEventListener('click', async () => {
        const textoACopiar = `${ficha.hora} Horas, ${tituloAux}

${ficha.direccion}, ${ficha.colonia} Reporta ${ficha.medio} ${ficha.descripcion}`;

        try {
            await navigator.clipboard.writeText(textoACopiar);
            const btnCopiar = document.getElementById('btn-copiar-desde-modal');

            btnCopiar.innerText = '¡Copiado! ✓';
            btnCopiar.style.backgroundColor = '#059669';

            setTimeout(() => {
                if (btnCopiar) {
                    btnCopiar.innerText = 'Copiar Datos';
                    btnCopiar.style.backgroundColor = '#10b981';
                }
            }, 2000);
        } catch (err) {
            console.error('Error al copiar al portapapeles:', err);
            mostrarNotificacion('No se pudo copiar la información al portapapeles.', 'error');
        }
    });

    // 3. Botón Editar
    document.getElementById('btn-editar-desde-modal').addEventListener('click', () => {
        abrirModalEdicion(ficha);
    });

    modal.style.display = 'flex';
}

// Evento Submit del formulario de edición
const formEditarFicha = document.getElementById('form-editar-ficha');
if (formEditarFicha) {
    formEditarFicha.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fichaActualizada = {
            id: document.getElementById('edit-id').value,
            fecha: document.getElementById('edit-fecha').value,
            hora: document.getElementById('edit-hora').value,
            tipoAuxilio: document.getElementById('edit-tipo-auxilio').value,
            medio: document.getElementById('edit-medio-reporte').value,
            direccion: document.getElementById('edit-direccion').value,
            colonia: document.getElementById('edit-colonia').value,
            descripcion: document.getElementById('edit-descripcion').value,
            unidad: document.getElementById('edit-unidad').value,
            estado: document.getElementById('edit-estado').value,
            veracidad: document.getElementById('edit-veracidad').value,
            latitud: fichaEditandoActual ? fichaEditandoActual.latitud : '',
            longitud: fichaEditandoActual ? fichaEditandoActual.longitud : ''
        };

        const respuesta = await window.api.actualizarFicha(fichaActualizada);

        if (respuesta.success) {
            document.getElementById('modal-editar-ficha').style.display = 'none';
            mostrarNotificacion('✓ Ficha actualizada correctamente.', 'success');
            cargarFichas();
        } else {
            mostrarNotificacion('Error al actualizar la ficha: ' + respuesta.message, 'error');
        }
    });
}

if (formFicha) {
    // Evita que presionar 'Enter' dentro de un input envíe el formulario
    formFicha.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
        }
    });

    formFicha.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombreParaGuardar = localStorage.getItem('userFullName') || localStorage.getItem('userName') || 'Usuario';
        const fTipo = document.getElementById('tipo-auxilio').value;
        const fDesc = document.getElementById('descripcion').value;
        const fUnidad = document.getElementById('unidad').value;
        const fEstado = document.getElementById('estado').value;
        const fFecha = document.getElementById('fecha').value;
        const fHora = document.getElementById('hora').value;
        const fMedio = document.getElementById('medio-reporte').value;
        const fDir = document.getElementById('direccion').value;
        const fCol = document.getElementById('colonia').value;
        const fVerdad = document.getElementById('veracidad').value;

        if (!fTipo.trim()) {
            mostrarNotificacion('Selecciona el Tipo de Auxilio.', 'warning');
            abrirQuickPick('Tipo de Auxilio', 'auxilios', 'tipo-auxilio');
            return;
        }
        if (!fMedio.trim()) {
            mostrarNotificacion('Selecciona el Medio de Reporte.', 'warning');
            abrirQuickPick('Medio de Reporte', 'medios', 'medio-reporte');
            return;
        }
        if (!fCol.trim()) {
            mostrarNotificacion('Selecciona la Colonia o Comisaría.', 'warning');
            abrirQuickPick('Colonia o Comisaría', 'colonias', 'colonia');
            return;
        }
        if (!fUnidad.trim()) {
            mostrarNotificacion('Selecciona la Unidad que Atiende.', 'warning');
            abrirQuickPick('Unidad que Atiende', 'unidades', 'unidad');
            return;
        }

        const respuesta = await window.api.guardarFicha(
            userId, fTipo, fDesc, fTipo, fUnidad, fEstado,
            fFecha, fHora, fMedio, fDir, fCol, fVerdad, nombreParaGuardar,
            latSelected.toString(), lngSelected.toString()
        );

        if (respuesta.success) {
            formFicha.reset();

            latSelected = 20.6896;
            lngSelected = -88.2015;
            markerForm.setLatLng([latSelected, lngSelected]);
            mapForm.setView([latSelected, lngSelected], 14);
            setFechaHoraActuales();

            if (document.getElementById('estado')) document.getElementById('estado').value = 'PENDIENTE';
            actualizarOpcionesVeracidad();

            mostrarNotificacion('✓ Ficha guardada exitosamente.', 'success');
            cargarFichas();
        } else {
            mostrarNotificacion('Error al guardar: ' + respuesta.message, 'error');
        }
    });

    const btnRegistroRapido = document.getElementById('btn-registro-rapido');
    if (btnRegistroRapido) {
        btnRegistroRapido.addEventListener('click', async () => {
            const fTipo = document.getElementById('tipo-auxilio').value.trim();

            // Exigir únicamente el Tipo de Auxilio y abrir el selector si está vacío
            if (!fTipo || fTipo.toUpperCase() === 'PENDIENTE') {
                mostrarNotificacion('Selecciona al menos el Tipo de Auxilio para el registro rápido.', 'warning');
                abrirQuickPick('Tipo de Auxilio', 'auxilios', 'tipo-auxilio');
                return;
            }

            // Garantizar fecha y hora vigentes si estuvieran vacías
            if (!document.getElementById('fecha').value || !document.getElementById('hora').value) {
                setFechaHoraActuales();
            }

            const nombreParaGuardar = localStorage.getItem('userFullName') || localStorage.getItem('userName') || 'Usuario';
            const fFecha = document.getElementById('fecha').value;
            const fHora = document.getElementById('hora').value;

            // Conservar cualquier dato ya capturado y rellenar los vacíos con "PENDIENTE"
            const fMedio = document.getElementById('medio-reporte').value.trim() || 'PENDIENTE';
            const fDir = document.getElementById('direccion').value.trim() || 'PENDIENTE';
            const fCol = document.getElementById('colonia').value.trim() || 'PENDIENTE';
            const fUnidad = document.getElementById('unidad').value.trim() || 'PENDIENTE';
            const fDesc = document.getElementById('descripcion').value.trim() || 'PENDIENTE';
            const fEstado = 'PENDIENTE';
            const fVerdad = 'Pendiente';

            const respuesta = await window.api.guardarFicha(
                userId, fTipo, fDesc, fTipo, fUnidad, fEstado,
                fFecha, fHora, fMedio, fDir, fCol, fVerdad, nombreParaGuardar,
                latSelected.toString(), lngSelected.toString()
            );

            if (respuesta.success) {
                formFicha.reset();

                latSelected = 20.6896;
                lngSelected = -88.2015;
                markerForm.setLatLng([latSelected, lngSelected]);
                mapForm.setView([latSelected, lngSelected], 14);
                setFechaHoraActuales();

                if (document.getElementById('estado')) document.getElementById('estado').value = 'PENDIENTE';
                actualizarOpcionesVeracidad();

                mostrarNotificacion('Ficha rápida registrada como PENDIENTE.', 'success');
                cargarFichas();
            } else {
                mostrarNotificacion('Error al guardar registro rápido: ' + respuesta.message, 'error');
            }
        });
    }
}

// Sistema unificado de notificaciones Toast (evita bloqueo de foco en Electron)
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

    // Colores según el tipo de notificación
    const colores = {
        error: '#ef4444',   // Rojo
        warning: '#f59e0b', // Amarillo / Ámbar
        success: '#10b981', // Verde
        info: '#3b82f6'     // Azul
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