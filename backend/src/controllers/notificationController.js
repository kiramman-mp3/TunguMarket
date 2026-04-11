import NotificationModel from '../models/notificationModel.js';

class NotificationController {
  static async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const notifications = await NotificationModel.getByUser(userId);
      res.status(200).json({ data: notifications });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      await NotificationModel.markAsRead(id, userId);
      res.status(200).json({ message: 'Notificación marcada como leída' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      await NotificationModel.markAllAsRead(userId);
      res.status(200).json({ message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default NotificationController;
