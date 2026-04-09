import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from environment or fallback to files
dotenv.config(); // Usually handled by Docker
dotenv.config({ path: path.join(__dirname, '../../.env') }); // Root level of backend
dotenv.config({ path: path.join(__dirname, '../../../.env') }); // Project root

const { Pool } = pg;

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'tungumarket',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('--- Initializing Database Structure ---');

    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Clean up existing tables to ensure schema matches
    console.log('Cleaning up existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS carts CASCADE;
      DROP TABLE IF EXISTS password_resets CASCADE;
      DROP TABLE IF EXISTS login_logs CASCADE;
      DROP TABLE IF EXISTS verification_tokens CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS product_images CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS roles CASCADE;
    `);

    // Roles Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      );
    `);

    // Insert Default Roles
    await client.query(`
      INSERT INTO roles (name) VALUES ('admin'), ('usuario_general')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        firebase_uid VARCHAR(128) UNIQUE, -- For Google/Firebase Auth
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255), -- Nullable for Google Auth users
        birth_date DATE, -- Required for age validation (>= 18)
        role_id INTEGER REFERENCES roles(id),
        is_verified BOOLEAN DEFAULT FALSE,
        is_banned BOOLEAN DEFAULT FALSE,
        login_attempts INTEGER DEFAULT 0,
        last_attempt TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Sessions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        device_info TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Login Logs Table (History)
    await client.query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        email VARCHAR(150),
        ip_address VARCHAR(45),
        device_info TEXT,
        status VARCHAR(20), -- 'success', 'failure'
        message TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Password Resets Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Verification Tokens Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    

    // Carts Table
    //Esta tabla representa el carrito "padre". Un usuario tiene un carrito.
    await client.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        total_price DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Cart Items Table
    //Esta tabla representa los productos dentro del carrito. Un carrito puede tener múltiples productos.
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
        price_at_purchase DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Orders Table
    // Esta tabla representa los pedidos confirmados de los usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'confirmado', 'cancelado'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Payments Table
    // Esta tabla guarda los comprobantes de pago de los usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50), -- 'transferencia', 'deposito', 'tarjeta', etc
        receipt_url VARCHAR(500), -- URL del comprobante (imagen)
        receipt_hash VARCHAR(255), -- Hash para verificar autenticidad
        status VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
        validated_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin que validó
        validation_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        validated_at TIMESTAMP
      );
    `);

    // ========== MODULO DE PRODUCTOS Y RESENAS ==========

    // Categories Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(80) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Products Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        title VARCHAR(140) NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
        stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
        status VARCHAR(20) NOT NULL DEFAULT 'activo'
          CHECK (status IN ('activo', 'bloqueado', 'vendido')),
        is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
        blocked_reason TEXT,
        average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5),
        review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Product Images Table (1 producto -> N imagenes)
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (product_id, image_url)
      );
    `);

    // Crear indice unico para una sola imagen principal por producto
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_product_images_primary
        ON product_images (product_id)
        WHERE is_primary = TRUE;
    `);

    // Reviews Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (product_id, user_id)
      );
    `);

    // Crear indices de consulta comun
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
      CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
      CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
      CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
    `);

    // Trigger para updated_at en categories
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
      CREATE TRIGGER trg_categories_updated_at
      BEFORE UPDATE ON categories
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
      CREATE TRIGGER trg_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_reviews_updated_at ON reviews;
      CREATE TRIGGER trg_reviews_updated_at
      BEFORE UPDATE ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    // Trigger para recalcular rating promedio
    await client.query(`
      CREATE OR REPLACE FUNCTION recalculate_product_rating(p_product_id UUID)
      RETURNS VOID AS $$
      BEGIN
        UPDATE products p
        SET
          average_rating = COALESCE(stats.avg_rating, 0),
          review_count = COALESCE(stats.total_reviews, 0),
          updated_at = CURRENT_TIMESTAMP
        FROM (
          SELECT
            product_id,
            ROUND(AVG(rating)::numeric, 2) AS avg_rating,
            COUNT(*)::integer AS total_reviews
          FROM reviews
          WHERE product_id = p_product_id
          GROUP BY product_id
        ) stats
        WHERE p.id = p_product_id;

        UPDATE products
        SET
          average_rating = 0,
          review_count = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = p_product_id
          AND NOT EXISTS (SELECT 1 FROM reviews WHERE product_id = p_product_id);
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION trg_reviews_recalculate_product_rating()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN
          PERFORM recalculate_product_rating(OLD.product_id);
          RETURN OLD;
        END IF;

        PERFORM recalculate_product_rating(NEW.product_id);

        IF TG_OP = 'UPDATE' AND OLD.product_id <> NEW.product_id THEN
          PERFORM recalculate_product_rating(OLD.product_id);
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trg_reviews_recalculate_rating ON reviews;
      CREATE TRIGGER trg_reviews_recalculate_rating
      AFTER INSERT OR UPDATE OR DELETE ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION trg_reviews_recalculate_product_rating();
    `);

    console.log('--- Database structure created successfully! ---');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
    await pool.end();
  }
};

initDb();
