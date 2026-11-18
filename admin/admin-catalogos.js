(() => {
    const { escaparHTML, mostrarToast, confirmarAccion } = window.AdminUtils;

    const CATALOGOS_CONFIG = {
        unidades: {
            titulo: 'Unidades',
            placeholder: 'Ej. Ambulancia 02',
            vacioMsg: 'Ingresa un nombre para la unidad.',
            okMsg: 'Unidad agregada.',
            etiquetaEliminar: 'esta unidad',
            addFn: (nombre) => window.api.agregarUnidad(nombre),
            delFn: (id) => window.api.eliminarUnidad(id)
        },
        auxilios: {
            titulo: 'Tipos de Auxilio',
            placeholder: 'Ej. Extravío',
            vacioMsg: 'Ingresa un tipo de auxilio.',
            okMsg: 'Tipo de auxilio agregado.',
            etiquetaEliminar: 'este tipo de auxilio',
            addFn: (nombre) => window.api.agregarAuxilio(nombre),
            delFn: (id) => window.api.eliminarAuxilio(id)
        },
        medios: {
            titulo: 'Medios de Reporte',
            placeholder: 'Ej. Redes Sociales',
            vacioMsg: 'Ingresa un medio de reporte.',
            okMsg: 'Medio de reporte agregado.',
            etiquetaEliminar: 'este medio',
            addFn: (nombre) => window.api.agregarMedio(nombre),
            delFn: (id) => window.api.eliminarMedio(id)
        },
        colonias: {
            titulo: 'Colonias / Sectores',
            placeholder: 'Ej. Sector Norte',
            vacioMsg: 'Ingresa el nombre de la colonia o sector.',
            okMsg: 'Colonia/sector agregado.',
            etiquetaEliminar: 'esta colonia/sector',
            addFn: (nombre) => window.api.agregarColonia(nombre),
            delFn: (id) => window.api.eliminarColonia(id)
        }
    };

    let catalogoActivo = 'unidades';
    let datosCatalogos = { unidades: [], auxilios: [], medios: [], colonias: [] };

    const selectorGrid = document.getElementById('selector-catalogos');
    const tituloActivo = document.getElementById('titulo-catalogo-activo');
    const inputNuevo = document.getElementById('input-nuevo-catalogo');
    const btnAgregar = document.getElementById('btn-add-catalogo');
    const inputFiltro = document.getElementById('filtro-catalogo');
    const listaActiva = document.getElementById('lista-catalogo-activo');

    function actualizarContadores() {
        Object.keys(CATALOGOS_CONFIG).forEach(key => {
            const el = document.getElementById(`count-${key}`);
            const total = (datosCatalogos[key] || []).length;
            if (el) el.textContent = `${total} ${total === 1 ? 'registro' : 'registros'}`;
        });
    }

    function renderizarCatalogoActivo() {
        const cfg = CATALOGOS_CONFIG[catalogoActivo];
        if (!cfg) return;

        tituloActivo.textContent = cfg.titulo;
        inputNuevo.placeholder = cfg.placeholder;

        const termino = inputFiltro.value.trim().toLowerCase();
        const items = (datosCatalogos[catalogoActivo] || []).filter(item =>
            item.nombre.toLowerCase().includes(termino)
        );

        listaActiva.innerHTML = '';

        if (items.length === 0) {
            listaActiva.innerHTML = '<li style="justify-content: center; opacity: 0.7; border: none;">No hay elementos para mostrar.</li>';
            return;
        }

        items.forEach(item => {
            const li = document.createElement('li');
            const nombreSeguro = escaparHTML(item.nombre);
            li.innerHTML = `
                <span>${nombreSeguro}</span>
                <button type="button" class="btn-action btn-disable" data-accion="eliminar-catalogo" data-id="${item.id}" data-nombre="${nombreSeguro}">Eliminar</button>
            `;
            listaActiva.appendChild(li);
        });
    }

    async function cargarCatalogosAdmin() {
        const response = await window.api.obtenerCatalogos();
        if (response.success) {
            datosCatalogos = {
                unidades: response.unidades || [],
                auxilios: response.auxilios || [],
                medios: response.medios || [],
                colonias: response.colonias || []
            };
            actualizarContadores();
            renderizarCatalogoActivo();
        } else {
            mostrarToast('Error al cargar los catálogos.', 'error');
        }
    }

    // Cambiar de catálogo al hacer clic en una tarjeta
    selectorGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.catalogo-card-btn');
        if (!card) return;

        selectorGrid.querySelectorAll('.catalogo-card-btn').forEach(b => b.classList.remove('active'));
        card.classList.add('active');

        catalogoActivo = card.dataset.catalogo;
        inputFiltro.value = '';
        inputNuevo.value = '';
        renderizarCatalogoActivo();
        inputNuevo.focus();
    });

    // Filtro en tiempo real
    inputFiltro.addEventListener('input', renderizarCatalogoActivo);

    // Alta de registro en el catálogo activo
    async function ejecutarAlta() {
        const cfg = CATALOGOS_CONFIG[catalogoActivo];
        const nombre = inputNuevo.value.trim();

        if (!nombre) {
            mostrarToast(cfg.vacioMsg, 'warning');
            inputNuevo.focus();
            return;
        }

        const res = await cfg.addFn(nombre);
        if (res.success) {
            inputNuevo.value = '';
            inputNuevo.focus();
            mostrarToast(cfg.okMsg);
            cargarCatalogosAdmin();
        } else {
            mostrarToast('Error: ' + res.message, 'error');
        }
    }

    btnAgregar.addEventListener('click', ejecutarAlta);
    inputNuevo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') ejecutarAlta();
    });

    // Eliminación de registro en el catálogo activo
    listaActiva.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-accion="eliminar-catalogo"]');
        if (!btn) return;

        const cfg = CATALOGOS_CONFIG[catalogoActivo];
        const { id, nombre } = btn.dataset;

        const confirmado = await confirmarAccion({
            titulo: 'Eliminar del catálogo',
            mensaje: `¿Deseas eliminar ${cfg.etiquetaEliminar} ("${nombre}")?`,
            btnTexto: 'Eliminar',
            btnColor: '#ef4444'
        });

        if (confirmado) {
            const res = await cfg.delFn(id);
            if (res.success) {
                mostrarToast('Elemento eliminado del catálogo.');
                cargarCatalogosAdmin();
            } else {
                mostrarToast('Error: ' + res.message, 'error');
            }
        }
    });

    window.AdminCatalogos = { cargarCatalogosAdmin };
})();