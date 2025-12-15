import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IpsumService } from './ipsum.service';

@Module({
    imports: [HttpModule],
    providers: [IpsumService],
    exports: [IpsumService],
})
export class IpsumModule { }
