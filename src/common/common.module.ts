import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { ResponseService } from './services/response.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiLogService } from './services/api-log.service';
import { RolesGuard } from './guards/roles.guard';
import { AssetsModule } from '../modules/assets/assets.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '30m' },
      }),
      inject: [ConfigService],
    }),
    AssetsModule,
  ],
  providers: [
    ResponseService,
    ApiLogService,
    RolesGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    JwtAuthGuard,
  ],
  exports: [
    ResponseService,
    JwtAuthGuard,
    JwtModule,
    ApiLogService,
    RolesGuard,
  ],
})
export class CommonModule {}
