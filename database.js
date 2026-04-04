const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'fichas.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Conexion exitosa');
    crearTablas();
  }
});

function crearTablas() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS fichas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        titulo TEXT,
        descripcion TEXT,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES usuarios(id)
      )
    `);
    crearUsuarioPorDefecto();
  });
}

function crearUsuarioPorDefecto() {
  db.get("SELECT * FROM usuarios WHERE username = 'admin'", (err, row) => {
    if (err) {
      console.error(err.message);
      return;
    }
    if (!row) {
      const passwordEnTextoClaro = '12345';
      const salt = bcrypt.genSaltSync(10);
      const passwordEncriptada = bcrypt.hashSync(passwordEnTextoClaro, salt);
      const insertSql = "INSERT INTO usuarios (username, password) VALUES (?, ?)";
      db.run(insertSql, ['admin', passwordEncriptada], (err) => {
        if (err) {
          console.error('Error al insertar el usuario por defecto:', err.message);
        } else {
          console.log('¡Usuario por defecto creado exitosamente!');
          console.log('-> Usuario: admin');
          console.log('-> Contraseña: 12345');
        }
      });
    }
  });
}

module.exports = db;