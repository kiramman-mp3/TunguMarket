import CategoryModel from '../models/categoryModel.js';

class CategoryController {
  /**
   * GET /api/categories
   * Obtiene todas las categorías activas
   */
  static async getAllCategories(req, res) {
    try {
      const categories = await CategoryModel.findAll();

      res.status(200).json({
        message: 'Categorías obtenidas exitosamente',
        data: categories
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/categories/:id
   * Obtiene una categoría específica
   */
  static async getCategoryById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID de categoría requerido' });
      }

      const category = await CategoryModel.findById(id);

      if (!category) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      res.status(200).json({
        message: 'Categoría obtenida exitosamente',
        data: category
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/categories
   * Crea una nueva categoría (SOLO ADMIN)
   */
  static async createCategory(req, res) {
    try {
      // Validar permiso
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden crear categorías' });
      }

      const { name, description } = req.body;

      // Validar nombre
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Nombre de categoría es requerido' });
      }

      // Verificar que no exista
      const existing = await CategoryModel.findByName(name.trim());
      if (existing) {
        return res.status(409).json({ error: 'La categoría ya existe' });
      }

      const category = await CategoryModel.create(name.trim(), description || null);

      res.status(201).json({
        message: 'Categoría creada exitosamente',
        data: category
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/categories/:id
   * Actualiza una categoría (SOLO ADMIN)
   */
  static async updateCategory(req, res) {
    try {
      // Validar permiso
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden actualizar categorías' });
      }

      const { id } = req.params;
      const { name, description, is_active } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'ID de categoría requerido' });
      }

      // Verificar que existe
      const existing = await CategoryModel.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      const updates = {};
      if (name !== undefined && name.trim()) {
        updates.name = name.trim();
      }
      if (description !== undefined) {
        updates.description = description;
      }
      if (is_active !== undefined) {
        updates.is_active = is_active;
      }

      const updated = await CategoryModel.update(id, updates);

      res.status(200).json({
        message: 'Categoría actualizada exitosamente',
        data: updated
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/categories/:id
   * Desactiva una categoría (soft delete, SOLO ADMIN)
   */
  static async deleteCategory(req, res) {
    try {
      // Validar permiso
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden eliminar categorías' });
      }

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID de categoría requerido' });
      }

      const category = await CategoryModel.findById(id);

      if (!category) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      // Verificar que no tenga productos activos
      const productCount = await CategoryModel.getProductCount(id);
      if (productCount > 0) {
        return res.status(400).json({ 
          error: `No se puede eliminar categoría con ${productCount} producto(s) activo(s)` 
        });
      }

      const deactivated = await CategoryModel.deactivate(id);

      res.status(200).json({
        message: 'Categoría desactivada exitosamente',
        data: deactivated
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default CategoryController;
