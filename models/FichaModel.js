const db = require('../database.js');

class FichaModel {
    static create(userId, titulo, desc, tipo, unidad, estado, fecha, hora, medio, dir, col, veracidad, capturista, lat, lng) {
        return new Promise((resolve, reject) => {
            const sql = `
            INSERT INTO fichas (
                user_id, titulo, descripcion, tipo_auxilio, unidad, 
                estado, fecha, hora, medio, direccion, colonia, veracidad, capturista,
                latitud, longitud
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

            const params = [
                userId, titulo, desc, tipo, unidad, estado, fecha, hora,
                medio, dir, col, veracidad, capturista, lat, lng
            ];

            db.run(sql, params, function (err) {
                if (err) {
                    console.error("Error en el modelo FichaModel:", err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM fichas ORDER BY id DESC`;
            db.all(query, [], (err, rows) => {
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