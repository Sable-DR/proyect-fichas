const db = require('../database');

class CatalogoModel {
    static getAllUnidades() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM unidades ORDER BY nombre ASC', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static createUnidad(nombre) {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO unidades (nombre) VALUES (?)', [nombre], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    }

    static deleteUnidad(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM unidades WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    static getAllAuxilios() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM tipos_auxilio ORDER BY nombre ASC', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static createAuxilio(nombre) {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO tipos_auxilio (nombre) VALUES (?)', [nombre], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    }

    static deleteAuxilio(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM tipos_auxilio WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    static getAllMedios() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM medios_reporte ORDER BY nombre ASC', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static createMedio(nombre) {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO medios_reporte (nombre) VALUES (?)', [nombre], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    }

    static deleteMedio(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM medios_reporte WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    static getAllColonias() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM colonias ORDER BY nombre ASC', [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static createColonia(nombre) {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO colonias (nombre) VALUES (?)', [nombre], function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    }

    static deleteColonia(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM colonias WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

}

module.exports = CatalogoModel;