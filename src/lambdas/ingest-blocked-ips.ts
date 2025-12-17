import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { IpsumService } from '../ipsum/ipsum.service';
import { IngestService } from '../ingest/ingest.service';
import { Logger } from '@nestjs/common';

export async function ingestBlockedIps() {
    const logger = new Logger('IngestBlockedIps');
    logger.log('Starting Ingest Blocked IPs Lambda');

    const app = await NestFactory.createApplicationContext(AppModule);

    try {
        const ipsumService = app.get(IpsumService);
        const ingestService = app.get(IngestService);

        logger.log('Fetching IPs...');
        const ips = await ipsumService.fetchIps();
        logger.log(`Fetched ${ips.length} IPs. Ingesting...`);

        await ingestService.ingestIps(ips);
        logger.log('Ingestion completed successfully.');
    } catch (error) {
        logger.error('Error during ingestion', error);
        process.exit(1);
    } finally {
        await app.close();
    }
}

if (require.main === module) {
    ingestBlockedIps();
}
