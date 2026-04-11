import ProductModel from '../models/productModel.js';
import ProductImageModel from '../models/productImageModel.js';
import OrderModel from '../models/orderModel.js';
import ForbiddenKeywordService from '../services/forbiddenKeywordService.js';
import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
   * Busca productos por término y/o filtros
   */
  static async searchProducts(req, res) {
    try {
      const { q = '', page = 1, limit = 20, categoryId, minPrice, maxPrice, minRating } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      const filters = {};
      if (categoryId) filters.category_id = categoryId;
      if (minPrice !== undefined && minPrice !== '') filters.minPrice = parseFloat(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') filters.maxPrice = parseFloat(maxPrice);
      if (minRating !== undefined && minRating !== '') filters.minRating = parseFloat(minRating);

      // Si es admin, mostrar todos los productos (incluyendo bloqueados y pendientes)
      const isAdmin = req.user && req.user.role === 'admin';

      const { products, total } = await ProductModel.search(q.trim(), limitNum, offset, filters, isAdmin);

      res.status(200).json({
        message: 'Búsqueda completada exitosamente',
        data: {
          query: q,
          filters,
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

      // Lógica de visibilidad personalizada
      // Si el producto está oculto, solo el vendedor o un admin pueden verlo
      if (product.status !== 'activo') {
        const canView = req.user && (req.user.id === product.seller_id || req.user.role === 'admin');
        if (!canView) {
          // Si es un comprador/guest intentando ver algo oculto
          return res.status(404).json({ error: 'Este producto no está disponible actualmente' });
        }
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
      let { category_id, title, description, price, stock = 1 } = req.body;

      // Convertir a números (Multer recibe todo como string en FormData)
      price = parseFloat(price);
      stock = parseInt(stock, 10);

      // Validar campos obligatorios uno por uno para diagnóstico preciso
      if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'El título es obligatorio' });
      }
      if (!description || description.trim().length === 0) {
        return res.status(400).json({ error: 'La descripción es obligatoria' });
      }
      if (isNaN(price)) {
        return res.status(400).json({ error: 'El precio debe ser un número válido' });
      }
      if (price < 0) {
        return res.status(400).json({ error: 'El precio debe ser un valor positivo' });
      }
      if (!category_id) {
        return res.status(400).json({ error: 'Debes seleccionar una categoría' });
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
      } else {
        // REQUERIMIENTO: Todos los productos nuevos deben ser aprobados antes de publicación
        productData.status = 'pendiente';
      }

      const product = await ProductModel.create(productData);

      // ========== GESTIÓN DE IMÁGENES MÚLTIPLES ==========
      if (req.files && req.files.length > 0) {
        const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const imageUrl = `${baseUrl}/uploads/products/${file.filename}`;
          const isPrimary = i === 0; // La primera es la principal
          
          await ProductImageModel.create(product.id, imageUrl, isPrimary, i);
        }
      }

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
      let { title, description, price, stock, status, category_id } = req.body;
      const userId = req.user.id;

      const productId = String(id).trim().toLowerCase();
      const product = await ProductModel.findById(productId);

      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Verificar permisos (vendedor o admin) - Comparación robusta de UUIDs
      const isOwner = String(product.seller_id).toLowerCase() === String(userId).toLowerCase();
      if (!isOwner && req.user.role !== 'admin') {
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

      // Convertir y validar precio si se proporciona
      if (price !== undefined) {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice) || numPrice < 0) {
          return res.status(400).json({ error: 'Precio inválido' });
        }
        updates.price = numPrice;
      }

      // Convertir y validar stock si se proporciona
      if (stock !== undefined) {
        const numStock = parseInt(stock, 10);
        if (isNaN(numStock) || numStock < 0) {
          return res.status(400).json({ error: 'Stock inválido' });
        }
        updates.stock = numStock;
      }

      if (category_id !== undefined) {
        updates.category_id = category_id;
      }

      // Normalización y validación de cambio de estado
      if (status !== undefined) {
        const normalizedStatus = String(status).trim().toLowerCase();
        
        if (req.user.role === 'admin') {
          updates.status = normalizedStatus;
        } else if (normalizedStatus === 'activo' || normalizedStatus === 'oculto') {
          updates.status = normalizedStatus;
        }
      }

      // ========== ACTUALIZACIÓN DE IMÁGENES MÚLTIPLES ==========
      if (req.files && req.files.length > 0) {
        const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        
        // Obtener el orden actual para continuar
        const currentCount = await ProductImageModel.countByProductId(id);
        
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const imageUrl = `${baseUrl}/uploads/products/${file.filename}`;
          
          // Si es la primera vez que se suben imágenes o si se quiere reemplazar el primary (lógica simple: añadir)
          await ProductImageModel.create(id, imageUrl, false, currentCount + i);
        }
      }

      // Solo proceder si hay algo que actualizar
      let updated;
      if (Object.keys(updates).length > 0) {
        updated = await ProductModel.update(id, updates);
      } else {
        updated = product;
      }

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

      // Verificar si el producto tiene ventas antes de borrar
      const salesCount = await OrderModel.countSalesByProductId(id);
      
      if (salesCount > 0) {
        // En vez de borrar, lo ocultamos para preservar el historial de órdenes del comprador
        await ProductModel.update(id, { status: 'oculto' });
        return res.status(200).json({
          message: 'El producto ahora está oculto. No se pudo eliminar físicamente porque tiene ventas registradas.',
          hidden: true
        });
      }

      // Si no hay ventas, procedemos con el borrado físico completo
      // Obtener todas las imágenes para borrarlas del disco
      const images = await ProductImageModel.findByProductId(id);
      for (const img of images) {
        try {
          const urlParts = img.image_url.split('/');
          const filename = urlParts[urlParts.length - 1];
          const filePath = path.join(__dirname, '../../uploads/products', filename);
          if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
          }
        } catch (err) {
          console.error(`Error eliminando archivo físico: ${img.image_url}`, err);
        }
      }

      await ProductModel.delete(id);
      await ProductImageModel.deleteByProductId(id);

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

      // Obtener detalles de la imagen antes de borrar
      const image = await ProductImageModel.findById(imageId);
      if (!image) {
        return res.status(404).json({ error: 'Imagen no encontrada' });
      }

      // Eliminar archivo físico
      try {
        const urlParts = image.image_url.split('/');
        const filename = urlParts[urlParts.length - 1];
        const filePath = path.join(__dirname, '../../uploads/products', filename);
        
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      } catch (err) {
        console.error('Error al borrar archivo físico:', err);
      }

      await ProductImageModel.delete(imageId);

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

  /**
   * PATCH /api/products/:id/images/:imageId/primary
   * Establece una imagen como principal
   */
  static async setPrimaryImage(req, res) {
    try {
      const { id, imageId } = req.params;
      const userId = req.user.id;

      const product = await ProductModel.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Verificar permisos
      if (product.seller_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permiso para modificar este producto' });
      }

      await ProductImageModel.update(imageId, { is_primary: true });

      res.status(200).json({
        message: 'Imagen principal actualizada exitosamente'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/products/:id/status
   * Punto de acceso dedicado para alternar la visibilidad (activo/oculto)
   * Evita conflictos con Multer/Subida de imágenes del PUT principal
   */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      if (!id || !status) {
        return res.status(400).json({ error: 'ID y estado son requeridos' });
      }

      // Normalización de ID y Estado
      const productId = String(id).trim().toLowerCase();
      const normalizedStatus = String(status).trim().toLowerCase();
      
      if (normalizedStatus !== 'activo' && normalizedStatus !== 'oculto') {
        return res.status(400).json({ error: 'Estado inválido. Solo se permite activo u oculto.' });
      }

      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Verificar permiso (dueño o admin)
      const isOwner = String(product.seller_id).toLowerCase() === String(userId).toLowerCase();
      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permiso para cambiar el estado de este producto' });
      }

      const updated = await ProductModel.update(productId, { status: normalizedStatus });

      if (!updated) {
        return res.status(500).json({ error: 'Error al actualizar el estado en la base de datos' });
      }

      res.status(200).json({
        message: `Estado actualizado a ${normalizedStatus}`,
        data: updated
      });
    } catch (error) {
      console.error('Error en updateStatus:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/products/seller/me/stats
   * Obtiene estadísticas reales del vendedor logueado
   */
  static async getSellerStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await ProductModel.getSellerStats(userId);
      res.status(200).json({
        message: 'Estadísticas obtenidas exitosamente',
        data: stats
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * ADMIN: GET /api/products/admin/list
   * Obtiene todos los productos para gestión administrativa
   */
  static async adminGetAllProducts(req, res) {
    try {
      const { page = 1, limit = 50, status } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      const { products, total } = await ProductModel.adminFindAll(limitNum, offset, status);

      res.status(200).json({
        message: 'Lista administrativa de productos obtenida',
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
   * ADMIN: PATCH /api/products/admin/:id/status
   * Punto de acceso para aprobación o bloqueo manual por Admin
   */
  static async adminUpdateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, blocked_reason } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'El nuevo estado es requerido' });
      }

      const validStatuses = ['activo', 'pendiente', 'bloqueado', 'oculto'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado no válido' });
      }

      const updates = { status };
      if (status === 'bloqueado' && blocked_reason) {
        updates.blocked_reason = blocked_reason;
        updates.is_flagged = true;
      } else if (status === 'activo') {
        updates.is_flagged = false;
        updates.blocked_reason = null;
      }

      const updated = await ProductModel.update(id, updates);

      if (!updated) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.status(200).json({
        message: `Estado del producto actualizado a: ${status}`,
        data: updated
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default ProductController;
