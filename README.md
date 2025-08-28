## NestJS Starter Template

Production-ready NestJS starter you can clone instead of running `nest new`.

It includes sensible defaults: Prisma (PostgreSQL), Redis cache utilities, JWT and role guards, API key guard, structured API responses, request/exception logging to DB, and a secure assets module with temporary URLs.

### Quick start (use as a template)

1. Create a new project from this folder

```bash
git clone git@github.com:7shiroi/nest-init.git my-new-service
cd my-new-service
```

2. Reset Git history (optional)

```bash
rm -rf .git && git init && git add . && git commit -m "init: scaffold from template starter"
```

3. Install dependencies

```bash
npm install
```

4. Configure environment

Create a `.env` file in the project root:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dbname?schema=public"

# Auth
JWT_SECRET="change-me"
API_KEY="dev-api-key"

# Redis
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"
REDIS_PASSWORD=""
```

5. Prepare Prisma and DB

```bash
npx prisma migrate dev
npx prisma generate
```

6. Run the app

```bash
# development
npm run start:dev

# production build
npm run build && npm run start:prod
```

### What's included

- Core
  - NestJS v11, TypeScript v5, ESLint + Prettier
  - `@nestjs/config` ready for `.env`
- Database (Prisma + PostgreSQL)
  - Schema in `prisma/schema.prisma`
  - Generated client output to `generated/prisma`
  - `PrismaService` and `PrismaModule` in `src/prisma/`
  - `ApiLog` model for persisted request/exception logs
- Redis utilities
  - `RedisService` for get/set/del/scan helpers, TTL support
  - `RedisModule` is global and injectable anywhere
  - Connection configured via `REDIS_*` env vars
- Common layer
  - `TransformInterceptor` for consistent API response shape
  - `ResponseService` helpers for success/paginated/error responses
  - Guards: `JwtAuthGuard`, `RolesGuard`, `ApiKeyGuard`
  - `ApiLogService` to persist request logs and errors to DB
  - Exception filter for error logging: `ApiLogExceptionFilter`
- Assets module
  - Temporary signed URLs (`/assets/temp-url/:assetId`)
  - Secure serving endpoint (`/assets/secure/:token`)
  - Uses Redis for token TTL, stores file metadata in DB (`Asset`)

### Wiring things up

Some features are provided but not wired globally by default, so you can opt-in per project:

1. Global response wrapper and common providers

Import `CommonModule` into your root `AppModule` to enable the global `TransformInterceptor` and make guards/services available:

```ts
// src/app.module.ts
import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AssetsModule } from './modules/assets/assets.module';

@Module({
  imports: [CommonModule, AssetsModule],
})
export class AppModule {}
```

2. Global error logging (optional)

If you want to persist exceptions to the `ApiLog` table, register the exception filter in `main.ts`:

```ts
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiLogExceptionFilter } from './common/filters/api-log-exception.filter';
import { ApiLogService } from './common/services/api-log.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ApiLogExceptionFilter(app.get(ApiLogService)));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

3. Uploads directory

The assets service reads from `uploads/` at the project root. Create it and place files as needed. Asset metadata lives in the `Asset` table.

### Environment variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: used by `JwtModule` for signing/verification
- `API_KEY`: expected by `ApiKeyGuard` (`x-api-key` header)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Redis connection

### NPM scripts

```bash
# start
npm run start           # dev (no watch)
npm run start:dev       # dev (watch)
npm run start:prod      # run compiled dist

# build
npm run build

# code style
npm run format
npm run lint

# tests
npm run test
npm run test:e2e
npm run test:cov
```

### Project structure (high-level)

```
src/
  common/                # response helpers, guards, interceptors, filters
  modules/
    assets/              # secure assets module (temp URLs)
  prisma/                # PrismaModule + PrismaService
  redis/                 # RedisModule + RedisService
  config/                # config snippets (e.g. redis microservice options)
  main.ts                # app bootstrap
prisma/
  schema.prisma          # models: User, ApiLog, Asset, Role enum
generated/prisma/        # prisma client output
uploads/                 # local file storage (create this)
```

### Notes

- Prisma client output is configured to `generated/prisma`. Do not move it without updating `schema.prisma` and imports.
- Swagger decorators are present in the assets module; add Swagger bootstrap in `main.ts` if you want the UI.
- Guards/services are provided; apply them on controllers or register globally as needed.

### License

MIT
