import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { Role } from 'generated/prisma';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtUser } from '../decorators/get-user.decorator';
import { ResponseService } from '../services/response.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private responseService: ResponseService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtUser;

    if (!user || !requiredRoles.some((role) => user.role === role)) {
      throw new ForbiddenException(
        this.responseService.forbidden('Insufficient permissions'),
      );
    }

    return true;
  }
}
