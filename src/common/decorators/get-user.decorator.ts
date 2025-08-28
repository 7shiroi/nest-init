import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from 'generated/prisma';

export interface JwtUser {
  sub: string;
  username: string;
  role: Role;
  tokenType?: string;
}

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
