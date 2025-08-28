import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtUser } from '../decorators/get-user.decorator';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Prisma } from 'generated/prisma';

@Injectable()
export class ApiLogService {
  constructor(private prisma: PrismaService) {}

  async logApiRequest(
    req: Request,
    res: Response,
    user: JwtUser | null,
    startTime: number,
    responseBody: any, // Changed from ApiResponse to any since file endpoints don't follow this format
  ) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    try {
      // Get request ID or generate new one
      const requestId = (req.headers['x-request-id'] as string) || uuidv4();

      // Sanitize request body by removing sensitive fields
      const sanitizedBody = req.body ? this.sanitizeData(req.body) : null;

      // Handle cases where responseBody doesn't follow standard API format (e.g., file streams)
      const success =
        responseBody?.success ??
        (res.statusCode >= 200 && res.statusCode < 300);
      const message =
        responseBody?.message ??
        this.getDefaultMessage(req.path, res.statusCode);
      const errorDetails = responseBody?.errors
        ? (JSON.parse(
            JSON.stringify(responseBody.errors),
          ) as Prisma.InputJsonValue)
        : Prisma.JsonNull;

      await this.prisma.apiLog.create({
        data: {
          method: req.method,
          path: req.path,
          queryParams: req.query ? JSON.parse(JSON.stringify(req.query)) : null,
          body: sanitizedBody,
          userAgent: req.headers['user-agent'],
          ipAddress: this.getClientIp(req),
          requestId,
          userId: user?.sub,
          statusCode: res.statusCode,
          success,
          message,
          responseTime,
          responseSize: this.calculateResponseSize(responseBody),
          errorDetails,
        },
      });
    } catch (error) {
      // Log to console if logging fails - we don't want to interrupt the request
      console.error('Failed to log API request:', error);
    }
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private calculateResponseSize(responseBody: any): number | null {
    try {
      return responseBody
        ? Buffer.byteLength(JSON.stringify(responseBody))
        : null;
    } catch {
      return null;
    }
  }

  private sanitizeData(data: any): any {
    const sensitiveFields = [
      'password',
      'token',
      'refreshToken',
      'authorization',
    ];

    if (!data) return null;

    const sanitized = { ...data };
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  private getDefaultMessage(path: string, statusCode: number): string {
    // Provide meaningful default messages for different types of endpoints
    if (path.startsWith('/assets/secure/')) {
      return statusCode >= 200 && statusCode < 300
        ? 'Asset served successfully'
        : 'Asset serving failed';
    }

    // Generic fallback based on status code
    if (statusCode >= 200 && statusCode < 300) {
      return 'Request completed successfully';
    } else if (statusCode >= 400 && statusCode < 500) {
      return 'Client error occurred';
    } else if (statusCode >= 500) {
      return 'Server error occurred';
    } else {
      return 'Request processed';
    }
  }
}
