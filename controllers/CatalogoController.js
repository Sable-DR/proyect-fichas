const CatalogoModel = require('../models/CatalogoModel');

class CatalogoController {
    static async obtenerCatalogos() {
        try {
            const unidades = await CatalogoModel.getAllUnidades();
            const auxilios = await CatalogoModel.getAllAuxilios();
            const medios = await CatalogoModel.getAllMedios();
            const colonias = await CatalogoModel.getAllColonias();

            return { success: true, unidades, auxilios, medios, colonias };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    static async agregarUnidad(event, nombre) {
        try {
            if (!nombre || nombre.trim() === '') {
                return { success: false, message: 'El nombre de la unidad es obligatorio' };
            }

            const result = await CatalogoModel.createUnidad(nombre.trim());
            return { success: true, id: result.id };
        } catch (error) {
            console.error("Error al agregar unidad:", error);
            return { success: false, message: 'Error al agregar unidad: ' + error.message };
        }
    }

    static async eliminarUnidad(event, id) {
        try {
            if (!id) {
                return { success: false, message: 'ID de unidad no válido' };
            }

            await CatalogoModel.deleteUnidad(id);
            return { success: true };
        } catch (error) {
            console.error("Error al eliminar unidad:", error);
            return { success: false, message: 'Error al eliminar unidad: ' + error.message };
        }
    }

    static async agregarAuxilio(event, nombre) {
        try {
            if (!nombre || nombre.trim() === '') {
                return { success: false, message: 'El tipo de auxilio es obligatorio' };
            }

            const result = await CatalogoModel.createAuxilio(nombre.trim());
            return { success: true, id: result.id };
        } catch (error) {
            console.error("Error al agregar auxilio:", error);
            return { success: false, message: 'Error al agregar auxilio: ' + error.message };
        }
    }

    static async eliminarAuxilio(event, id) {
        try {
            if (!id) {
                return { success: false, message: 'ID de auxilio no válido' };
            }

            await CatalogoModel.deleteAuxilio(id);
            return { success: true };
        } catch (error) {
            console.error("Error al eliminar auxilio:", error);
            return { success: false, message: 'Error al eliminar auxilio: ' + error.message };
        }
    }

    static async agregarMedio(event, nombre) {
        try {
            if (!nombre || nombre.trim() === '') {
                return { success: false, message: 'El medio de reporte es obligatorio' };
            }
            const result = await CatalogoModel.createMedio(nombre.trim());
            return { success: true, id: result.id };
        } catch (error) {
            return { success: false, message: 'Error al agregar medio: ' + error.message };
        }
    }

    static async eliminarMedio(event, id) {
        try {
            if (!id) return { success: false, message: 'ID no válido' };
            await CatalogoModel.deleteMedio(id);
            return { success: true };
        } catch (error) {
            return { success: false, message: 'Error al eliminar medio: ' + error.message };
        }
    }

    static async agregarColonia(event, nombre) {
        try {
            if (!nombre || !nombre.trim()) return { success: false, message: 'Nombre obligatorio' };
            const result = await CatalogoModel.createColonia(nombre.trim());
            return { success: true, id: result.id };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    static async eliminarColonia(event, id) {
        try {
            if (!id) return { success: false, message: 'ID no válido' };
            await CatalogoModel.deleteColonia(id);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

}

module.exports = CatalogoController;