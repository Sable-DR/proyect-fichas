const FichaModel = require('../models/FichaModel');

class FichaController {
    static async guardarFicha(event, userId, titulo, descripcion) {
        try {
            if (!titulo || !descripcion) {
                return { success: false, message: "El título y la descripción son obligatorios" };
            }

            const result = await FichaModel.create(userId, titulo, descripcion);
            return { success: true, id: result.id };
        } catch (error) {
            console.error(error);
            return { success: false, message: 'Error interno al guardar la ficha' };
        }
    }

    static async listarFichas(event, userId) {
        try {
            const fichas = await FichaModel.getAllByUserId(userId);
            return { success: true, data: fichas };
        } catch (error) {
            console.error(error);
            return { success: false, message: 'Error al obtener la lista de fichas' };
        }
    }
}

module.exports = FichaController;