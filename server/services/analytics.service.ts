import { generateLast12MothsData } from "../utils/analytics.generator";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import OrderModel from "../models/order.Model";
import ErrorHandler from "../utils/ErrorHandler";

export const getUsersAnalyticsService = async () => {
  try {
    const users = await generateLast12MothsData(userModel);
    return users;
  } catch (error: any) {
    throw new ErrorHandler(error.message, 500);
  }
};

export const getCoursesAnalyticsService = async () => {
  try {
    const courses = await generateLast12MothsData(CourseModel);
    return courses;
  } catch (error: any) {
    throw new ErrorHandler(error.message, 500);
  }
};

export const getOrderAnalyticsService = async () => {
  try {
    const orders = await generateLast12MothsData(OrderModel);
    return orders;
  } catch (error: any) {
    throw new ErrorHandler(error.message, 500);
  }
};