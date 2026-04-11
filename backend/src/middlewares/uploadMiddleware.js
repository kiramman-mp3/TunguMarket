import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Función para crear el middleware según el destino
const createUploadMiddleware = (folder, prefix) => {
    const uploadDir = `uploads/${folder}`;
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
            const ext = path.extname(file.originalname);
            cb(null, `${prefix}-${uniqueSuffix}${ext}`);
        }
    });

    const fileFilter = (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes (JPEG, JPG, PNG, WEBP)'));
    };

    return multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter
    });
};

export const uploadProducts = createUploadMiddleware('products', 'product');
export const uploadAvatars = createUploadMiddleware('avatars', 'avatar');

// Mantener el default para compatibilidad con el código actual (productos)
export default uploadProducts;
