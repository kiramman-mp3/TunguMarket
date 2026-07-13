import pool from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function fixUrls() {
  try {
    console.log('--- Updating Product Image URLs to Railway Host ---');
    const res = await pool.query(`
      UPDATE product_images 
      SET image_url = REPLACE(image_url, 'http://localhost:5000', 'https://tungumarket-production.up.railway.app')
      RETURNING id, image_url
    `);
    console.log(`✅ Successfully updated ${res.rowCount} image paths in Neon.`);
  } catch (error) {
    console.error("❌ Error updating image URLs:", error);
  } finally {
    await pool.end();
  }
}
fixUrls();
