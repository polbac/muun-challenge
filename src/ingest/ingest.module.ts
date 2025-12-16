import { Module } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { IpsumModule } from '../ipsum/ipsum.module';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [IpsumModule, RedisModule],
    providers: [IngestService],
    exports: [IngestService],
})
export class IngestModule { }
