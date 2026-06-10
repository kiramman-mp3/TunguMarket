import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const destDir = path.join(__dirname, '..', '..', 'uploads', 'products');

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const CATEGORY_IMAGES = {
  'alimentos_1.png': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
  'alimentos_2.png': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80',
  'artesanias_1.png': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&q=80',
  'artesanias_2.png': 'https://images.unsplash.com/photo-1590736969955-71cb94801758?w=500&q=80',
  'calzado_1.png': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
  'calzado_2.png': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80',
  'ropa_1.png': 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&q=80',
  'ropa_2.png': 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&q=80',
  'tecnologia_1.png': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',
  'tecnologia_2.png': 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80',
  'hogar_1.png': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80',
  'hogar_2.png': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=80',
  'otros_1.png': 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=500&q=80'
};

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (status code: ${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  console.log('Starting seed image downloads to:', destDir);
  for (const [filename, url] of Object.entries(CATEGORY_IMAGES)) {
    const destPath = path.join(destDir, filename);
    try {
      console.log(`Downloading ${filename}...`);
      await download(url, destPath);
      console.log(`✓ Saved ${filename}`);
    } catch (err) {
      console.error(`✗ Error downloading ${filename}:`, err.message);
    }
  }
  console.log('Seed image downloading finished!');
}

main();
