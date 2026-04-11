import WebPushService from './webPushService.js';

/**
 * SSEService manages active Server-Sent Events (SSE) connections.
 * It allows the server to push real-time notifications to specific users.
 */
class SSEService {
  constructor() {
    // Map of userId -> Set of Response objects (multiple tabs/devices)
    this.clients = new Map();
  }

  /**
   * Register a new client for a specific user.
   */
  addClient(userId, res) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(res);

    // Initial keep-alive or welcome message
    res.write('data: {"type": "CONNECTED"}\n\n');
    console.log(`[SSE] Client added for user: ${userId}. Total clients for this user: ${this.clients.get(userId).size}`);
  }

  /**
   * Remove a client connection on disconnect.
   */
  removeClient(userId, res) {
    if (this.clients.has(userId)) {
      const userClients = this.clients.get(userId);
      userClients.delete(res);
      console.log(`[SSE] Client removed for user: ${userId}. Remaining: ${userClients.size}`);
      
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  /**
   * Send a real-time event to ALL active sessions/tabs of a specific user.
   */
  sendToUser(userId, data) {
    // Trigger Web Push Notification asynchronously
    if (data.type === 'NEW_NOTIFICATION') {
      const { notification } = data;
      WebPushService.sendToUser(userId, {
        title: notification.title,
        body: notification.message,
        url: '/' // Puede personalizarse según la notificación
      });
    }

    if (this.clients.has(userId)) {
      const userClients = this.clients.get(userId);
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      
      userClients.forEach(res => {
        try {
          res.write(payload);
        } catch (error) {
          console.error(`[SSE] Error sending to user ${userId}:`, error.message);
        }
      });
      console.log(`[SSE] Sent ${data.type} to user ${userId} across ${userClients.size} clients.`);
      return true;
    }
    return false;
  }
}

// Export a singleton instance
export default new SSEService();
