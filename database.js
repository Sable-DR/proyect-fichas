const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'fichas.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Conexion exitosa a SQLite');
    crearTablas();
  }
});

function crearTablas() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        nombre_completo TEXT NOT NULL, 
        password TEXT NOT NULL,
        activo INTEGER DEFAULT 1, 
        rol TEXT DEFAULT 'user'
      )`);

    db.run(`
      CREATE TABLE IF NOT EXISTS fichas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        titulo TEXT,
        descripcion TEXT,
        tipo_auxilio TEXT,
        unidad TEXT,
        estado TEXT DEFAULT 'PENDIENTE',
        veracidad TEXT DEFAULT 'Verdadera',
        fecha TEXT,
        hora TEXT,
        medio TEXT,
        direccion TEXT,
        colonia TEXT,
        capturista TEXT,
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
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('12345', salt);
      const insertSql = "INSERT INTO usuarios (username, nombre_completo, password, rol) VALUES (?, ?, ?, ?)";
      db.run(insertSql, ['admin', 'Administrador del Sistema', hash, 'admin'], (err) => {
        if (err) {
          console.error('Error al insertar el usuario por defecto:', err.message);
        } else {
          console.log('¡Usuario admin creado! Login: admin / Pass: 12345');
        }
      });
    }
  });
}

module.exports = db;