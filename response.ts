import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/common.types';

export class ResponseUtil {
  static success<T>(
    res: Response, 
    data?: T, 
    message?: string, 
    statusCode: number = 200
  ): Response<ApiResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      data,
      message
    });
  }

  static error(
    res: Response,
    error: string,
    statusCode: number = 400
  ): Response<ApiResponse> {
    return res.status(statusCode).json({
      success: false,
      error
    });
  }

  static created<T>(res: Response, data: T, message?: string): Response<ApiResponse<T>> {
    return this.success(res, data, message, 201);
  }
}