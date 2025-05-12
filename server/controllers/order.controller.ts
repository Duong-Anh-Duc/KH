import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
  createMobileOrderService,
  getAllOrdersService,
  getPaymentIntentDetailsService,
  newPaymentService,
} from "../services/order.service";
import ErrorHandler from "../utils/ErrorHandler";

export const createMobileOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Bắt đầu tạo đơn hàng qua API /create-mobile-order...");
      console.log("Dữ liệu yêu cầu:", {
        userId: req.user?._id,
        body: req.body,
      });

      const userId = req.user?._id;
      if (!userId) {
        console.log("Người dùng chưa đăng nhập, yêu cầu thất bại.");
        return next(new ErrorHandler("Người dùng chưa đăng nhập", 401));
      }

      const { payment_info, selectedCourseIds } = req.body;
      console.log("Payment Info:", payment_info);
      console.log("Selected Course IDs:", selectedCourseIds);

      if (!payment_info || !selectedCourseIds || !Array.isArray(selectedCourseIds)) {
        console.log("Thiếu thông tin thanh toán hoặc danh sách khóa học không hợp lệ.");
        return next(
          new ErrorHandler("Vui lòng cung cấp thông tin thanh toán và danh sách khóa học", 400)
        );
      }

      const order = await createMobileOrderService({
        userId,
        payment_info,
        selectedCourseIds,
      });

      console.log("Đã tạo đơn hàng thành công:", order);

      res.status(201).json({
        success: true,
        order,
        message: "Tạo đơn hàng thành công",
      });
    } catch (error: any) {
      console.error("Lỗi khi tạo đơn hàng qua API /create-mobile-order:", {
        message: error.message,
        stack: error.stack,
      });
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Bắt đầu lấy tất cả đơn hàng qua API /get-all-orders...");
      const orders = await getAllOrdersService();

      console.log("Danh sách đơn hàng:", orders);

      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      console.error("Lỗi khi lấy tất cả đơn hàng:", {
        message: error.message,
        stack: error.stack,
      });
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const sendStripePublishableKey = CatchAsyncError(
  async (req: Request, res: Response) => {
    console.log("Gửi khóa công khai Stripe qua API /send-stripe-key...");
    console.log("Khóa công khai Stripe:", process.env.STRIPE_PUBLISHABLE_KEY);

    res.status(200).json({
      publishablekey: process.env.STRIPE_PUBLISHABLE_KEY,
      message: "Lấy khóa công khai Stripe thành công",
    });
  }
);

export const newPayment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Bắt đầu tạo PaymentIntent qua API /payment...");
      console.log("Dữ liệu yêu cầu:", req.body);

      const { amount } = req.body;
      const { client_secret, paymentIntentId } = await newPaymentService(amount);

      console.log("PaymentIntent được tạo:", {
        client_secret,
        paymentIntentId,
      });

      res.status(200).json({
        success: true,
        client_secret,
        paymentIntentId,
        message: "Tạo thanh toán mới thành công",
      });
    } catch (error: any) {
      console.error("Lỗi khi tạo PaymentIntent qua API /payment:", {
        message: error.message,
        stack: error.stack,
      });
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getPaymentIntentDetails = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Bắt đầu lấy chi tiết PaymentIntent qua API /payment-intent...");
      console.log("PaymentIntent ID:", req.params.id);

      const { id } = req.params;
      const details = await getPaymentIntentDetailsService(id);

      console.log("Chi tiết PaymentIntent:", details);

      res.status(200).json({
        success: true,
        ...details,
        message: "Lấy chi tiết Payment Intent thành công",
      });
    } catch (error: any) {
      console.error("Lỗi khi lấy chi tiết PaymentIntent:", {
        message: error.message,
        stack: error.stack,
      });
      return next(new ErrorHandler(error.message, 500));
    }
  }
);