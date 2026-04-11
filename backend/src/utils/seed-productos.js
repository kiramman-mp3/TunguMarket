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

// URL base del backend para servir las imágenes de producción
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const BASE_IMG_URL = `${BACKEND_URL}/uploads/products`;

const ADJECTIVES = ['Premium', 'Artesanal', 'Orgánico', 'Tradicional', 'Gourmet', 'Familiar', 'Único', 'Limitado', 'De Exportación', 'Especial'];
const NOUNS = {
  'Alimentos': ['Pan de Pinllo', 'Miel de Abeja', 'Vino de Frutas', 'Queso de Hoja', 'Chocolate Ambateño', 'Mermelada Natural', 'Café de Altura', 'Cesta de Frutas'],
  'Artesanías': ['Vasija de Barro', 'Tejido Otavaleño', 'Escultura de Madera', 'Cuadro al Óleo', 'Joyero de Plata', 'Máscara de Tigua'],
  'Calzado': ['Botas de Cuero', 'Zapatos Casuales', 'Sandalias de Verano', 'Mocasines Elegantes', 'Deportivos Modernos'],
  'Ropa': ['Poncho de Lana', 'Camiseta de Algodón', 'Chaqueta Impermeable', 'Pantalón de Tela', 'Sombrero de Paja Toquilla'],
  'Tecnología': ['Audífonos Pro', 'Mouse Gamer', 'Teclado Mecánico', 'Smartwatch Fit', 'Soporte Ergonómico'],
  'Hogar': ['Lámpara de Madera', 'Cojín Decorativo', 'Espejo Tallado', 'Reloj de Pared', 'Planta de Interior', 'Vajilla de Cerámica'],
  'Otros': ['Libro de Historias', 'Juguete Tradicional', 'Accesorio de Cuero', 'Kit de Regalo']
};

// Mapeo real de categorías a imágenes en el servidor de producción (/uploads/products/)
const CATEGORY_IMAGES = {
  'Alimentos': [`${BASE_IMG_URL}/alimentos_1.png`, `${BASE_IMG_URL}/alimentos_2.png`],
  'Artesanías': [`${BASE_IMG_URL}/artesanias_1.png`, `${BASE_IMG_URL}/artesanias_2.png`],
  'Calzado': [`${BASE_IMG_URL}/calzado_1.png`, `${BASE_IMG_URL}/calzado_2.png`],
  'Ropa': [`${BASE_IMG_URL}/ropa_1.png`, `${BASE_IMG_URL}/ropa_2.png`],
  'Tecnología': [`${BASE_IMG_URL}/tecnologia_1.png`, `${BASE_IMG_URL}/tecnologia_2.png`],
  'Hogar': [`${BASE_IMG_URL}/hogar_1.png`, `${BASE_IMG_URL}/hogar_2.png`],
  'Otros': [`${BASE_IMG_URL}/otros_1.png`]
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomPrice = () => (Math.random() * (450 - 5) + 5).toFixed(2);
const getRandomStock = () => Math.floor(Math.random() * 150) + 1;
const getRandomRating = () => (Math.random() * (5 - 3.8) + 3.8).toFixed(1);

const seedChaos = async () => {
  const client = await pool.connect();
  try {
    console.log(`--- ENTERING PRODUCTION SEED MODE: IMAGES FROM ${BACKEND_URL} ---`);

    const categoriesRes = await client.query('SELECT id, name FROM categories');
    const categories = categoriesRes.rows;
    const adminRes = await client.query("SELECT id FROM users WHERE email = 'admin@tungumarket.com'");
    if (adminRes.rows.length === 0) throw new Error('Crea el admin primero.');
    const adminId = adminRes.rows[0].id;

    console.log('Limpiando catálogo anterior...');
    await client.query('DELETE FROM products WHERE seller_id = $1', [adminId]);

    console.log(`Poblando datos reales para ${categories.length} categorías...`);

    let count = 0;
    for (let i = 0; i < 50; i++) {
      const category = getRandom(categories);
      const adj = getRandom(ADJECTIVES);
      const nounArr = NOUNS[category.name] || NOUNS['Otros'];
      const noun = getRandom(nounArr);
      const title = `${noun} ${adj}`;
      
      const prodRes = await client.query(`
        INSERT INTO products (seller_id, category_id, title, description, price, stock, average_rating, review_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
      `, [
        adminId, 
        category.id, 
        title, 
        `Producto auténtico de Tungurahua: ${title}. Calificación premium y stock real en nuestro centro de distribución de Ambato.`, 
        getRandomPrice(), 
        getRandomStock(), 
        getRandomRating(), 
        Math.floor(Math.random() * 80)
      ]);

      const productId = prodRes.rows[0].id;
      const imagesAvailable = CATEGORY_IMAGES[category.name] || CATEGORY_IMAGES['Otros'];
      const imageUrl = getRandom(imagesAvailable);

      await client.query(`
        INSERT INTO product_images (product_id, image_url, is_primary)
        VALUES ($1, $2, true)
      `, [productId, imageUrl]);

      count++;
    }

    console.log(`✅ ¡ÉXITO TOTAL! ${count} productos con URLs reales de servidor backend.`);
  } catch (err) {
    console.error('❌ Error en el despliegue de producción:', err);
  } finally {
    client.release();
    await pool.end();
  }
};

seedChaos();
