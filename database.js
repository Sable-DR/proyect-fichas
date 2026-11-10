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
    // Tabla Usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        nombre_completo TEXT NOT NULL, 
        password TEXT NOT NULL,
        activo INTEGER DEFAULT 1, 
        rol TEXT DEFAULT 'user'
      )`);

    // Tabla Fichas
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
        latitud TEXT,        
        longitud TEXT,        
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES usuarios(id)
      )
    `);

    // Tabla Unidades
    db.run(`
      CREATE TABLE IF NOT EXISTS unidades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
      )
    `);

    // Tabla Tipos de Auxilio
    db.run(`
      CREATE TABLE IF NOT EXISTS tipos_auxilio (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
      )
    `);

    // Tabla Tipos de Medio
    db.run(`
      CREATE TABLE IF NOT EXISTS medios_reporte (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
      )
    `);

    // Tabla Tipos de Colonias
    db.run(`
      CREATE TABLE IF NOT EXISTS colonias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE
      )
    `);

    crearUsuarioPorDefecto();
    precargarCatalogos();
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

function precargarCatalogos() {

  const unidades = ['AMBULANCIA DE TRASLADO 673',
    'AMBULANCIA DE TRASLADO 094',
    'VM001',
    'VM002',
    'CRP-048',
    'CRP-049',
    'CRP-1513',
    'CRP-1458',
    'CRP-1460',
    'CRP-1524',
    'CRP-1525',
    'CRP-460',
    'CRP-470',
    'CRP-471',
    'CRP-472',
    'CRP-495',
    'CRP-496',
    'CRP-00',
    'CRP-001',
    'CRP-002',
    'CRP-003',
    'CRP-004',
    'CRP-005',
    'CRP-006',
    'CRP-007',
    'CRP-008',
    'CRP-009',
    'CRP-010',
    'CRP-011',
    'MT-046',
    'MT-047',
    'MT-050',
    'MT-051',
    'MT-052',
    'MT-4004',
    'MT-4005',
    'CRP-741',
    'CRP-742',
    'CRP-743',
    'CRP-744',
    'CRP-745',
    'CRP-746',
    'CRP-747',
    'CRP-762',
    'CRP-763',
    'CRP-764',
    'PM-01',
    'PM-02',
    'PM-03',
    'PM-04',
    'PM-05',
    'PM-06',
    'PM-07',
    'PM-08',
    'PM-09',
    'PM-10',
    'MV-01',
    'MV-02',
    'MV-03',
    'MV-04',
    'MV-05',
    'MV-06',
    'MV-07',
    'MV-08',
    'MV-09',
    'MV-10',
    'MV-11',
    'MV-12',
    'MV-13',
    'MV-14',
    'MV-15',
    'MV-16',
    'MV-17',
    'MV-18',
    'MV-19',
    'MV-20'];
  const stmtUnidad = db.prepare("INSERT OR IGNORE INTO unidades (nombre) VALUES (?)");
  unidades.forEach((u) => stmtUnidad.run(u));
  stmtUnidad.finalize();

  const auxilios = ['Abuso de confianza',
    'Abuso sexual',
    'Activacion de alarma',
    'Activacion de alerta AMBER',
    'Activacion de Protocolo Alba',
    'Actos inmorales',
    'Agresion fisica',
    'Agresion física con lesiones',
    'Allanamiento de morada ',
    'Animal agresivo',
    'Animal suelto',
    'Apoyo',
    'Apoyo a agua potable',
    'Apoyo a cortejo funebre',
    'Apoyo a pagos',
    'Apoyo a peregrinacion',
    'Apoyo a vias terrestres',
    'Apoyo de custodia',
    'Apoyo de seguridad a evento',
    'Arbol a punto de caer',
    'Arbol caido',
    'Atencion ciudadana',
    'Atropellamiento',
    'Banqueta en mal estado',
    'Bicicleta abandonada',
    'Boleta de infraccion',
    'Cables caidos',
    'Cables chispeando',
    'Cables reventados',
    'Calle en mal estado',
    'Calle inundada',
    'Casa inundada',
    'Cierre de calle',
    'Clandestino',
    'Clausura de establecimiento',
    'Conductor ebrio',
    'Consumo de droga en via publica',
    'Consumo de embriagantes en via publica',
    'Convoy coordinado',
    'Convoy preventivo',
    'Daños a propiedad ajena',
    'Derrapamiento con heridos',
    'Derrapamiento sin heridos',
    'Derrumbe',
    'Desactivacion de alerta AMBER',
    'Detenido',
    'Detenido en comisaria',
    'Detonaciones',
    'Ebrio escandalizando',
    'Elecciones',
    'Enjambre de abejas',
    'Escombro en via publica',
    'Extravio de pertenencias',
    'Extravio de placas',
    'Faltas a la moral',
    'Fraude',
    'Fuga de agua',
    'Fuga de gas',
    'Hallazgo de osamenta',
    'Hecho de transito',
    'Incendio',
    'Incendio de maleza',
    'Intento de robo',
    'Intento de suicidio',
    'Intento de violacion',
    'Labor social',
    'Llamada de engaño',
    'Maltrato animal',
    'Maltrato de menores',
    'Manifestacion',
    'Menor deambulando',
    'Menor extraviado',
    'Mensajes de amenazas',
    'Mordedura de animal',
    'Motocicleta abandonada',
    'Motocicleta con reporte de robo recuperada',
    'Musica en alto volumen',
    'Objeto recuperado',
    'Operativo de alcoholimetria',
    'Operativo de seguridad y vigilancia',
    'Operativo radar',
    'Otros servicios',
    'Persona en actitud evasiva',
    'Persona en situacion de abandono',
    'Persona exibicionista',
    'Persona extraviada',
    'Persona fallecida',
    'Persona impertinente',
    'Persona Localizada',
    'Persona tirada en la via publica',
    'Personas arriba de un techo',
    'Personas escandalizando',
    'Picadura de animal',
    'Poste a punto de caer',
    'Poste caido',
    'Prevencion al delito',
    'Proximidad social',
    'Puesto de inspeccion vehicular',
    'Quema de basura',
    'Quema de maleza',
    'Ramas caidas',
    'Reventando bombitas',
    'Riña',
    'Robo',
    'Robo a casa habitacion',
    'Robo a comercio',
    'Robo a transeunte',
    'Robo bagatela',
    'Robo con detenido',
    'Robo de motocicleta',
    'Robo de pertenencias',
    'Robo pasado',
    'Robo por descuido',
    'Robo sin detenido',
    'Robo de vehiculo',
    'Robo de bicicleta',
    'Ruido excesivo',
    'Ruidos extraños',
    'Salida de vehiculo de la carretera',
    'Secuestro',
    'Servicio de ambulancia',
    'Sin energia electrica',
    'Suicidio',
    'Sustraccion de menor',
    'Timacion',
    'Trasformador en corto circuito',
    'Traslado y custodia',
    'Valoracion por paramedico',
    'Vehiculo abandonado',
    'Vehiculo con reporte de robo recuperado',
    'Vehiculo en actitud evasiva',
    'Vehiculo en exceso de velocidad ',
    'Vehiculo mal estacionado',
    'Venta de droga',
    'Verificacion de persona',
    'Verificacion de proteccion emergente',
    'Verificacion de vehiculo',
    'Viaje de comision',
    'Vigilancia',
    'Violacion',
    'Violencia de genero'];
  const stmtAuxilio = db.prepare("INSERT OR IGNORE INTO tipos_auxilio (nombre) VALUES (?)");
  auxilios.forEach((a) => stmtAuxilio.run(a));
  stmtAuxilio.finalize();

  const medios = ['C5 via radio',
    'C5 via telefonica',
    'Via telefonica - Femenina',
    'Via telefonica - Masculino',
    'Anonimo Via telefonica - Femenina',
    'Anonimo Via telefonica - Masculino',
    'Unidad via radio',
    'Unidad via radio - Ademan de alto',
    'Elemento Policial via radio',
    'Elemento Policial via telefonica',
    'Femenina a elemento policial',
    'Masculino a elemento policial',
    'Base Venado via radio',
    'Base Venado via telefonica'];
  const stmtMedios = db.prepare("INSERT OR IGNORE INTO medios_reporte (nombre) VALUES (?)");
  medios.forEach((m) => stmtMedios.run(m));
  stmtMedios.finalize();

  const coloniasIniciales = ['Avenida 4 de Junio',
    'Avenida Victor Cervera Pacheco',
    'Avenida Zacihual',
    'Avenida de los Frailes',
    'Colonia Bacalar',
    'Colonia Candelaria',
    'Colonia Centro',
    'Colonia Chen Ake',
    'Colonia Chiveros',
    'Colonia Chunhuas',
    'Colonia Cruz Verde',
    'Calzada de los Frailes',
    'Colonia Emiliano Zapata',
    'Colonia Esmeralda',
    'Colonia Exaviacion',
    'Colonia Fernando Novelo',
    'Colonia Flor Campestre',
    'Colonia Juan Pablo II',
    'Colonia Militar',
    'Colonia Oaxaqueña',
    'Colonia Residencial Campestre',
    'Colonia San Antonio',
    'Colonia San Carlos',
    'Colonia San Francisco',
    'Colonia San Juan',
    'Colonia San Vicente',
    'Colonia Santa Ana',
    'Colonia Santa Barbara',
    'Colonia Santa Lucia',
    'Colonia Sisal',
    'Colonia Xlapac',
    'Colonia Zaciabil',
    'Campestre Pedregal',
    'Ejido Zaciabil',
    'Fraccionamiento Colonos',
    'Fraccionamiento Cupules',
    'Fraccionamiento Esmeraldas',
    'Fraccionamiento Flamboyanes',
    'Fraccionamiento Flor Campestre',
    'Fraccionamiento Girasoles',
    'Fraccionamiento Jardines de San Francisco',
    'Fraccionamiento Jardines De Oriente',
    'Fraccionamiento Las Palmas',
    'Fraccionamiento Las Palmas 2',
    'Fraccionamiento Lol-beh',
    'Fraccionamiento Cipreses',
    'Fraccionamiento Orquideas',
    'Fraccionamiento Puesta Del Sol',
    'Fraccionamiento R. Bonilla',
    'Fraccionamiento Residencial del Bosque',
    'Fraccionamiento San Isidro',
    'Fraccionamiento San Isidro 2',
    'Fraccionamiento Santa Cruz',
    'Fraccionamiento Nueva Xcorazon',
    'Fraccionamiento Vista Alegre',
    'Fraccionamiento XCorazon',
    'Fraccionamiento Zaciabil',
    'Fraccionamiento Infonavit',
    'Unidad habitacional Militar',
    'Merida',
    'Bolmay',
    'Campamento Hidalgo',
    'Chamul',
    'Chanyokdzonot 1',
    'Chanyokdzonot 2',
    'Dzibil',
    'Dzitnup',
    'Dzodzilchen',
    'Ebtun',
    'Kanxoc',
    'Koopchen',
    'Nohsuytun',
    'Pixoy',
    'Popola',
    'Punta Laguna',
    'San Andres X-Bac',
    'San Vicente',
    'Santa Eleuteria',
    'Santa Rosa',
    'Sidra Kin',
    'Tahmuy',
    'Tesoco',
    'X-Batun',
    'Tepakan',
    'Tikuch',
    'Timas',
    'Tixhualactun',
    'Uspib',
    'X-Bacab',
    'X-Cohuo',
    'X-Kampepem',
    'Xocen',
    'Xuilub',
    'Yaax-Hal',
    'Yalcoba',
    'Yalcon',
    'Yaxche'];
  const stmtColonia = db.prepare("INSERT OR IGNORE INTO colonias (nombre) VALUES (?)");
  coloniasIniciales.forEach((c) => stmtColonia.run(c));
  stmtColonia.finalize();

}

module.exports = db;






