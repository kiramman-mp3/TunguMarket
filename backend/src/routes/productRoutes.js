import express from 'express';
import ProductController from '../controllers/productController.js';
import { authMiddleware, optionalAuthMiddleware, isAdmin } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// GET catálogo principal (público) - Paginado
router.get('/', ProductController.getAllProducts);

// GET productos destacados (público)
router.get('/featured', ProductController.getFeaturedProducts);

// GET productos por categoría (público) - Paginado
router.get('/category/:categoryId', ProductController.getProductsByCategory);

// GET buscar productos (público) - Paginado
router.get('/search', ProductController.searchProducts);

// GET productos de un vendedor (público) - Paginado
router.get('/seller/:sellerId', ProductController.getSellerProducts);

// GET estadísticas reales del vendedor logueado (auth)
router.get('/stats/me', authMiddleware, ProductController.getSellerStats);

// --- ADMIN ONLY ROUTES (ANTES de /:id para evitar conflictos) ---
// GET lista administrativa (solo admin)
router.get('/admin/list', authMiddleware, isAdmin, ProductController.adminGetAllProducts);

// PATCH actualizar estado estilo admin (solo admin)
router.patch('/admin/:id/status', authMiddleware, isAdmin, ProductController.adminUpdateStatus);

// --- RUTAS PARAMETRIZADAS (/:id) ---
// GET detalles completos de un producto (público con auth opcional para ver ocultos)
router.get('/:id', optionalAuthMiddleware, ProductController.getProductById);

// PATCH actualizar estado del producto (vendedor o admin) - DEDICADO SIN MULTER
router.patch('/:id/status', authMiddleware, ProductController.updateStatus);

// GET imágenes de un producto (público)
router.get('/:id/images', ProductController.getProductImages);

// POST crear nuevo producto (DEBE ESTAR AUTH)
router.post('/', authMiddleware, upload.array('images', 5), ProductController.createProduct);

// PUT actualizar producto (vendedor o admin)
router.put('/:id', authMiddleware, upload.array('images', 5), ProductController.updateProduct);

// DELETE eliminar producto (vendedor o admin)
router.delete('/:id', authMiddleware, ProductController.deleteProduct);

// POST agregar imagen a producto (vendedor o admin)
router.post('/:id/images', authMiddleware, ProductController.addProductImage);

// DELETE eliminar imagen de producto (vendedor o admin)
router.delete('/:id/images/:imageId', authMiddleware, ProductController.deleteProductImage);

// PATCH establecer imagen como principal (vendedor o admin)
router.patch('/:id/images/:imageId/primary', authMiddleware, ProductController.setPrimaryImage);

export default router;

