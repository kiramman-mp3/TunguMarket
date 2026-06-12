import webpush from 'web-push';
import dotenv from 'dotenv';
import NotificationModel from '../models/notificationModel.js';

dotenv.config();

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@tungumarket.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID Keys for web-push are not configured.');
}

/**
 * Service to send web push notifications
 */
class WebPushService {
  /**
   * Send a push notification to all subscriptions of a specific user
   * @param {number|string} userId 
   * @param {object} payload - { title, body, url, icon, ... }
   */
  static async sendToUser(userId, payload) {
    try {
      const subscriptions = await NotificationModel.getPushSubscriptions(userId);
      if (!subscriptions || subscriptions.length === 0) return;

      const payloadString = JSON.stringify(payload);

      const sendPromises = subscriptions.map((sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        return webpush.sendNotification(pushSubscription, payloadString)
          .catch((err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              // TODO: Subscription has unsubscribed or expired, should delete from DB
              console.log('Subscription expired:', sub.endpoint);
            } else {
              console.error('Error sending push notification:', err);
            }
          });
      });

      await Promise.all(sendPromises);
    } catch (error) {
      console.error('Push Service Error:', error);
    }
  }
}

export default WebPushService;
