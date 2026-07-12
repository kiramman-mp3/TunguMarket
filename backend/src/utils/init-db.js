import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

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
    console.log('--- FINAL BACKEND RESTORATION (WITH TRIGGERS) ---');

    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    console.log('Cleaning environment...');
    await client.query(`
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS product_images CASCADE;
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS carts CASCADE;
      DROP TABLE IF EXISTS payments CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS password_resets CASCADE;
      DROP TABLE IF EXISTS verification_tokens CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS login_logs CASCADE;
      DROP TABLE IF EXISTS wishlists CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS withdrawals CASCADE;
      DROP TABLE IF EXISTS wallet_transactions CASCADE;
      DROP TABLE IF EXISTS seller_bank_accounts CASCADE;
      DROP TABLE IF EXISTS push_subscriptions CASCADE;
      DROP TABLE IF EXISTS user_addresses CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS roles CASCADE;
    `);

    console.log('Creating Schema...');
    await client.query(`
      -- 1. AUTH & USER MANAGEMENT
      CREATE TABLE roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      );

      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        firebase_uid VARCHAR(128) UNIQUE,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        birth_date DATE,
        seller_name VARCHAR(100),
        seller_bio TEXT,
        role_id INTEGER REFERENCES roles(id),
        balance DECIMAL(12,2) DEFAULT 0,
        is_verified BOOLEAN DEFAULT FALSE,
        is_banned BOOLEAN DEFAULT FALSE,
        blocked_for_debt BOOLEAN DEFAULT FALSE,
        login_attempts INTEGER DEFAULT 0,
        last_attempt TIMESTAMP,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        device_info TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE login_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        email VARCHAR(150),
        ip_address VARCHAR(45),
        device_info TEXT,
        status VARCHAR(20),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE verification_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE password_resets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. CATALOG
      CREATE TABLE categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(80) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        title VARCHAR(140) NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC(12, 2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 1,
        status VARCHAR(20) NOT NULL DEFAULT 'activo',
        is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
        blocked_reason TEXT,
        average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
        review_count INTEGER NOT NULL DEFAULT 0,
        views INTEGER NOT NULL DEFAULT 0,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE product_images (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. SALES & CART
      CREATE TABLE carts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        total_price DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE cart_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        price_at_purchase DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_price DECIMAL(10, 2) NOT NULL,
        shipping_info JSONB, -- Copia de la dirección en el momento de la compra
        status VARCHAR(40) DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE order_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL,
        price_at_purchase DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50),
        receipt_url VARCHAR(500),
        receipt_hash VARCHAR(64) UNIQUE,
        status VARCHAR(40) DEFAULT 'pendiente',
        validated_by UUID REFERENCES users(id),
        validation_notes TEXT,
        validated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 5. SOCIAL & USER MODULES
      CREATE TABLE reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (product_id, user_id)
      );

      CREATE TABLE wishlists (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          product_id UUID REFERENCES products(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, product_id)
      );

      CREATE TABLE notifications (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'info',
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 6. FINANCIAL & BANKING
      CREATE TABLE seller_bank_accounts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        banco VARCHAR(100) NOT NULL,
        tipo_cuenta VARCHAR(20) NOT NULL CHECK (tipo_cuenta IN ('Ahorros', 'Corriente')),
        numero_cuenta VARCHAR(50) NOT NULL,
        titular VARCHAR(150) NOT NULL,
        cedula_ruc VARCHAR(20) NOT NULL,
        email_titular VARCHAR(100) NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, numero_cuenta)
      );

      CREATE TABLE withdrawals (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount DECIMAL(12,2) NOT NULL,
          bank_account_id UUID REFERENCES seller_bank_accounts(id) ON DELETE SET NULL,
          status VARCHAR(20) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado', 'rechazado', 'completado')),
          bank_info JSONB,
          validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
          validated_at TIMESTAMP,
          validation_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE wallet_transactions (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          withdrawal_id UUID REFERENCES withdrawals(id) ON DELETE SET NULL,
          order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
          type VARCHAR(50) NOT NULL CHECK (type IN ('earning', 'withdrawal', 'refund', 'debt_commission', 'debt_payment')),
          amount DECIMAL(12,2) NOT NULL,
          commission DECIMAL(12,2) DEFAULT 0,
          status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE push_subscriptions (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, endpoint)
      );

      -- 7. ADDRESSES
      CREATE TABLE user_addresses (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          city VARCHAR(100) NOT NULL, -- Cantón de Tungurahua
          main_street VARCHAR(255) NOT NULL,
          secondary_street VARCHAR(255) NOT NULL,
          neighborhood VARCHAR(255),
          house_number VARCHAR(50),
          postal_code VARCHAR(10),
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 8. AUTOMATION (TRIGGERS & INDEXES)
      -- Indexes for performance
      CREATE INDEX idx_seller_bank_accounts_user_id ON seller_bank_accounts(user_id);
      CREATE INDEX idx_seller_bank_accounts_is_default ON seller_bank_accounts(user_id, is_default);
      CREATE INDEX idx_withdrawals_status ON withdrawals(status);
      CREATE INDEX idx_withdrawals_user_status ON withdrawals(user_id, status);
      CREATE INDEX idx_withdrawals_bank_account ON withdrawals(bank_account_id);
      CREATE INDEX idx_withdrawals_created ON withdrawals(created_at);
      CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);
      CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
      CREATE INDEX idx_wallet_transactions_created ON wallet_transactions(created_at);

      -- TRIGGERS
      -- Function to update product rating stats
      CREATE OR REPLACE FUNCTION update_product_rating_stats()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
          UPDATE products
          SET 
            average_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = NEW.product_id),
            review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = NEW.product_id;
          RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
          UPDATE products
          SET 
            average_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = OLD.product_id),
            review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = OLD.product_id),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = OLD.product_id;
          RETURN OLD;
        END IF;
      END;
      $$ LANGUAGE plpgsql;

      -- Trigger for reviews
      CREATE TRIGGER trg_update_rating_stats
      AFTER INSERT OR UPDATE OR DELETE ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION update_product_rating_stats();
    `);

    console.log('Seeding baseline info...');
    await client.query("INSERT INTO roles (name) VALUES ('admin'), ('usuario_general');");

    const adminRoleId = (await client.query("SELECT id FROM roles WHERE name = 'admin'")).rows[0].id;
    const passwordHash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role_id, is_verified)
      VALUES ('Admin Tungu', 'admin@tungumarket.com', $1, $2, true)
    `, [passwordHash, adminRoleId]);

    const baselineCategories = [
      ['Alimentos', 'Productos frescos de la región'],
      ['Artesanías', 'Hecho a mano en Tungurahua'],
      ['Calzado', 'Calzado de cuero y deportivo'],
      ['Ropa', 'Telas y confecciones locales'],
      ['Tecnología', 'Gadgets y accesorios'],
      ['Hogar', 'Muebles y decoración'],
      ['Otros', 'Misceláneos']
    ];

    for (const [name, desc] of baselineCategories) {
      await client.query('INSERT INTO categories (name, description) VALUES ($1, $2)', [name, desc]);
    }

    console.log('--- SYSTEM RECONSTRUCTED SUCCESSFULLY (TRIGGERS ACTIVE) ---');
  } catch (err) {
    console.error('❌ CRITICAL ERROR:', err);
  } finally {
    client.release();
    await pool.end();
  }
};

initDb();
