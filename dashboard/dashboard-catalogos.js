(() => {
    const { centrarMapaEnColonia, actualizarCoordenadasEdicion } = window.DashboardMapas;

    const catalogosMemoria = {
        unidades: [],
        auxilios: [],
        medios: [],
        colonias: []
    };

    const quickPickState = {
        targetInput: null,
        tipoCatalogo: '',
        opcionesFiltradas: [],
        selectedIndex: -1
    };

    async function cargarCatalogosDashboard() {
        const response = await window.api.obtenerCatalogos();
        if (response.success) {
            catalogosMemoria.unidades = (response.unidades || []).map(u => u.nombre);
            catalogosMemoria.auxilios = (response.auxilios || []).map(a => a.nombre);
            catalogosMemoria.medios = (response.medios || []).map(m => m.nombre);
            catalogosMemoria.colonias = (response.colonias || []).map(c => c.nombre);
        }
    }

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

        inputBusqueda.addEventListener('input', () => {
            filtrarYRenderizarQuickPick(inputBusqueda.value);
        });

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

    function cerrarQuickPick() {
        const overlay = document.getElementById('quickpick-modal');
        if (overlay) overlay.classList.remove('active');

        if (quickPickState.targetInput) {
            quickPickState.targetInput.focus();
        }
    }

    function vincularSelectorQuickPick(inputId, titulo, tipoCatalogo) {
        const input = document.getElementById(inputId);
        if (!input) return;

        input.removeAttribute('list');
        input.setAttribute('readonly', 'readonly');
        input.style.cursor = 'pointer';
        input.placeholder = `Haga clic para seleccionar ${titulo.toLowerCase()}...`;

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

    function aplicarRestriccionesCatalogos() {
        vincularSelectorQuickPick('medio-reporte', 'Medio de Reporte', 'medios');
        vincularSelectorQuickPick('colonia', 'Colonia o Comisaría', 'colonias');
        vincularSelectorQuickPick('tipo-auxilio', 'Tipo de Auxilio', 'auxilios');
        vincularSelectorQuickPick('unidad', 'Unidad que Atiende', 'unidades');

        vincularSelectorQuickPick('edit-medio-reporte', 'Medio de Reporte', 'medios');
        vincularSelectorQuickPick('edit-colonia', 'Colonia o Comisaría', 'colonias');
        vincularSelectorQuickPick('edit-tipo-auxilio', 'Tipo de Auxilio', 'auxilios');
        vincularSelectorQuickPick('edit-unidad', 'Unidad que Atiende', 'unidades');
    }

    window.DashboardCatalogos = {
        cargarCatalogosDashboard,
        abrirQuickPick,
        aplicarRestriccionesCatalogos
    };
})();