import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ResponseService } from '../services/response.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private responseService: ResponseService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException(
        this.responseService.unauthorized('API key is missing'),
      );
    }

    const validApiKey = this.configService.get<string>('API_KEY');
    if (apiKey !== validApiKey) {
      throw new UnauthorizedException(
        this.responseService.unauthorized('Invalid API key'),
      );
    }

    return true;
  }
}
