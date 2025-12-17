import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Controller('status')
export class AppController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private config: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () =>
        this.microservice.pingCheck('redis', {
          transport: Transport.REDIS,
          options: {
            host: this.config.get('REDIS_HOST'),
            port: this.config.get('REDIS_PORT'),
          },
        }),
    ]);
  }
}
