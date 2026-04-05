const db = require('../database.js');
const bcrypt = require('bcryptjs');

class UserModel {

    static getByUsername(username) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM usuarios WHERE username = ?";
            db.get(sql, [username], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    static getAll() {
        return new Promise((resolve, reject) => {
            db.all("SELECT id, username, nombre_completo, activo, rol FROM usuarios", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static updateUsername(id, newUsername) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE usuarios SET username = ? WHERE id = ?", [newUsername, id], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    static updatePassword(id, newPassword) {
        return new Promise((resolve, reject) => {
            const salt = bcrypt.genSaltSync(10);
            const passwordEncriptada = bcrypt.hashSync(newPassword, salt);

            db.run("UPDATE usuarios SET password = ? WHERE id = ?", [passwordEncriptada, id], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    static toggleStatus(id, status) {
        return new Promise((resolve, reject) => {
            db.run("UPDATE usuarios SET activo = ? WHERE id = ?", [status, id], function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    static create(username, nombreCompleto, password) {
        return new Promise((resolve, reject) => {
            const salt = bcrypt.genSaltSync(10);
            const passwordEncriptada = bcrypt.hashSync(password, salt);
            const sql = "INSERT INTO usuarios (username, nombre_completo, password) VALUES (?, ?, ?)";
            db.run(sql, [username, nombreCompleto, passwordEncriptada], function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        reject(new Error('El nombre de usuario ya está en uso.'));
                    } else {
                        reject(err);
                    }
                } else {
                    resolve({ id: this.lastID, username: username });
                }
            });
        });
    }
}

module.exports = UserModel;