const UserModel = require('../models/UserModel');
const bcrypt = require('bcryptjs');

class AuthController {
    static async login(event, username, password) {
        try {
            const user = await UserModel.getByUsername(username);
            if (!user) {
                return { success: false, message: 'Usuario no encontrado' };
            }
            const isMatch = bcrypt.compareSync(password, user.password);

            if (isMatch) {
                return { success: true };
            } if (isMatch) {
                return { success: true, userId: user.id };
            } else {
                return { success: false, message: 'Contraseña incorrecta' };
            }

        } catch (error) {
            console.error(error);
            return { success: false, message: 'Error interno del servidor' };
        }
    }
}

module.exports = AuthController;