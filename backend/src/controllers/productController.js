import ProductModel from '../models/productModel.js';
import ProductImageModel from '../models/productImageModel.js';
import ForbiddenKeywordService from '../services/forbiddenKeywordService.js';

class ProductController {
  /**
   * GET /api/products
   * Obtiene el catálogo principal con paginación
   */
  static async getAllProducts(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      const { products, total } = await ProductModel.findAll(limitNum, offset);

      // Agregar imágenes principales a cada producto
      for (let product of products) {
        const primaryImage = await ProductImageModel.getPrimaryImage(product.id);
        product.primary_image = primaryImage?.image_url || null;
      }

      res.status(200).json({
        message: 'Productos obtenidos exitosamente',
        data: {
          products,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/products/category/:categoryId
   * Obtiene productos por categoría
   */
  static async getProductsByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!categoryId) {
        return res.status(400).json({ error: 'ID de categoría requerido' });
      }

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      const { products, total } = await ProductModel.findByCategory(categoryId, limitNum, offset);

      // Agregar imágenes principales
      for (let product of products) {
        const primaryImage = await ProductImageModel.getPrimaryImage(product.id);
        product.primary_image = primaryImage?.image_url || null;
      }

      res.status(200).json({
        message: 'Productos por categoría obtenidos exitosamente',
        data: {
          products,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/products/search
   * Busca productos por término
   */
  static async searchProducts(req, res) {
    try {
      const { q, page = 1, limit = 20 } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: 'Término de búsqueda requerido' });
      }

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      const { products, total } = await ProductModel.search(q.trim(), limitNum, offset);

      // Agregar imágenes principales
      for (let product of products) {
        const primaryImage = await ProductImageModel.getPrimaryImage(product.id);
        product.primary_image = primaryImage?.image_url || null;
      }

      res.status(200).json({
        message: 'Búsqueda completada exitosamente',
        data: {
          query: q,
          products,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/products/featured
   * Obtiene productos destacados (mejor rating)
   */
  static async getFeaturedProducts(req, res) {
    try {
      const { limit = 10 } = req.query;

      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
      const products = await ProductModel.getFeatured(limitNum);

      // Agregar imágenes principales
      for (let product of products) {
        const primaryImage = await ProductImageModel.getPrimaryImage(product.id);
        product.primary_image = primaryImage?.image_url || null;
      }

      res.status(200).json({
        message: 'Productos destacados obtenidos exitosamente',
        data: products
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/products/:id
   * Obtiene detalles completos de un producto
   */
  static async getProductById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID de producto requerido' });
      }

      const product = await ProductModel.findById(id);

      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Obtener imágenes
      const images = await ProductImageModel.findByProductId(id);

      res.status(200).json({
        message: 'Producto obtenido exitosamente',
        data: {
          ...product,
          images
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/products
   * Crea un nuevo producto (usuario autenticado)
   * NOTA: Incluye detección automática de palabras prohibidas
   */
  static async createProduct(req, res) {
    try {
      const userId = req.user.id;
      const { category_id, title, description, price, stock = 1 } = req.body;

      // Validar campos obligatorios
      if (!category_id || !title || !description || price === undefined) {
        return res.status(400).json({
          error: 'category_id, title, description, price requeridos'
        });
      }

      // Validar tipos
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Título inválido' });
      }

      if (typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({ error: 'Descripción inválida' });
      }

      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'Precio inválido' });
      }

      // ========== DETECCIÓN DE PALABRAS PROHIBIDAS ==========
      const detection = ForbiddenKeywordService.detectProhibitedContent(title, description);

      let productData = {
        seller_id: userId,
        category_id,
        title: title.trim(),
        description: description.trim(),
        price,
        stock: Math.max(1, parseInt(stock, 10) || 1)
      };

      // Si se detectan palabras prohibidas, bloquear el producto automáticamente
      if (detection.isProhibited) {
        productData.status = 'bloqueado';
        productData.is_flagged = true;
        productData.blocked_reason = ForbiddenKeywordService.generateBlockReason(detection.flaggedKeywords);
      }

      const product = await ProductModel.create(productData);

      res.status(201).json({
        message: detection.isProhibited 
          ? 'Producto creado pero bloqueado automáticamente por contenido prohibido'
          : 'Producto creado exitosamente',
        data: product,
        flagged: detection.isProhibited ? {
          keywords: detection.flaggedKeywords,
          reason: product.blocked_reason
        } : null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/products/:id
   * Actualiza un producto (solo vendedor o admin)
   */
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { title, description, price, stock, status } = req.body;
      const userId = req.user.id;

      if (!id) {
        return res.status(400).json({ error: 'ID de producto requerido' });
      }

      const product = await ProductModel.findById(id);

      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Verificar permisos (vendedor o admin)
      if (product.seller_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permiso para actualizar este producto' });
      }

      const updates = {};

      // Validar y actualizar título si se proporciona
      if (title !== undefined) {
        if (typeof title !== 'string' || title.trim().length === 0) {
          return res.status(400).json({ error: 'Título inválido' });
        }
        updates.title = title.trim();
      }

      // Validar y actualizar descripción si se proporciona
      if (description !== undefined) {
        if (typeof description !== 'string' || description.trim().length === 0) {
          return res.status(400).json({ error: 'Descripción inválida' });
        }
        updates.description = description.trim();
      }

      if (price !== undefined && typeof price === 'number' && price >= 0) {
        updates.price = price;
      }

      if (stock !== undefined && Number.isInteger(stock) && stock >= 0) {
        updates.stock = stock;
      }

      // Solo admin puede cambiar estado
      if (status !== undefined && req.user.role === 'admin') {
        updates.status = status;
      }

      const updated = await ProductModel.update(id, updates);

      res.status(200).json({
        message: 'Producto actualizado exitosamente',
        data: updated
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/products/:id
   * Elimina un producto (solo vendedor o admin)
   */
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!id) {
        return res.status(400).json({ error: 'ID de producto requerido' });
      }

      const product = await ProductModel.findById(id);

      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Verificar permisos
      if (product.seller_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permiso para eliminar este producto' });
      }

      await ProductModel.delete(id);
      await ProductImageModel.deleteByProductId(id); // Eliminar imágenes también

      res.status(200).json({
        message: 'Producto eliminado exitosamente'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/products/seller/:sellerId
   * Obtiene productos de un vendedor específico
   */
  static async getSellerProducts(req, res) {
    try {
      const { sellerId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      if (!sellerId) {
        return res.status(400).json({ error: 'ID de vendedor requerido' });
      }

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      const { products, total } = await ProductModel.findBySeller(sellerId, limitNum, offset);

      // Agregar imágenes principales
      for (let product of products) {
        const primaryImage = await ProductImageModel.getPrimaryImage(product.id);
        product.primary_image = primaryImage?.image_url || null;
      }

      res.status(200).json({
        message: 'Productos del vendedor obtenidos exitosamente',
        data: {
          seller_id: sellerId,
          products,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/products/:id/images
   * Agregar imagen a un producto
   */
  static async addProductImage(req, res) {
    try {
      const { id } = req.params;
      const { image_url, is_primary = false, display_order = 0 } = req.body;
      const userId = req.user.id;

      if (!id || !image_url) {
        return res.status(400).json({ error: 'ID de producto e image_url requeridos' });
      }

      const product = await ProductModel.findById(id);

      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Verificar permisos
      if (product.seller_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permiso para agregar imágenes a este producto' });
      }

      const image = await ProductImageModel.create(id, image_url, is_primary, display_order);

      res.status(201).json({
        message: 'Imagen agregada exitosamente',
        data: image
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/products/:id/images/:imageId
   * Elimina una imagen de producto
   */
  static async deleteProductImage(req, res) {
    try {
      const { id, imageId } = req.params;
      const userId = req.user.id;

      if (!id || !imageId) {
        return res.status(400).json({ error: 'ID de producto e imagen requeridos' });
      }

      const product = await ProductModel.findById(id);

      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Verificar permisos
      if (product.seller_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permiso para eliminar imágenes de este producto' });
      }

      const deleted = await ProductImageModel.delete(imageId);

      if (!deleted) {
        return res.status(404).json({ error: 'Imagen no encontrada' });
      }

      res.status(200).json({
        message: 'Imagen eliminada exitosamente'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/products/:id/images
   * Obtiene todas las imágenes de un producto
   */
  static async getProductImages(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID de producto requerido' });
      }

      const product = await ProductModel.findById(id);

      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const images = await ProductImageModel.findByProductId(id);

      res.status(200).json({
        message: 'Imágenes obtenidas exitosamente',
        data: images
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default ProductController;
