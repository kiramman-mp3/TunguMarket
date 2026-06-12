import WishlistModel from '../models/wishlistModel.js';

class WishlistController {
  static async toggleFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ error: 'ID de producto requerido' });
      }

      const isFavorite = await WishlistModel.isFavorite(userId, productId);

      if (isFavorite) {
        await WishlistModel.remove(userId, productId);
        return res.status(200).json({ message: 'Eliminado de favoritos', isFavorite: false });
      } else {
        await WishlistModel.add(userId, productId);
        return res.status(200).json({ message: 'Añadido a favoritos', isFavorite: true });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getFavorites(req, res) {
    try {
      const userId = req.user.id;
      const favorites = await WishlistModel.getByUser(userId);
      res.status(200).json({ data: favorites });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default WishlistController;
