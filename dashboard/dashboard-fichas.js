(() => {
    const state = window.DashboardState;
    const {
        mostrarNotificacion,
        setFechaHoraActuales,
        actualizarOpcionesVeracidad,
        actualizarOpcionesVeracidadEdit
    } = window.DashboardUtils;
    const { resetearMapaFormulario, initOCentrarMapaEdicion } = window.DashboardMapas;
    const { abrirQuickPick } = window.DashboardCatalogos;

    const contenedorFichas = document.getElementById('contenedor-fichas');
    let fichasMesActual = [];
    let fichasVisiblesActuales = [];
    let estadoFiltro = 'TODO';
    let filtrosInicializados = false;

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

        tarjeta.querySelector('.btn-ver-mas').addEventListener('click', () => {
            abrirModalFicha(ficha);
        });

        return tarjeta;
    }

    function renderizarFichasFiltradas(datos) {
        contenedorFichas.innerHTML = '';
        if (datos.length > 0) {
            datos.forEach(f => contenedorFichas.appendChild(crearTarjetaFicha(f)));
        } else {
            contenedorFichas.innerHTML = `
                <p style="grid-column: 1 / -1; color: #6b7280; text-align: center; padding: 20px;">
                    No se encontraron fichas para los criterios seleccionados.
                </p>`;
        }
    }

    function aplicarFiltros() {
        const inputBusqueda = document.getElementById('busqueda-fichas');
        const inputFecha = document.getElementById('filtro-fecha');
        const termino = inputBusqueda ? inputBusqueda.value.toLowerCase().trim() : '';
        const fechaSeleccionada = inputFecha ? inputFecha.value : '';

        const mesActivo = fichasMesActual.length > 0 && fichasMesActual[0].fecha
            ? fichasMesActual[0].fecha.substring(0, 7)
            : new Date().toISOString().substring(0, 7);

        if (fechaSeleccionada) {
            const mesSeleccionado = fechaSeleccionada.substring(0, 7);
            if (mesSeleccionado !== mesActivo) {
                mostrarNotificacion(`⚠️ La fecha (${fechaSeleccionada}) no pertenece al mes en turno (${mesActivo}).`, 'warning');
                inputFecha.value = '';
                aplicarFiltros();
                return;
            }
        }

        const fichasFiltradas = fichasMesActual.filter(f => {
            if (estadoFiltro === 'PENDIENTE' && f.estado !== 'PENDIENTE') return false;
            if (fechaSeleccionada && f.fecha !== fechaSeleccionada) return false;

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

        fichasVisiblesActuales = fichasFiltradas;
        renderizarFichasFiltradas(fichasFiltradas);

    }

    function iniciarFiltrosYBusqueda() {
        if (filtrosInicializados) {
            aplicarFiltros();
            return;
        }

        const btnTodo = document.getElementById('filtro-todo');
        const btnPendientes = document.getElementById('filtro-pendientes');
        const inputBusqueda = document.getElementById('busqueda-fichas');
        const inputFecha = document.getElementById('filtro-fecha');

        if (btnTodo && btnPendientes) {
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
        }

        if (inputBusqueda) inputBusqueda.addEventListener('input', aplicarFiltros);
        if (inputFecha) inputFecha.addEventListener('change', aplicarFiltros);

        filtrosInicializados = true;
        aplicarFiltros();
    }

    async function cargarFichas() {
        const respuesta = await window.api.obtenerFichas(state.userId);
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

            fichasMesActual = respuesta.data.filter(ficha => {
                const fechaFicha = ficha.fecha ? new Date(ficha.fecha) : new Date(ficha.fecha_creacion);
                return fechaFicha.getMonth() === mesObjetivo && fechaFicha.getFullYear() === anoObjetivo;
            });

            if (fichasMesActual.length > 0) {
                actualizarContadores(fichasMesActual);
                iniciarFiltrosYBusqueda();
            } else {
                fichasVisiblesActuales = [];
                contenedorFichas.innerHTML = '<p style="grid-column: 1 / -1; color: #6b7280; text-align: center;">No hay fichas registradas para este periodo.</p>';
                reiniciarContadores();
            }
        } else {
            fichasMesActual = [];
            fichasVisiblesActuales = [];
            contenedorFichas.innerHTML = '<p style="grid-column: 1 / -1; color: #6b7280; text-align: center;">Aún no hay fichas en tu turno.</p>';
            reiniciarContadores();
        }
    }

    function abrirModalEdicion(ficha) {
        state.fichaEditandoActual = ficha;

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

        actualizarOpcionesVeracidadEdit();

        if (ficha.estado === 'LISTO') {
            document.getElementById('edit-veracidad').value = ficha.veracidad || 'Verdadera';
        }

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
${urlGoogleMaps || 'No asignado'}`;

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

        document.getElementById('btn-editar-desde-modal').addEventListener('click', () => {
            abrirModalEdicion(ficha);
        });

        modal.style.display = 'flex';
    }

    function escaparCampoCSV(valor) {
        const texto = String(valor ?? '').replace(/\r?\n|\r/g, ' ').trim();
        return `"${texto.replace(/"/g, '""')}"`;
    }

    async function exportarFichasCSV() {
        if (!fichasVisiblesActuales || fichasVisiblesActuales.length === 0) {
            mostrarNotificacion('No hay fichas visibles para exportar.', 'warning');
            return;
        }

        const encabezados = [
            'ID',
            'Fecha',
            'Hora',
            'Tipo de Auxilio',
            'Estado',
            'Veracidad',
            'Medio de Reporte',
            'Dirección',
            'Colonia / Comisaría',
            'Unidad',
            'Descripción',
            'Latitud',
            'Longitud',
            'Capturista'
        ];

        const filas = fichasVisiblesActuales.map(f => [
            f.id,
            f.fecha || '',
            f.hora || '',
            f.tipoAuxilio || f.tipo || f.titulo || '',
            f.estado || '',
            f.veracidad || '',
            f.medio || '',
            f.direccion || '',
            f.colonia || '',
            f.unidad || '',
            f.descripcion || '',
            f.latitud || '',
            f.longitud || '',
            f.capturista || ''
        ].map(escaparCampoCSV).join(','));

        // BOM UTF-8 (\uFEFF) para que Excel en Windows muestre acentos y la letra ñ sin errores
        const contenidoCSV = '\uFEFF' + [encabezados.map(escaparCampoCSV).join(','), ...filas].join('\r\n');

        const inputFecha = document.getElementById('filtro-fecha');
        const sufijoFecha = (inputFecha && inputFecha.value)
            ? inputFecha.value
            : new Date().toISOString().slice(0, 10);

        const respuesta = await window.api.exportarCSV(contenidoCSV, `reporte_fichas_${sufijoFecha}.csv`);

        if (respuesta.canceled) return;

        if (respuesta.success) {
            mostrarNotificacion(`✓ Reporte exportado (${fichasVisiblesActuales.length} fichas).`, 'success');
        } else {
            mostrarNotificacion('Error al exportar: ' + respuesta.message, 'error');
        }
    }

    function inicializarEventosModalesYFormularios() {
        // Botón Exportar CSV
        const btnExportarCSV = document.getElementById('btn-exportar-csv');
        if (btnExportarCSV) {
            btnExportarCSV.addEventListener('click', exportarFichasCSV);
        }

        // Cierre unificado de modales
        document.addEventListener('click', (e) => {
            const clicEnCerrar = e.target.closest('.modal-close-btn, #btn-cerrar-modal, #btn-cerrar-modal-ficha, #btn-cerrar-modal-editar');

            const modalDetalles = document.getElementById('modal-ficha');
            if (modalDetalles && window.getComputedStyle(modalDetalles).display !== 'none') {
                if (clicEnCerrar || e.target === modalDetalles) {
                    modalDetalles.style.display = 'none';
                    return;
                }
            }

            const modalEditar = document.getElementById('modal-editar-ficha');
            if (modalEditar && window.getComputedStyle(modalEditar).display !== 'none') {
                if (clicEnCerrar || e.target === modalEditar) {
                    modalEditar.style.display = 'none';
                    state.fichaEditandoActual = null;
                }
            }
        });
        // Cierre unificado de modales
        document.addEventListener('click', (e) => {
            const clicEnCerrar = e.target.closest('.modal-close-btn, #btn-cerrar-modal, #btn-cerrar-modal-ficha, #btn-cerrar-modal-editar');

            const modalDetalles = document.getElementById('modal-ficha');
            if (modalDetalles && window.getComputedStyle(modalDetalles).display !== 'none') {
                if (clicEnCerrar || e.target === modalDetalles) {
                    modalDetalles.style.display = 'none';
                    return;
                }
            }

            const modalEditar = document.getElementById('modal-editar-ficha');
            if (modalEditar && window.getComputedStyle(modalEditar).display !== 'none') {
                if (clicEnCerrar || e.target === modalEditar) {
                    modalEditar.style.display = 'none';
                    state.fichaEditandoActual = null;
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;

            const quickPick = document.getElementById('quickpick-modal');
            if (quickPick && quickPick.classList.contains('active')) return;

            const modalEditar = document.getElementById('modal-editar-ficha');
            if (modalEditar && window.getComputedStyle(modalEditar).display !== 'none') {
                modalEditar.style.display = 'none';
                state.fichaEditandoActual = null;
                return;
            }

            const modalDetalles = document.getElementById('modal-ficha');
            if (modalDetalles && window.getComputedStyle(modalDetalles).display !== 'none') {
                modalDetalles.style.display = 'none';
            }
        });

        // Submit formulario de edición
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
                    latitud: state.fichaEditandoActual ? state.fichaEditandoActual.latitud : '',
                    longitud: state.fichaEditandoActual ? state.fichaEditandoActual.longitud : ''
                };

                const respuesta = await window.api.actualizarFicha(fichaActualizada);

                if (respuesta.success) {
                    document.getElementById('modal-editar-ficha').style.display = 'none';
                    state.fichaEditandoActual = null;
                    mostrarNotificacion('✓ Ficha actualizada correctamente.', 'success');
                    cargarFichas();
                } else {
                    mostrarNotificacion('Error al actualizar la ficha: ' + respuesta.message, 'error');
                }
            });
        }

        // Submit formulario principal y registro rápido
        const formFicha = document.getElementById('form-ficha');
        if (formFicha) {
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
                    state.userId, fTipo, fDesc, fTipo, fUnidad, fEstado,
                    fFecha, fHora, fMedio, fDir, fCol, fVerdad, nombreParaGuardar,
                    state.latSelected.toString(), state.lngSelected.toString()
                );

                if (respuesta.success) {
                    formFicha.reset();
                    resetearMapaFormulario();
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

                    if (!fTipo || fTipo.toUpperCase() === 'PENDIENTE') {
                        mostrarNotificacion('Selecciona al menos el Tipo de Auxilio para el registro rápido.', 'warning');
                        abrirQuickPick('Tipo de Auxilio', 'auxilios', 'tipo-auxilio');
                        return;
                    }

                    if (!document.getElementById('fecha').value || !document.getElementById('hora').value) {
                        setFechaHoraActuales();
                    }

                    const nombreParaGuardar = localStorage.getItem('userFullName') || localStorage.getItem('userName') || 'Usuario';
                    const fFecha = document.getElementById('fecha').value;
                    const fHora = document.getElementById('hora').value;
                    const fMedio = document.getElementById('medio-reporte').value.trim() || 'PENDIENTE';
                    const fDir = document.getElementById('direccion').value.trim() || 'PENDIENTE';
                    const fCol = document.getElementById('colonia').value.trim() || 'PENDIENTE';
                    const fUnidad = document.getElementById('unidad').value.trim() || 'PENDIENTE';
                    const fDesc = document.getElementById('descripcion').value.trim() || 'PENDIENTE';

                    const respuesta = await window.api.guardarFicha(
                        state.userId, fTipo, fDesc, fTipo, fUnidad, 'PENDIENTE',
                        fFecha, fHora, fMedio, fDir, fCol, 'Pendiente', nombreParaGuardar,
                        state.latSelected.toString(), state.lngSelected.toString()
                    );

                    if (respuesta.success) {
                        formFicha.reset();
                        resetearMapaFormulario();
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
    }

    window.DashboardFichas = {
        cargarFichas,
        inicializarEventosModalesYFormularios
    };
})();