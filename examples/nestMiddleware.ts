import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import rbac, { createNestMiddleware } from '@rbac/rbac';
import type { Roles } from '@rbac/rbac';
import { USER, PRODUCTS_FIND } from './constants';

const roles: Roles = {
  [USER]: { can: [PRODUCTS_FIND] }
};

const RBAC = rbac()(roles);
const canFindProducts = createNestMiddleware(RBAC)(PRODUCTS_FIND);

@Module({})
class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(canFindProducts).forRoutes('products');
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap().catch(console.error);
