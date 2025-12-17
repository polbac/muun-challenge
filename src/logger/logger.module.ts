import { Module, Global } from '@nestjs/common';
import { DatadogLogger } from './datadog-logger.service';

@Global()
@Module({
    providers: [DatadogLogger],
    exports: [DatadogLogger],
})
export class LoggerModule { }
