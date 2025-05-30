require("dotenv").config();
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { ErrorMiddleware } from "./middleware/error";
import analyticsRouter from "./routes/analytics.route";
import cartRouter from "./routes/cart.route";
import courseRouter from "./routes/course.route";
import invoiceRouter from "./routes/invoice.route";
import layoutRouter from "./routes/layout.route";
import notificationRouter from "./routes/notification.route";
import orderRouter from "./routes/order.route";
import userRouter from "./routes/user.route";
export const app = express();

// body parser
app.use(express.json({ limit: "50mb" }));

// cookie parser
app.use(cookieParser());

// cors => cross origin resource sharing
app.use(cors());

// api requests limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// routes
app.use(
  "/api/v1",
  userRouter,
  orderRouter,
  courseRouter,
  notificationRouter,
  analyticsRouter,
  layoutRouter,
  invoiceRouter,
  cartRouter
);

// testing api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    succcess: true,
    message: "API is working",
  });
});

// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

// middleware calls
app.use(limiter);
app.use(ErrorMiddleware);
