import express from "express";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
import {
  getNotifications,
  getUserNotifications,
  updateNotification,
} from "../controllers/notification.controller";
const notificationRoute = express.Router();

// Route cho admin lấy tất cả thông báo
notificationRoute.get(
  "/get-all-notifications",
  isAutheticated,
  authorizeRoles("admin"),
  getNotifications
);

// Route cho user lấy thông báo của họ
notificationRoute.get(
  "/get-notifications",
  isAutheticated,
  getUserNotifications
);

notificationRoute.put(
  "/update-notification/:id",
  isAutheticated,
  authorizeRoles("admin"),
  updateNotification
);

export default notificationRoute;
