import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
  createLayoutService,
  editLayoutService,
  getFilterOptionsService,
  getLayoutByTypeService,
} from "../services/layout.service";
import ErrorHandler from "../utils/ErrorHandler";

export const createLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createLayoutService(req.body);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const editLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await editLayoutService(req.body);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getLayoutByType = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.params;
      const layout = await getLayoutByTypeService(type);

      res.status(201).json({
        success: true,
        layout,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getFilterOptions = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await getFilterOptionsService();

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);