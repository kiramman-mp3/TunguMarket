import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

const ADJECTIVES = ['Premium', 'Económico', 'Artesanal', 'Importado', 'Orgánico', 'Tradicional', 'Gourmet', 'Familiar', 'Único', 'Limitado'];
const NOUNS = {
  'Alimentos': ['Pan', 'Miel', 'Vino', 'Queso', 'Chocolate', 'Mermelada', 'Café', 'Frutas'],
  'Artesanías': ['Vasija', 'Tejido', 'Escultura', 'Cuadro', 'Joyero', 'Máscara'],
  'Calzado': ['Zapatos', 'Botas', 'Sandalias', 'Mocasines', 'Tacones'],
  'Ropa': ['Camiseta', 'Chaqueta', 'Pantalón', 'Vestido', 'Sombrero', 'Bufanda'],
  'Tecnología': ['Audífonos', 'Cargador', 'Mouse', 'Teclado', 'Smartwatch', 'Soporte'],
  'Hogar': ['Lámpara', 'Cojín', 'Espejo', 'Reloj', 'Planta', 'Alfombra'],
  'Otros': ['Libro', 'Juguete', 'Herramienta', 'Accesorio', 'Regalo']
};

const IMAGES = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
  'https://images.unsplash.com/photo-1491553895911-0055eca6402d',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
  'https://images.unsplash.com/photo-1527010159945-c4250922b29c',
  'https://images.unsplash.com/photo-1549488344-cbb6c34ce08b',
  'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be',
  'https://images.unsplash.com/photo-1551024601-bec78aea704b',
  'https://images.unsplash.com/photo-1491633582673-491b48b909ad'
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomPrice = () => (Math.random() * (500 - 0.5) + 0.5).toFixed(2);
const getRandomStock = () => Math.floor(Math.random() * 200);
const getRandomRating = () => (Math.random() * (5 - 3) + 3).toFixed(1);

const seedChaos = async () => {
  const client = await pool.connect();
  try {
    console.log('--- ENTERING CHAOS MODE: SEEDING PRODUCTS ---');

    // 1. Get Categories
    const categoriesRes = await client.query('SELECT id, name FROM categories');
    const categories = categoriesRes.rows;

    if (categories.length === 0) {
      throw new Error('No hay categorías en la DB. Corre init-db.js primero.');
    }

    // 2. Get Admin Seller
    const adminRes = await client.query("SELECT id FROM users WHERE email = 'admin@tungumarket.com'");
    if (adminRes.rows.length === 0) {
      throw new Error('No se encontró el admin. Corre init-db.js primero.');
    }
    const adminId = adminRes.rows[0].id;

    console.log(`Poblando datos para ${categories.length} categorías...`);

    // 3. Generate Products
    let count = 0;
    for (let i = 0; i < 50; i++) {
      const category = getRandom(categories);
      const adj = getRandom(ADJECTIVES);
      const nounArr = NOUNS[category.name] || NOUNS['Otros'];
      const noun = getRandom(nounArr);
      
      const title = `${noun} ${adj} # ${Math.floor(Math.random() * 1000)}`;
      const price = getRandomPrice();
      const stock = getRandomStock();
      const rating = getRandomRating();
      const reviews = Math.floor(Math.random() * 50);

      const prodRes = await client.query(`
        INSERT INTO products (seller_id, category_id, title, description, price, stock, average_rating, review_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
      `, [
        adminId, 
        category.id, 
        title, 
        `Este es un producto caótico de prueba: ${title}. Calidad garantizada en Tungurahua.`, 
        price, 
        stock, 
        rating, 
        reviews
      ]);

      const productId = prodRes.rows[0].id;

      // Primary Image
      await client.query(`
        INSERT INTO product_images (product_id, image_url, is_primary)
        VALUES ($1, $2, true)
      `, [productId, `${getRandom(IMAGES)}?q=80&w=600&auto=format`]);

      // Secondary Image (randomly)
      if (Math.random() > 0.5) {
        await client.query(`
          INSERT INTO product_images (product_id, image_url, is_primary, display_order)
          VALUES ($1, $2, false, 1)
        `, [productId, `${getRandom(IMAGES)}?q=80&w=600&auto=format`]);
      }

      count++;
    }

    console.log(`✅ ¡CAOS COMPLETADO! Se crearon ${count} productos aleatorios.`);
  } catch (err) {
    console.error('❌ Error en el caos:', err);
  } finally {
    client.release();
    await pool.end();
  }
};

seedChaos();
