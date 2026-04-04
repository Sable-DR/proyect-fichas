const db = require('../database.js');

class FichaModel {
    static create(userId, titulo, descripcion) {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO fichas (user_id, titulo, descripcion) VALUES (?, ?, ?)';
            db.run(sql, [userId, titulo, descripcion], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }
    static getAllByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM fichas WHERE user_id = ? ORDER BY fecha_creacion DESC';
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