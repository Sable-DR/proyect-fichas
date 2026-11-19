(() => {
    const { escaparHTML, mostrarToast } = window.AdminUtils;

    let todasLasFichas = [];
    let fichasFiltradasReporte = [];
    let resumenActual = null;
    let eventosInicializados = false;

    function obtenerMesActualISO() {
        const hoy = new Date();
        const y = hoy.getFullYear();
        const m = String(hoy.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }

    function obtenerFechaFichaISO(ficha) {
        if (ficha.fecha && ficha.fecha.length >= 10) {
            return ficha.fecha.substring(0, 10);
        }
        if (ficha.fecha_creacion) {
            const d = new Date(ficha.fecha_creacion);
            if (!Number.isNaN(d.getTime())) {
                return d.toISOString().substring(0, 10);
            }
        }
        return '';
    }

    function calcularPorcentaje(parte, total) {
        if (!total) return '0.0%';
        return ((parte / total) * 100).toFixed(1) + '%';
    }

    function obtenerFranjaHoraria(horaStr) {
        if (!horaStr || !horaStr.includes(':')) return 'Sin hora registrada';
        const hora = parseInt(horaStr.split(':')[0], 10);
        if (Number.isNaN(hora)) return 'Sin hora registrada';

        if (hora >= 0 && hora <= 5) return 'Madrugada (00:00 - 05:59)';
        if (hora >= 6 && hora <= 13) return 'Mañana (06:00 - 13:59)';
        if (hora >= 14 && hora <= 21) return 'Tarde (14:00 - 21:59)';
        return 'Noche (22:00 - 23:59)';
    }

    function inicializarControlesReporte() {
        if (eventosInicializados) return;

        const selectModo = document.getElementById('reporte-modo-filtro');
        const grupoMes = document.getElementById('grupo-filtro-mes');
        const grupoRango = document.getElementById('grupo-filtro-rango');
        const inputMes = document.getElementById('reporte-mes');
        const inputInicio = document.getElementById('reporte-fecha-inicio');
        const inputFin = document.getElementById('reporte-fecha-fin');
        const btnExportar = document.getElementById('btn-exportar-estadisticas');
        const btnExportarPDF = document.getElementById('btn-exportar-pdf');
        btnExportarPDF?.addEventListener('click', exportarResumenPDF);

        if (inputMes && !inputMes.value) {
            inputMes.value = obtenerMesActualISO();
        }

        if (selectModo) {
            selectModo.addEventListener('change', () => {
                const modo = selectModo.value;
                grupoMes.style.display = modo === 'mes' ? 'flex' : 'none';
                grupoRango.style.display = modo === 'rango' ? 'flex' : 'none';
                procesarYRenderizar();
            });
        }

        inputMes?.addEventListener('change', procesarYRenderizar);
        inputInicio?.addEventListener('change', procesarYRenderizar);
        inputFin?.addEventListener('change', procesarYRenderizar);
        btnExportar?.addEventListener('click', exportarResumenCSV);

        eventosInicializados = true;
    }

    function filtrarFichasPorPeriodo() {
        const modo = document.getElementById('reporte-modo-filtro')?.value || 'mes';
        const subtitulo = document.getElementById('reporte-subtitulo-periodo');

        if (modo === 'mes') {
            const mesVal = document.getElementById('reporte-mes')?.value || obtenerMesActualISO();
            if (subtitulo) subtitulo.textContent = `Periodo consultado: Mes ${mesVal}`;
            return {
                etiqueta: mesVal,
                datos: todasLasFichas.filter(f => obtenerFechaFichaISO(f).startsWith(mesVal))
            };
        }

        if (modo === 'rango') {
            const inicio = document.getElementById('reporte-fecha-inicio')?.value || '';
            const fin = document.getElementById('reporte-fecha-fin')?.value || '';
            if (subtitulo) {
                subtitulo.textContent = (inicio || fin)
                    ? `Periodo consultado: ${inicio || 'Inicio'} al ${fin || 'Actualidad'}`
                    : 'Periodo consultado: Rango completo';
            }
            return {
                etiqueta: `${inicio || 'inicio'}_a_${fin || 'fin'}`,
                datos: todasLasFichas.filter(f => {
                    const fecha = obtenerFechaFichaISO(f);
                    if (!fecha) return false;
                    if (inicio && fecha < inicio) return false;
                    if (fin && fecha > fin) return false;
                    return true;
                })
            };
        }

        if (subtitulo) subtitulo.textContent = 'Periodo consultado: Todo el historial registrado';
        return {
            etiqueta: 'historial_completo',
            datos: [...todasLasFichas]
        };
    }

    function filaVacia(colspan, texto = 'Sin registros en este periodo.') {
        return `<tr><td colspan="${colspan}" style="text-align: center; opacity: 0.65; padding: 18px;">${texto}</td></tr>`;
    }

    function procesarYRenderizar() {
        const { etiqueta, datos } = filtrarFichasPorPeriodo();
        fichasFiltradasReporte = datos;
        const total = datos.length;

        let reales = 0;
        let falsos = 0;
        let canalizados = 0;
        let pendientes = 0;

        const mapAuxilios = new Map();
        const mapColonias = new Map();
        const mapUnidades = new Map();
        const mapMedios = new Map();
        const mapCapturistas = new Map();
        const mapHorarios = new Map([
            ['Madrugada (00:00 - 05:59)', 0],
            ['Mañana (06:00 - 13:59)', 0],
            ['Tarde (14:00 - 21:59)', 0],
            ['Noche (22:00 - 23:59)', 0],
            ['Sin hora registrada', 0]
        ]);

        datos.forEach(f => {
            const esFalsa = f.veracidad === 'Falsa';
            const esReal = f.veracidad === 'Verdadera';
            const esCanalizada = f.estado === 'CANALIZADO' || f.veracidad === 'Canalizado';
            const esPendiente = f.estado === 'PENDIENTE';
            const esCerrada = f.estado === 'LISTO' || f.estado === 'CANALIZADO';

            if (esReal) reales++;
            if (esFalsa) falsos++;
            if (esCanalizada) canalizados++;
            if (esPendiente) pendientes++;

            // 1. Tipo de Auxilio
            const aux = (f.tipo_auxilio || f.tipoAuxilio || f.titulo || 'Sin especificar').trim();
            if (!mapAuxilios.has(aux)) {
                mapAuxilios.set(aux, { nombre: aux, total: 0, reales: 0, falsos: 0, canalizados: 0, pendientes: 0 });
            }
            const itemAux = mapAuxilios.get(aux);
            itemAux.total++;
            if (esReal) itemAux.reales++;
            if (esFalsa) itemAux.falsos++;
            if (esCanalizada) itemAux.canalizados++;
            if (esPendiente) itemAux.pendientes++;

            // 2. Colonia
            const col = (f.colonia || 'Sin colonia').trim();
            if (!mapColonias.has(col)) {
                mapColonias.set(col, { nombre: col, total: 0, reales: 0, falsos: 0 });
            }
            const itemCol = mapColonias.get(col);
            itemCol.total++;
            if (esReal) itemCol.reales++;
            if (esFalsa) itemCol.falsos++;

            // 3. Unidad
            const uni = (f.unidad || 'Sin unidad').trim();
            if (!mapUnidades.has(uni)) {
                mapUnidades.set(uni, { nombre: uni, total: 0, reales: 0, falsos: 0 });
            }
            const itemUni = mapUnidades.get(uni);
            itemUni.total++;
            if (esReal) itemUni.reales++;
            if (esFalsa) itemUni.falsos++;

            // 4. Medio
            const med = (f.medio || 'Sin especificar').trim();
            mapMedios.set(med, (mapMedios.get(med) || 0) + 1);

            // 5. Franja horaria
            const franja = obtenerFranjaHoraria(f.hora);
            mapHorarios.set(franja, (mapHorarios.get(franja) || 0) + 1);

            // 6. Capturista
            const cap = (f.capturista || 'Desconocido').trim();
            if (!mapCapturistas.has(cap)) {
                mapCapturistas.set(cap, { nombre: cap, total: 0, cerradas: 0, pendientes: 0 });
            }
            const itemCap = mapCapturistas.get(cap);
            itemCap.total++;
            if (esCerrada) itemCap.cerradas++;
            if (esPendiente) itemCap.pendientes++;
        });

        // Actualizar KPIs
        document.getElementById('kpi-rep-total').textContent = total;
        document.getElementById('kpi-rep-reales').textContent = reales;
        document.getElementById('kpi-rep-reales-pct').textContent = calcularPorcentaje(reales, total);
        document.getElementById('kpi-rep-falsos').textContent = falsos;
        document.getElementById('kpi-rep-falsos-pct').textContent = calcularPorcentaje(falsos, total);
        document.getElementById('kpi-rep-canalizados').textContent = canalizados;
        document.getElementById('kpi-rep-canalizados-pct').textContent = calcularPorcentaje(canalizados, total);
        document.getElementById('kpi-rep-pendientes').textContent = pendientes;
        document.getElementById('kpi-rep-pendientes-pct').textContent = calcularPorcentaje(pendientes, total);

        const listaAuxilios = Array.from(mapAuxilios.values()).sort((a, b) => b.total - a.total);
        const listaColonias = Array.from(mapColonias.values()).sort((a, b) => b.total - a.total);
        const listaUnidades = Array.from(mapUnidades.values()).sort((a, b) => b.total - a.total);
        const listaMedios = Array.from(mapMedios.entries())
            .map(([nombre, count]) => ({ nombre, total: count }))
            .sort((a, b) => b.total - a.total);
        const listaHorarios = Array.from(mapHorarios.entries())
            .filter(([franja, count]) => franja !== 'Sin hora registrada' || count > 0)
            .map(([nombre, count]) => ({ nombre, total: count }));
        const listaCapturistas = Array.from(mapCapturistas.values()).sort((a, b) => b.total - a.total);

        resumenActual = {
            etiqueta,
            total,
            reales,
            falsos,
            canalizados,
            pendientes,
            listaAuxilios,
            listaColonias,
            listaUnidades,
            listaMedios,
            listaHorarios,
            listaCapturistas
        };

        // Renderizar tablas
        const tbodyAux = document.getElementById('tbody-rep-auxilios');
        tbodyAux.innerHTML = listaAuxilios.length
            ? listaAuxilios.map(item => `
                <tr>
                    <td><strong>${escaparHTML(item.nombre)}</strong></td>
                    <td><strong>${item.total}</strong></td>
                    <td style="color: #10b981; font-weight: 600;">${item.reales}</td>
                    <td style="color: #ef4444; font-weight: 600;">${item.falsos}</td>
                    <td>${item.canalizados}</td>
                    <td>${item.pendientes}</td>
                    <td>${calcularPorcentaje(item.total, total)}</td>
                </tr>`).join('')
            : filaVacia(7);

        const tbodyCol = document.getElementById('tbody-rep-colonias');
        tbodyCol.innerHTML = listaColonias.length
            ? listaColonias.map(item => {
                const pctNum = total ? ((item.total / total) * 100).toFixed(1) : 0;
                return `
                <tr>
                    <td><strong>${escaparHTML(item.nombre)}</strong></td>
                    <td><strong>${item.total}</strong></td>
                    <td>${item.reales}</td>
                    <td>${item.falsos}</td>
                    <td>
                        <div class="barra-mini-wrap">
                            <div class="barra-mini-bg"><div class="barra-mini-fill" style="width: ${pctNum}%;"></div></div>
                            <span style="font-size: 0.82rem; min-width: 42px;">${pctNum}%</span>
                        </div>
                    </td>
                </tr>`;
            }).join('')
            : filaVacia(5);

        const tbodyUni = document.getElementById('tbody-rep-unidades');
        tbodyUni.innerHTML = listaUnidades.length
            ? listaUnidades.map(item => `
                <tr>
                    <td><strong>${escaparHTML(item.nombre)}</strong></td>
                    <td><strong>${item.total}</strong></td>
                    <td style="color: #10b981; font-weight: 600;">${item.reales}</td>
                    <td style="color: #ef4444;">${item.falsos}</td>
                    <td>${calcularPorcentaje(item.reales, item.total)}</td>
                </tr>`).join('')
            : filaVacia(5);

        const tbodyMed = document.getElementById('tbody-rep-medios');
        tbodyMed.innerHTML = listaMedios.length
            ? listaMedios.map(item => `
                <tr>
                    <td><strong>${escaparHTML(item.nombre)}</strong></td>
                    <td><strong>${item.total}</strong></td>
                    <td>${calcularPorcentaje(item.total, total)}</td>
                </tr>`).join('')
            : filaVacia(3);

        const tbodyHor = document.getElementById('tbody-rep-horarios');
        tbodyHor.innerHTML = total > 0
            ? listaHorarios.map(item => `
                <tr>
                    <td><strong>${escaparHTML(item.nombre)}</strong></td>
                    <td><strong>${item.total}</strong></td>
                    <td>${calcularPorcentaje(item.total, total)}</td>
                </tr>`).join('')
            : filaVacia(3);

        const tbodyCap = document.getElementById('tbody-rep-capturistas');
        tbodyCap.innerHTML = listaCapturistas.length
            ? listaCapturistas.map(item => `
                <tr>
                    <td><strong>${escaparHTML(item.nombre)}</strong></td>
                    <td><strong>${item.total}</strong></td>
                    <td style="color: #10b981; font-weight: 600;">${item.cerradas}</td>
                    <td style="color: #f59e0b; font-weight: 600;">${item.pendientes}</td>
                    <td>${calcularPorcentaje(item.cerradas, item.total)}</td>
                </tr>`).join('')
            : filaVacia(5);
    }

    function escCSV(val) {
        const str = String(val ?? '').replace(/\r?\n|\r/g, ' ').trim();
        return `"${str.replace(/"/g, '""')}"`;
    }

    async function exportarResumenCSV() {
        if (!resumenActual || resumenActual.total === 0) {
            mostrarToast('No hay datos estadísticos en este periodo para exportar.', 'warning');
            return;
        }

        const r = resumenActual;
        const lineas = [];

        lineas.push(['REPORTE ESTADÍSTICO DE ACTIVIDAD', r.etiqueta].map(escCSV).join(','));
        lineas.push('');

        lineas.push(['1. INDICADORES GENERALES', 'Cantidad', 'Porcentaje'].map(escCSV).join(','));
        lineas.push(['Total de Fichas', r.total, '100%'].map(escCSV).join(','));
        lineas.push(['Reportes Reales', r.reales, calcularPorcentaje(r.reales, r.total)].map(escCSV).join(','));
        lineas.push(['Reportes Falsos', r.falsos, calcularPorcentaje(r.falsos, r.total)].map(escCSV).join(','));
        lineas.push(['Canalizados', r.canalizados, calcularPorcentaje(r.canalizados, r.total)].map(escCSV).join(','));
        lineas.push(['Pendientes', r.pendientes, calcularPorcentaje(r.pendientes, r.total)].map(escCSV).join(','));
        lineas.push('');

        lineas.push(['2. INCIDENCIA POR TIPO DE AUXILIO', 'Total', 'Reales', 'Falsos', 'Canalizados', 'Pendientes', '% del Total'].map(escCSV).join(','));
        r.listaAuxilios.forEach(i => {
            lineas.push([i.nombre, i.total, i.reales, i.falsos, i.canalizados, i.pendientes, calcularPorcentaje(i.total, r.total)].map(escCSV).join(','));
        });
        lineas.push('');

        lineas.push(['3. INCIDENCIA POR COLONIA / SECTOR', 'Total', 'Reales', 'Falsos', '% del Total'].map(escCSV).join(','));
        r.listaColonias.forEach(i => {
            lineas.push([i.nombre, i.total, i.reales, i.falsos, calcularPorcentaje(i.total, r.total)].map(escCSV).join(','));
        });
        lineas.push('');

        lineas.push(['4. PRODUCTIVIDAD POR UNIDAD', 'Total Servicios', 'Efectivos (Reales)', 'Falsos', '% Efectividad'].map(escCSV).join(','));
        r.listaUnidades.forEach(i => {
            lineas.push([i.nombre, i.total, i.reales, i.falsos, calcularPorcentaje(i.reales, i.total)].map(escCSV).join(','));
        });
        lineas.push('');

        lineas.push(['5. MEDIOS DE REPORTE', 'Total', '% del Total'].map(escCSV).join(','));
        r.listaMedios.forEach(i => {
            lineas.push([i.nombre, i.total, calcularPorcentaje(i.total, r.total)].map(escCSV).join(','));
        });
        lineas.push('');

        lineas.push(['6. DEMANDA POR FRANJA HORARIA', 'Total', '% del Total'].map(escCSV).join(','));
        r.listaHorarios.forEach(i => {
            lineas.push([i.nombre, i.total, calcularPorcentaje(i.total, r.total)].map(escCSV).join(','));
        });
        lineas.push('');

        lineas.push(['7. DESEMPEÑO POR CAPTURISTA', 'Fichas Levantadas', 'Cerradas', 'Pendientes', '% Cierre'].map(escCSV).join(','));
        r.listaCapturistas.forEach(i => {
            lineas.push([i.nombre, i.total, i.cerradas, i.pendientes, calcularPorcentaje(i.cerradas, i.total)].map(escCSV).join(','));
        });

        const contenidoCSV = '\uFEFF' + lineas.join('\r\n');
        const res = await window.api.exportarCSV(contenidoCSV, `estadisticas_actividad_${r.etiqueta}.csv`);

        if (res.canceled) return;

        if (res.success) {
            mostrarToast('Resumen estadístico exportado correctamente.');
        } else {
            mostrarToast('Error al exportar: ' + res.message, 'error');
        }
    }

    function generarHTMLReportePDF(r) {
        const subtitulo = document.getElementById('reporte-subtitulo-periodo')?.textContent || r.etiqueta;
        const generador = localStorage.getItem('userFullName') || localStorage.getItem('userName') || 'Administrador';
        const fechaEmision = new Date().toLocaleString('es-MX', {
            dateStyle: 'long',
            timeStyle: 'short'
        });

        const renderFilas = (items, colsFn, colspan) => {
            if (!items || items.length === 0) {
                return `<tr><td colspan="${colspan}" class="empty">Sin registros en este periodo.</td></tr>`;
            }
            return items.map(colsFn).join('');
        };

        return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
    @page { size: letter; margin: 14mm; }
    body {
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #1f2937;
        background: #ffffff;
        margin: 0;
        padding: 0;
        font-size: 11px;
    }
    .doc-header {
        border-bottom: 2px solid #1e3a8a;
        padding-bottom: 10px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }
    .doc-header h1 {
        margin: 0 0 4px 0;
        font-size: 18px;
        color: #1e3a8a;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .doc-header p {
        margin: 0;
        font-size: 12px;
        font-weight: 600;
        color: #374151;
    }
    .doc-meta {
        text-align: right;
        font-size: 10px;
        color: #6b7280;
        line-height: 1.4;
    }
    .kpis {
        display: flex;
        gap: 10px;
        margin-bottom: 18px;
        page-break-inside: avoid;
    }
    .kpi {
        flex: 1;
        border: 1px solid #d1d5db;
        border-top: 3px solid #2563eb;
        border-radius: 6px;
        padding: 8px 10px;
        background: #f9fafb;
    }
    .kpi.real { border-top-color: #10b981; }
    .kpi.falso { border-top-color: #ef4444; }
    .kpi.canalizado { border-top-color: #6366f1; }
    .kpi.pendiente { border-top-color: #f59e0b; }
    .kpi-t { font-size: 9px; text-transform: uppercase; color: #6b7280; font-weight: 700; }
    .kpi-v { font-size: 18px; font-weight: 800; color: #111827; margin: 2px 0; }
    .kpi-p { font-size: 10px; color: #4b5563; }

    .seccion {
        margin-bottom: 16px;
        page-break-inside: avoid;
    }
    .seccion h2 {
        font-size: 12px;
        text-transform: uppercase;
        color: #1e3a8a;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 4px;
        margin: 0 0 8px 0;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10.5px;
    }
    th {
        background: #f1f5f9;
        color: #1e293b;
        text-align: left;
        padding: 6px 8px;
        border: 1px solid #cbd5e1;
        font-size: 9.5px;
        text-transform: uppercase;
    }
    td {
        padding: 5px 8px;
        border: 1px solid #e2e8f0;
    }
    tr:nth-child(even) td { background: #f8fafc; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .verde { color: #059669; font-weight: 600; }
    .rojo { color: #dc2626; font-weight: 600; }
    .ambar { color: #d97706; font-weight: 600; }
    .empty { text-align: center; color: #6b7280; padding: 10px; }
    .grid-2 {
        display: flex;
        gap: 14px;
        margin-bottom: 16px;
        page-break-inside: avoid;
    }
    .grid-2 > .seccion {
        flex: 1;
        margin-bottom: 0;
    }
</style>
</head>
<body>
    <div class="doc-header">
        <div>
            <h1>Reporte Estadístico de Actividad</h1>
            <p>${escaparHTML(subtitulo)}</p>
        </div>
        <div class="doc-meta">
            <div><strong>Emitido:</strong> ${escaparHTML(fechaEmision)}</div>
            <div><strong>Generado por:</strong> ${escaparHTML(generador)}</div>
        </div>
    </div>

    <div class="kpis">
        <div class="kpi">
            <div class="kpi-t">Total de Fichas</div>
            <div class="kpi-v">${r.total}</div>
            <div class="kpi-p">100.0%</div>
        </div>
        <div class="kpi real">
            <div class="kpi-t">Reportes Reales</div>
            <div class="kpi-v">${r.reales}</div>
            <div class="kpi-p">${calcularPorcentaje(r.reales, r.total)}</div>
        </div>
        <div class="kpi falso">
            <div class="kpi-t">Reportes Falsos</div>
            <div class="kpi-v">${r.falsos}</div>
            <div class="kpi-p">${calcularPorcentaje(r.falsos, r.total)}</div>
        </div>
        <div class="kpi canalizado">
            <div class="kpi-t">Canalizados</div>
            <div class="kpi-v">${r.canalizados}</div>
            <div class="kpi-p">${calcularPorcentaje(r.canalizados, r.total)}</div>
        </div>
        <div class="kpi pendiente">
            <div class="kpi-t">Pendientes</div>
            <div class="kpi-v">${r.pendientes}</div>
            <div class="kpi-p">${calcularPorcentaje(r.pendientes, r.total)}</div>
        </div>
    </div>

    <div class="seccion">
        <h2>1. Incidencia por Tipo de Auxilio</h2>
        <table>
            <thead>
                <tr>
                    <th>Tipo de Auxilio</th>
                    <th class="num">Total</th>
                    <th class="num">Reales</th>
                    <th class="num">Falsos</th>
                    <th class="num">Canalizados</th>
                    <th class="num">Pendientes</th>
                    <th class="num">% Total</th>
                </tr>
            </thead>
            <tbody>
                ${renderFilas(r.listaAuxilios, i => `
                    <tr>
                        <td><strong>${escaparHTML(i.nombre)}</strong></td>
                        <td class="num"><strong>${i.total}</strong></td>
                        <td class="num verde">${i.reales}</td>
                        <td class="num rojo">${i.falsos}</td>
                        <td class="num">${i.canalizados}</td>
                        <td class="num">${i.pendientes}</td>
                        <td class="num">${calcularPorcentaje(i.total, r.total)}</td>
                    </tr>`, 7)}
            </tbody>
        </table>
    </div>

    <div class="seccion">
        <h2>2. Incidencia por Colonia / Sector</h2>
        <table>
            <thead>
                <tr>
                    <th>Colonia / Sector</th>
                    <th class="num">Total</th>
                    <th class="num">Reales</th>
                    <th class="num">Falsos</th>
                    <th class="num">Participación</th>
                </tr>
            </thead>
            <tbody>
                ${renderFilas(r.listaColonias, i => `
                    <tr>
                        <td><strong>${escaparHTML(i.nombre)}</strong></td>
                        <td class="num"><strong>${i.total}</strong></td>
                        <td class="num">${i.reales}</td>
                        <td class="num">${i.falsos}</td>
                        <td class="num">${calcularPorcentaje(i.total, r.total)}</td>
                    </tr>`, 5)}
            </tbody>
        </table>
    </div>

    <div class="seccion">
        <h2>3. Productividad por Unidad</h2>
        <table>
            <thead>
                <tr>
                    <th>Unidad</th>
                    <th class="num">Servicios</th>
                    <th class="num">Efectivos</th>
                    <th class="num">Falsos</th>
                    <th class="num">% Efectividad</th>
                </tr>
            </thead>
            <tbody>
                ${renderFilas(r.listaUnidades, i => `
                    <tr>
                        <td><strong>${escaparHTML(i.nombre)}</strong></td>
                        <td class="num"><strong>${i.total}</strong></td>
                        <td class="num verde">${i.reales}</td>
                        <td class="num rojo">${i.falsos}</td>
                        <td class="num">${calcularPorcentaje(i.reales, i.total)}</td>
                    </tr>`, 5)}
            </tbody>
        </table>
    </div>

    <div class="grid-2">
        <div class="seccion">
            <h2>4. Canales de Entrada (Medio)</h2>
            <table>
                <thead>
                    <tr>
                        <th>Medio de Reporte</th>
                        <th class="num">Total</th>
                        <th class="num">% Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderFilas(r.listaMedios, i => `
                        <tr>
                            <td><strong>${escaparHTML(i.nombre)}</strong></td>
                            <td class="num"><strong>${i.total}</strong></td>
                            <td class="num">${calcularPorcentaje(i.total, r.total)}</td>
                        </tr>`, 3)}
                </tbody>
            </table>
        </div>

        <div class="seccion">
            <h2>5. Demanda por Franja Horaria</h2>
            <table>
                <thead>
                    <tr>
                        <th>Franja Horaria</th>
                        <th class="num">Total</th>
                        <th class="num">% Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderFilas(r.total > 0 ? r.listaHorarios : [], i => `
                        <tr>
                            <td><strong>${escaparHTML(i.nombre)}</strong></td>
                            <td class="num"><strong>${i.total}</strong></td>
                            <td class="num">${calcularPorcentaje(i.total, r.total)}</td>
                        </tr>`, 3)}
                </tbody>
            </table>
        </div>
    </div>

    <div class="seccion">
        <h2>6. Desempeño por Capturista</h2>
        <table>
            <thead>
                <tr>
                    <th>Capturista</th>
                    <th class="num">Fichas Levantadas</th>
                    <th class="num">Cerradas</th>
                    <th class="num">Pendientes</th>
                    <th class="num">% Cierre</th>
                </tr>
            </thead>
            <tbody>
                ${renderFilas(r.listaCapturistas, i => `
                    <tr>
                        <td><strong>${escaparHTML(i.nombre)}</strong></td>
                        <td class="num"><strong>${i.total}</strong></td>
                        <td class="num verde">${i.cerradas}</td>
                        <td class="num ambar">${i.pendientes}</td>
                        <td class="num">${calcularPorcentaje(i.cerradas, i.total)}</td>
                    </tr>`, 5)}
            </tbody>
        </table>
    </div>
</body>
</html>`;
    }

    async function exportarResumenPDF() {
        if (!resumenActual || resumenActual.total === 0) {
            mostrarToast('No hay datos estadísticos en este periodo para exportar.', 'warning');
            return;
        }

        const htmlPDF = generarHTMLReportePDF(resumenActual);
        const res = await window.api.exportarPDF(htmlPDF, `estadisticas_actividad_${resumenActual.etiqueta}.pdf`);

        if (res.canceled) return;

        if (res.success) {
            mostrarToast('Reporte PDF guardado correctamente.');
        } else {
            mostrarToast('Error al generar PDF: ' + res.message, 'error');
        }
    }

    async function cargarEstadisticas() {
        inicializarControlesReporte();

        const userId = localStorage.getItem('userId');
        const respuesta = await window.api.obtenerFichas(userId);

        if (respuesta.success) {
            todasLasFichas = respuesta.data || [];
            procesarYRenderizar();
        } else {
            mostrarToast('Error al cargar fichas para estadísticas: ' + respuesta.message, 'error');
        }
    }

    window.AdminEstadisticas = {
        cargarEstadisticas
    };
})();