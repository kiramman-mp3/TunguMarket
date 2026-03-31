import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST === 'db' ? 'localhost' : (process.env.POSTGRES_HOST || 'localhost'),
  database: process.env.POSTGRES_DB || 'tungumarket',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  console.log('\n--- Creador de Administrador TunguMarket ---\n');
  
  try {
    const name = await ask('Nombre completo: ');
    const email = await ask('Correo electrónico: ');
    const password = await ask('Contraseña: ');
    const birthDate = await ask('Fecha de nacimiento (YYYY-MM-DD) [Default: 1990-01-01]: ') || '1990-01-01';

    if (!name || !email || !password) {
      console.error('\nError: Nombre, email y contraseña son obligatorios.');
      process.exit(1);
    }

    console.log('\nProcesando...');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const query = `
      INSERT INTO users (name, email, password_hash, role_id, is_verified, birth_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email;
    `;
    
    // role_id = 1 (admin), is_verified = true
    const values = [name, email, passwordHash, 1, true, birthDate];

    const { rows } = await pool.query(query, values);

    console.log('\n✅ Administrador creado exitosamente:');
    console.log(`ID: ${rows[0].id}`);
    console.log(`Email: ${rows[0].email}`);
    console.log('Rol: Administrador (1)\n');

  } catch (error) {
    if (error.code === '23505') {
      console.error('\n❌ Error: El correo electrónico ya está registrado.');
    } else {
      console.error('\n❌ Error inesperado:', error.message);
    }
  } finally {
    await pool.end();
    rl.close();
  }
}

createAdmin();
