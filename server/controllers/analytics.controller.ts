import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CourseModel from "../models/course.model";
import OrderModel from "../models/order.Model";
import userModel from "../models/user.model";
import {
  getCoursesAnalyticsService,
  getOrderAnalyticsService,
  getUsersAnalyticsService,
} from "../services/analytics.service";
import ErrorHandler from "../utils/ErrorHandler";

export const getUsersAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await getUsersAnalyticsService();

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getCoursesAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await getCoursesAnalyticsService();

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getOrderAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await getOrderAnalyticsService();

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
export const getUsersCount = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await userModel.countDocuments();
      res.status(200).json({
        success: true,
        count,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getCoursesCount = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await CourseModel.countDocuments();
      res.status(200).json({
        success: true,
        count,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getOrdersCount = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await OrderModel.countDocuments();
      res.status(200).json({
        success: true,
        count,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);