import ReviewModel from '../models/reviewModel.js';
import ProductModel from '../models/productModel.js';

class ReviewController {
  /**
   * GET /api/reviews/product/:productId
   * Obtiene reseñas de un producto con paginación
   */
  static async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!productId) {
        return res.status(400).json({ error: 'ID de producto requerido' });
      }

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      // Verificar que el producto existe
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const { reviews, total } = await ReviewModel.findByProductId(productId, limitNum, offset);

      res.status(200).json({
        message: 'Reseñas obtenidas exitosamente',
        data: {
          product_id: productId,
          reviews,
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
   * GET /api/reviews/product/:productId/stats
   * Obtiene estadísticas de reseñas de un producto
   */
  static async getProductReviewStats(req, res) {
    try {
      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json({ error: 'ID de producto requerido' });
      }

      // Verificar que el producto existe
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const stats = await ReviewModel.getProductStats(productId);

      res.status(200).json({
        message: 'Estadísticas de reseñas obtenidas exitosamente',
        data: {
          product_id: productId,
          ...stats
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/reviews/product/:productId/top
   * Obtiene las reseñas mejor valoradas de un producto
   */
  static async getTopProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const { limit = 5 } = req.query;

      if (!productId) {
        return res.status(400).json({ error: 'ID de producto requerido' });
      }

      const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10)));

      // Verificar que el producto existe
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const reviews = await ReviewModel.getTopReviews(productId, limitNum);

      res.status(200).json({
        message: 'Reseñas destacadas obtenidas exitosamente',
        data: {
          product_id: productId,
          reviews
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/reviews/user/:userId
   * Obtiene reseñas de un usuario
   */
  static async getUserReviews(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'ID de usuario requerido' });
      }

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
      const offset = (pageNum - 1) * limitNum;

      const { reviews, total } = await ReviewModel.findByUserId(userId, limitNum, offset);

      res.status(200).json({
        message: 'Reseñas del usuario obtenidas exitosamente',
        data: {
          user_id: userId,
          reviews,
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
   * GET /api/reviews/:id
   * Obtiene una reseña específica
   */
  static async getReviewById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'ID de reseña requerido' });
      }

      const review = await ReviewModel.findById(id);

      if (!review) {
        return res.status(404).json({ error: 'Reseña no encontrada' });
      }

      res.status(200).json({
        message: 'Reseña obtenida exitosamente',
        data: review
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/reviews
   * Crea una nueva reseña (usuario autenticado)
   */
  static async createReview(req, res) {
    try {
      const userId = req.user.id;
      const { product_id, rating, comment } = req.body;

      // Validar campos obligatorios
      if (!product_id || !rating || rating === undefined) {
        return res.status(400).json({ error: 'product_id y rating requeridos' });
      }

      // Validar rating
      if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(400).json({ error: 'Rating debe ser un número entero entre 1 y 5' });
      }

      // Verificar que el producto existe
      const product = await ProductModel.findById(product_id);
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Verificar que el usuario no haya dejado reseña en este producto
      const existingReview = await ReviewModel.findByProductAndUser(product_id, userId);
      if (existingReview) {
        return res.status(409).json({ 
          error: 'Ya has dejado una reseña en este producto. Puedes modificarla.' 
        });
      }

      // Crear reseña
      const review = await ReviewModel.create(
        product_id,
        userId,
        rating,
        comment || null
      );

      // El trigger de BD automáticamente recalculará average_rating y review_count
      // Traer el producto actualizado con los nuevos valores
      const updatedProduct = await ProductModel.findById(product_id);

      res.status(201).json({
        message: 'Reseña creada exitosamente. Rating del producto actualizado.',
        data: {
          review,
          product_rating: {
            average: updatedProduct.average_rating,
            total_reviews: updatedProduct.review_count
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/reviews/:id
   * Actualiza una reseña (solo autor o admin)
   */
  static async updateReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.id;

      if (!id) {
        return res.status(400).json({ error: 'ID de reseña requerido' });
      }

      const review = await ReviewModel.findById(id);

      if (!review) {
        return res.status(404).json({ error: 'Reseña no encontrada' });
      }

      // Verificar permisos (autor o admin)
      if (review.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permiso para actualizar esta reseña' });
      }

      const updates = {};

      if (rating !== undefined) {
        if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
          return res.status(400).json({ error: 'Rating debe ser un número entero entre 1 y 5' });
        }
        updates.rating = rating;
      }

      if (comment !== undefined) {
        updates.comment = comment || null;
      }

      const updated = await ReviewModel.update(id, updates);

      // Traer el producto actualizado (el trigger recalculará el rating)
      const product = await ProductModel.findById(review.product_id);

      res.status(200).json({
        message: 'Reseña actualizada exitosamente. Rating del producto actualizado.',
        data: {
          review: updated,
          product_rating: {
            average: product.average_rating,
            total_reviews: product.review_count
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/reviews/:id
   * Elimina una reseña (solo autor o admin)
   */
  static async deleteReview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!id) {
        return res.status(400).json({ error: 'ID de reseña requerido' });
      }

      const review = await ReviewModel.findById(id);

      if (!review) {
        return res.status(404).json({ error: 'Reseña no encontrada' });
      }

      // Verificar permisos
      if (review.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permiso para eliminar esta reseña' });
      }

      const productId = review.product_id;
      await ReviewModel.delete(id);

      // Traer el producto actualizado (el trigger recalculará el rating)
      const product = await ProductModel.findById(productId);

      res.status(200).json({
        message: 'Reseña eliminada exitosamente. Rating del producto actualizado.',
        data: {
          product_rating: {
            average: product.average_rating,
            total_reviews: product.review_count
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default ReviewController;
