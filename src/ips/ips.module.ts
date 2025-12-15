import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ip } from './ip.entity';
import { IpsService } from './ips.service';
import { IpsRepository } from './ips.repository';
import { IpsController } from './ips.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Ip])],
    controllers: [IpsController],
    providers: [IpsService, IpsRepository],
    exports: [IpsService],
})
export class IpsModule { }
