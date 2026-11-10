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
    cargarCatalogosDashboard();
    cargarFichas();
    aplicarRestriccionesCatalogos();

    // Inicializar listener de veracidad
    const selectEstado = document.getElementById('estado');
    if (selectEstado) {
        selectEstado.addEventListener('change', actualizarOpcionesVeracidad);
    }
    actualizarOpcionesVeracidad();
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
            actualizarContadores(respuesta.data);

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

async function cargarCatalogosDashboard() {
    const response = await window.api.obtenerCatalogos();

    if (response.success) {
        const listUnidades = document.getElementById('list-unidades');
        const listAuxilios = document.getElementById('list-auxilios');
        const listMedios = document.getElementById('list-medios');
        const listColonias = document.getElementById('list-colonias');

        if (listUnidades && response.unidades) {
            listUnidades.innerHTML = '';
            response.unidades.forEach(u => {
                const option = document.createElement('option');
                option.value = u.nombre;
                listUnidades.appendChild(option);
            });
        }

        if (listAuxilios && response.auxilios) {
            listAuxilios.innerHTML = '';
            response.auxilios.forEach(a => {
                const option = document.createElement('option');
                option.value = a.nombre;
                listAuxilios.appendChild(option);
            });
        }

        if (listMedios && response.medios) {
            listMedios.innerHTML = '';
            response.medios.forEach(m => {
                const option = document.createElement('option');
                option.value = m.nombre;
                listMedios.appendChild(option);
            });
        }

        if (listColonias && response.colonias) {
            listColonias.innerHTML = '';
            response.colonias.forEach(c => {
                const option = document.createElement('option');
                option.value = c.nombre;
                listColonias.appendChild(option);
            });
        }
    }
}

function restringirYAutocompletarCatalogo(inputId, datalistId) {
    const input = document.getElementById(inputId);
    const datalist = document.getElementById(datalistId);

    if (!input || !datalist) return;

    input.addEventListener('change', () => {
        const textoEscrito = input.value.trim();
        if (!textoEscrito) return;

        const opciones = Array.from(datalist.options).map(opt => opt.value);

        const coincidenciaExacta = opciones.find(
            opt => opt.toLowerCase() === textoEscrito.toLowerCase()
        );

        if (coincidenciaExacta) {
            input.value = coincidenciaExacta;
            // SI ES EL CAMPO COLONIA, MOVEMOS EL MAPA
            if (inputId === 'colonia') centrarMapaEnColonia(coincidenciaExacta);
            return;
        }

        const coincidencias = opciones.filter(
            opt => opt.toLowerCase().includes(textoEscrito.toLowerCase())
        );

        if (coincidencias.length === 1) {
            input.value = coincidencias[0];
            // SI ES EL CAMPO COLONIA, MOVEMOS EL MAPA
            if (inputId === 'colonia') centrarMapaEnColonia(coincidencias[0]);
        } else if (coincidencias.length > 1) {
            alert(`Hay varias opciones que contienen "${textoEscrito}". Por favor elige una de la lista desplegable.`);
            input.value = '';
            input.focus();
        } else {
            alert(`"${textoEscrito}" no existe en el catálogo.`);
            input.value = '';
            input.focus();
        }
    });
}

function aplicarRestriccionesCatalogos() {
    restringirYAutocompletarCatalogo('medio-reporte', 'list-medios');
    restringirYAutocompletarCatalogo('colonia', 'list-colonias');
    restringirYAutocompletarCatalogo('tipo-auxilio', 'list-auxilios');
    restringirYAutocompletarCatalogo('unidad', 'list-unidades');
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

    btnTodo.addEventListener('click', () => {
        btnTodo.classList.add('active');
        btnPendientes.classList.remove('active');
        renderizarFichasFiltradas(fichasOriginales);
    });

    btnPendientes.addEventListener('click', () => {
        btnPendientes.classList.add('active');
        btnTodo.classList.remove('active');
        const soloPendientes = fichasOriginales.filter(f => f.estado === 'PENDIENTE');
        renderizarFichasFiltradas(soloPendientes);
    });

    inputBusqueda.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase();
        const fichasFiltradas = fichasOriginales.filter(f => {
            const tituloAux = f.tipoAuxilio || f.tipo || f.titulo || '';
            return (
                tituloAux.toLowerCase().includes(termino) ||
                (f.direccion && f.direccion.toLowerCase().includes(termino))
            );
        });
        renderizarFichasFiltradas(fichasFiltradas);
    });

    function renderizarFichasFiltradas(datos) {
        contenedorFichas.innerHTML = '';
        if (datos.length > 0) {
            datos.forEach(f => {
                contenedorFichas.appendChild(crearTarjetaFicha(f));
            });
        } else {
            contenedorFichas.innerHTML = '<p style="grid-column: 1 / -1; color: #6b7280; text-align: center;">No se encontraron fichas con esos criterios.</p>';
        }
    }
}

function crearTarjetaFicha(ficha) {
    const tarjeta = document.createElement('div');
    const estadoClase = ficha.estado ? ficha.estado.toLowerCase() : 'pendiente';
    tarjeta.className = `ficha-card estado-${estadoClase}`;

    // TÍTULO DE LA TARJETA VIENE DEL TIPO DE AUXILIO
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

function abrirModalFicha(ficha) {
    const modal = document.getElementById('modal-ficha');
    const contenido = document.getElementById('contenido-modal-ficha');
    const tituloAux = ficha.tipoAuxilio || ficha.tipo || ficha.titulo || 'Sin tipo';

    contenido.innerHTML = `
        <p><strong>Tipo de Auxilio:</strong> ${tituloAux}</p>
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
        <p><strong>Coordenadas:</strong> ${ficha.latitud || 'No asignadas'}, ${ficha.longitud || 'No asignadas'}</p>
        <p>
            <a href="https://www.google.com/maps?q=${ficha.latitud},${ficha.longitud}" target="_blank" style="color: var(--primary-color); text-decoration: none; font-weight: bold;">
                📍 Abrir en Google Maps
            </a>
        </p>
        <hr style="border: 0; border-top: 1px solid var(--border-input); margin: 15px 0;">
        <p><small>Capturado por: ${ficha.capturista}</small></p>
    `;

    modal.style.display = 'flex';
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


// Función para buscar la colonia/comisaría y centrar el marcador
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

        // Se envía fTipo como título para mantener compatibilidad con la base de datos
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

            cargarFichas();
        } else {
            alert('Error al guardar: ' + respuesta.message);
        }
    });
}