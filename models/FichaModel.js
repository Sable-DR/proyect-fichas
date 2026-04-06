const db = require('../database.js');

class FichaModel {
    static create(userId, titulo, descripcion, tipoAuxilio, unidad, estado, fecha, hora, medio, direccion, colonia, veracidad, capturista) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO fichas (
                    user_id, titulo, descripcion, tipo_auxilio, unidad, 
                    estado, fecha, hora, medio, direccion, colonia, veracidad, capturista
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `; 
            
            const params = [
                userId,
                titulo,
                descripcion,
                tipoAuxilio,
                unidad,
                estado,
                fecha,
                hora,
                medio,
                direccion,
                colonia,
                veracidad,
                capturista
            ];

            db.run(sql, params, function (err) {
                if (err) {
                    console.error("Error en SQL:", err.message);
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    static getAllByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM fichas WHERE user_id = ? ORDER BY id DESC';
            db.all(sql, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = FichaModel;