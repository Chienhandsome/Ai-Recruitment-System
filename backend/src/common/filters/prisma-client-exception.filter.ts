import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientInitializationError, Prisma.PrismaClientRustPanicError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientInitializationError
      | Prisma.PrismaClientRustPanicError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error(
        `Prisma database initialization/connection error: ${exception.message}`,
      );
      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau giây lát.',
        error: 'Service Unavailable',
      });
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(
        `Prisma error [${exception.code}]: ${exception.message}`,
      );

      switch (exception.code) {
        case 'P2002': {
          const target = (exception.meta?.target as string[])?.join(', ') ?? 'field';
          return response.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            message: `Dữ liệu đã tồn tại (trùng lặp trường: ${target}).`,
            error: 'Conflict',
          });
        }
        case 'P2025': {
          return response.status(HttpStatus.NOT_FOUND).json({
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Bản ghi không tồn tại hoặc đã bị xóa.',
            error: 'Not Found',
          });
        }
        case 'P2003': {
          return response.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Ràng buộc khóa ngoại không hợp lệ hoặc dữ liệu tham chiếu không tồn tại.',
            error: 'Bad Request',
          });
        }
        case 'P2024': {
          return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'Hệ thống đang quá tải kết nối cơ sở dữ liệu (Connection pool timeout). Vui lòng thử lại sau ít phút.',
            error: 'Service Unavailable',
          });
        }
        default: {
          return response.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            message: `Lỗi truy vấn cơ sở dữ liệu: ${exception.message.split('\n').pop()?.trim() || exception.message}`,
            error: 'Bad Request',
          });
        }
      }
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Lỗi xử lý cơ sở dữ liệu nội bộ.',
      error: 'Internal Server Error',
    });
  }
}
