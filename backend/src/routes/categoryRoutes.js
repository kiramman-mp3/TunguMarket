import express from 'express';
import CategoryController from '../controllers/categoryController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET todas las categorías (público)
router.get('/', CategoryController.getAllCategories);

// GET categoría por ID (público)
router.get('/:id', CategoryController.getCategoryById);

// POST crear categoría (ADMIN)
router.post('/', authMiddleware, CategoryController.createCategory);

// PUT actualizar categoría (ADMIN)
router.put('/:id', authMiddleware, CategoryController.updateCategory);

// DELETE desactivar categoría (ADMIN)
router.delete('/:id', authMiddleware, CategoryController.deleteCategory);

export default router;
