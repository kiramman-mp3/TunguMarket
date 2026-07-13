import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno (útil si se corre por fuera de Docker)
dotenv.config(); 
dotenv.config({ path: path.join(__dirname, '../../.env') }); 
dotenv.config({ path: path.join(__dirname, '../../../.env') }); 

const { Pool } = pg;

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {
        user: process.env.POSTGRES_USER || 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_DB || 'tungumarket',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      }
);

const testUsers = [
  {
    name: 'Admin Tungu',
    email: 'admin@tungumarket.com',
    password: 'password123',
    birthDate: '1990-01-01',
    role_id: 1, // Admin
    is_verified: true,
    is_banned: false
  },
  {
    name: 'Usuario Prueba',
    email: 'usuario@prueba.com',
    password: 'password123',
    birthDate: '1995-05-15',
    role_id: 2, // Usuario General
    is_verified: true,
    is_banned: false
  },
  {
    name: 'Vendedor Baneado',
    email: 'baneado@prueba.com',
    password: 'password123',
    birthDate: '1985-10-20',
    role_id: 2,
    is_verified: true,
    is_banned: true
  },
  {
    name: 'Vendedor Quero',
    email: 'vendedor@quero.com',
    password: 'password123',
    birthDate: '1988-03-12',
    role_id: 2,
    is_verified: true,
    is_banned: false
  },
  {
    name: 'Comprador Ambato',
    email: 'comprador@ambato.com',
    password: 'password123',
    birthDate: '1992-07-25',
    role_id: 2,
    is_verified: true,
    is_banned: false
  },
  {
    name: 'Prueba Tungurahua',
    email: 'test@tungurahua.com',
    password: 'password123',
    birthDate: '2000-01-01',
    role_id: 2,
    is_verified: true,
    is_banned: false
  }
];

const seedUsers = async () => {
  const client = await pool.connect();
  try {
    console.log('--- Insertando Usuarios de Prueba ---');
    
    for (const user of testUsers) {
      // Verificar si ya existe
      const existRes = await client.query('SELECT email FROM users WHERE email = $1', [user.email]);
      if (existRes.rows.length > 0) {
        console.log(`⚠️  El usuario ${user.email} ya existe. Saltando...`);
        continue;
      }

      // Hashear contraseña
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(user.password, salt);

      // Insertar en Base de Datos
      const query = `
        INSERT INTO users (name, email, password_hash, birth_date, role_id, is_verified, is_banned)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, email, role_id, is_verified, is_banned
      `;
      const values = [
        user.name, 
        user.email, 
        passwordHash, 
        user.birthDate, 
        user.role_id, 
        user.is_verified, 
        user.is_banned
      ];
      
      const { rows } = await client.query(query, values);
      
      console.log('✅ Usuario Creado:');
      console.table(rows[0]);
    }

    console.log('--- Proceso Finalizado ---');
    console.log('Puedes usar estas credenciales para probar (Contraseña para todos: password123)');
    console.table(testUsers.map(u => ({ Email: u.email, Rol: u.role_id === 1 ? 'Admin' : 'General', Estado: u.is_banned ? 'Baneado' : 'Activo' })));

  } catch (err) {
    console.error('❌ Error insertando usuarios test:', err);
  } finally {
    client.release();
    await pool.end();
  }
};

seedUsers();
