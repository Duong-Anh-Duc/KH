import NotificationModel from "../models/notification.Model";
import ErrorHandler from "../utils/ErrorHandler";

export const getNotificationsService = async () => {
  const notifications = await NotificationModel.find().sort({
    createdAt: -1,
  });
  return notifications;
};

export const updateNotificationService = async (notificationId: string) => {
  const notification = await NotificationModel.findById(notificationId);
  if (!notification) {
    throw new ErrorHandler("Không tìm thấy thông báo", 404);
  }

  notification.status = notification.status ? "read" : notification.status;
  await notification.save();

  const notifications = await NotificationModel.find().sort({
    createdAt: -1,
  });

  return notifications;
};