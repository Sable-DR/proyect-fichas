const db = require('../database.js');

class UserModel {
    static getByUsername(username) {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM usuarios WHERE username = ?", [username], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}

module.exports = UserModel;