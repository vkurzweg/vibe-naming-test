// server/src/services/notificationService.js
const User = require('../models/User');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    // You can use different notification channels (email, in-app, etc.)
    this.channels = {
      email: this.sendEmailNotification,
      inApp: this.sendInAppNotification
    };
  }

  async notifyRequestUpdate(request, userId, message) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        logger.error(`User ${userId} not found for notification`);
        return;
      }

      // Get user's preferred notification channels
      const channels = user.notificationPreferences || ['inApp'];
      
      // Send notifications through all preferred channels
      for (const channel of channels) {
        if (this.channels[channel]) {
          await this.channels[channel](user, request, message);
        }
      }

    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  async sendEmailNotification(user, request, message) {
    // TODO: Implement email sending logic
    logger.info(`Email notification sent to ${user.email}: ${message}`);
  }

  async sendInAppNotification(user, request, message) {
    try {
      // Add notification to user's notifications array
      await User.findByIdAndUpdate(user._id, {
        $push: {
          notifications: {
            type: 'naming_request_update',
            message,
            requestId: request._id,
            isRead: false,
            createdAt: new Date()
          }
        }
      });
      logger.info(`In-app notification created for user ${user._id}`);
    } catch (error) {
      logger.error('Error creating in-app notification:', error);
    }
  }
}

module.exports = new NotificationService();