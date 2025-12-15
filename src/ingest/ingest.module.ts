import { Module } from '@nestjs/common';
import { IngestService } from './ingest.service';
import { IpsumModule } from '../ipsum/ipsum.module';

@Module({
    imports: [IpsumModule],
    providers: [IngestService],
    exports: [IngestService],
})
export class IngestModule { }
