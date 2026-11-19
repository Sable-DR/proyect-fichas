document.addEventListener('DOMContentLoaded', async () => {
    const {
        inicializarHeaderYMenu,
        setFechaHoraActuales,
        actualizarOpcionesVeracidad,
        actualizarOpcionesVeracidadEdit
    } = window.DashboardUtils;

    const { initMapaFormulario } = window.DashboardMapas;
    const { cargarCatalogosDashboard, aplicarRestriccionesCatalogos } = window.DashboardCatalogos;
    const { cargarFichas, inicializarEventosModalesYFormularios } = window.DashboardFichas;

    inicializarHeaderYMenu();
    setFechaHoraActuales();
    initMapaFormulario();

    // Cargar catálogos en memoria antes de habilitar los selectores Quick-Pick
    await cargarCatalogosDashboard();
    aplicarRestriccionesCatalogos();

    // Inicializar tarjetas, filtros y formularios
    inicializarEventosModalesYFormularios();
    await cargarFichas();

    // Listeners de veracidad
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