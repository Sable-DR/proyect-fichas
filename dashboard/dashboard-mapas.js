(() => {
    const state = window.DashboardState;

    let mapForm = null;
    let markerForm = null;
    let mapEdit = null;
    let markerEdit = null;

    function initMapaFormulario() {
        const contenedor = document.getElementById('map-formulario');
        if (!contenedor || mapForm) return;

        mapForm = L.map('map-formulario').setView([state.latSelected, state.lngSelected], 14);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(mapForm);

        markerForm = L.marker([state.latSelected, state.lngSelected], {
            draggable: true
        }).addTo(mapForm);

        markerForm.on('dragend', () => {
            const position = markerForm.getLatLng();
            state.latSelected = position.lat;
            state.lngSelected = position.lng;
        });
    }

    function resetearMapaFormulario() {
        state.latSelected = 20.6896;
        state.lngSelected = -88.2015;
        if (markerForm && mapForm) {
            markerForm.setLatLng([state.latSelected, state.lngSelected]);
            mapForm.setView([state.latSelected, state.lngSelected], 14);
        }
    }

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

            markerEdit.on('dragend', () => {
                const posicion = markerEdit.getLatLng();
                if (state.fichaEditandoActual) {
                    state.fichaEditandoActual.latitud = posicion.lat.toString();
                    state.fichaEditandoActual.longitud = posicion.lng.toString();
                }
            });
        } else {
            markerEdit.setLatLng([latNum, lngNum]);
            mapEdit.setView([latNum, lngNum], zoomNivel);
        }

        setTimeout(() => {
            if (mapEdit) mapEdit.invalidateSize();
        }, 100);
    }

    async function geocodificarColonia(nombreColonia) {
        const nombreLimpio = nombreColonia
            .replace(/^(comisaria|comisaría)\s+(de\s+)?/i, '')
            .trim();

        const busqueda = encodeURIComponent(`${nombreLimpio}, Valladolid, Yucatán`);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${busqueda}&limit=1`;

        const respuesta = await fetch(url);
        const resultados = await respuesta.json();

        if (resultados && resultados.length > 0) {
            return {
                lat: parseFloat(resultados[0].lat),
                lng: parseFloat(resultados[0].lon)
            };
        }
        return null;
    }

    async function centrarMapaEnColonia(nombreColonia) {
        if (!nombreColonia.trim()) return;

        try {
            const coords = await geocodificarColonia(nombreColonia);
            if (coords) {
                state.latSelected = coords.lat;
                state.lngSelected = coords.lng;
                if (markerForm && mapForm) {
                    markerForm.setLatLng([coords.lat, coords.lng]);
                    mapForm.setView([coords.lat, coords.lng], 15);
                }
            } else {
                console.warn(`No se encontró la ubicación exacta de: ${nombreColonia}`);
            }
        } catch (error) {
            console.error('Error al conectar con el servicio de mapas:', error);
        }
    }

    async function actualizarCoordenadasEdicion(nombreColonia) {
        if (!nombreColonia.trim() || !state.fichaEditandoActual) return;

        try {
            const coords = await geocodificarColonia(nombreColonia);
            if (coords) {
                state.fichaEditandoActual.latitud = coords.lat.toString();
                state.fichaEditandoActual.longitud = coords.lng.toString();

                if (mapEdit && markerEdit) {
                    markerEdit.setLatLng([coords.lat, coords.lng]);
                    mapEdit.setView([coords.lat, coords.lng], 15);
                }
            }
        } catch (error) {
            console.error('Error al actualizar coordenadas en edición:', error);
        }
    }

    window.DashboardMapas = {
        initMapaFormulario,
        resetearMapaFormulario,
        initOCentrarMapaEdicion,
        centrarMapaEnColonia,
        actualizarCoordenadasEdicion
    };
})();