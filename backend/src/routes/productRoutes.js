import express from 'express';
import ProductController from '../controllers/productController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

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

// GET detalles completos de un producto (público)
router.get('/:id', ProductController.getProductById);

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
