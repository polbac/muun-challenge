import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminAuthMiddleware } from './admin-auth.middleware';
import { AuthModule } from '../auth/auth.module';
import { IpsumModule } from '../ipsum/ipsum.module';
import { IngestModule } from '../ingest/ingest.module';

@Module({
  imports: [AuthModule, IpsumModule, IngestModule],
  controllers: [AdminController],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AdminAuthMiddleware).forRoutes(AdminController);
  }
}
