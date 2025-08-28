import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Role } from 'generated/prisma';
import { ResponseService } from '../services/response.service';

interface JwtPayload {
  sub: string;
  username: string;
  role: Role;
  tokenType?: string;
}

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  logger = new Logger(RefreshTokenGuard.name);
  constructor(
    private jwtService: JwtService,
    private responseService: ResponseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        this.responseService.unauthorized('Authorization header is missing'),
      );
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer') {
      throw new UnauthorizedException(
        this.responseService.unauthorized('Invalid authorization type'),
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      // Specifically check if this is a refresh token
      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException(
          this.responseService.unauthorized(
            'Invalid token type - refresh token required',
          ),
        );
      }

      request.user = payload;
      return true;
    } catch (error) {
      this.logger.error('Token verification error:', error);
      throw new UnauthorizedException(
        this.responseService.unauthorized('Invalid token'),
      );
    }
  }
}
