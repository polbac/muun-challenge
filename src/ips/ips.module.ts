import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ip } from './ip.entity';
import { IpsService } from './ips.service';
import { IpsRepository } from './ips.repository';
import { IpsController } from './ips.controller';

import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ip]), RedisModule, AuthModule],
  controllers: [IpsController],
  providers: [IpsService, IpsRepository],
  exports: [IpsService],
})
export class IpsModule {}
