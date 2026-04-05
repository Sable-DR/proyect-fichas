const UserModel = require('../models/UserModel');
const bcrypt = require('bcryptjs');

class AuthController {
    static async login(event, username, password) {
        try {
            const user = await UserModel.getByUsername(username);
            if (!user) {
                return { success: false, message: 'Usuario no encontrado' };
            }
            if (user.activo === 0) {
                return { success: false, message: 'Cuenta desactivada. Contacta al administrador.' };
            }

            const isMatch = bcrypt.compareSync(password, user.password);

            if (isMatch) {
                return { 
                    success: true, 
                    userId: user.id,
                    nombreCompleto: user.nombre_completo,
                    rol: user.rol
                };
            } else {
                return { success: false, message: 'Contraseña incorrecta' };
            }

        } catch (error) {
            console.error(error);
            return { success: false, message: 'Error interno del servidor' };
        }
    }

    static async obtenerUsuarios() {
        try {
            const usuarios = await UserModel.getAll();
            return { success: true, data: usuarios };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    static async editarUsuario(event, id, nuevoNombre) {
        try {
            await UserModel.updateUsername(id, nuevoNombre);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    static async cambiarPassword(event, id, nuevaPassword) {
        try {
            await UserModel.updatePassword(id, nuevaPassword);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    static async cambiarEstadoUsuario(event, id, estado) {
        try {
            await UserModel.toggleStatus(id, estado);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    static async registrar(event, username, nombreCompleto, password) {
        try {
            if (!username || !nombreCompleto || !password) {
                return { success: false, message: 'Todos los campos son obligatorios' };
            }

            const newUser = await UserModel.create(username, nombreCompleto, password);
            
            return { 
                success: true, 
                userId: newUser.id,
                nombreCompleto: nombreCompleto
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

module.exports = AuthController;