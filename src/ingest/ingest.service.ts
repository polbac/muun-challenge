import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CacheService } from '../redis/cache.service';

@Injectable()
export class IngestService {
    private readonly logger = new Logger(IngestService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly cacheService: CacheService,
    ) { }

    async ingestIps(ips: string[]): Promise<void> {
        this.logger.log(`Starting ingestion of ${ips.length} IPs`);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        try {
            // 1. Create temporary table
            this.logger.log('Creating temporary table ips_temp');

            await queryRunner.query(`DROP TABLE IF EXISTS ips_temp`);

            await queryRunner.query(`CREATE TABLE ips_temp (LIKE ips INCLUDING ALL)`);

            // 2. Insert data into temporary table
            this.logger.log('Inserting data into ips_temp');
            const BATCH_SIZE = 1000;
            for (let i = 0; i < ips.length; i += BATCH_SIZE) {
                const batch = ips.slice(i, i + BATCH_SIZE);

                const values = batch.map((_, index) => `($${index + 1})`).join(', ');
                await queryRunner.query(
                    `INSERT INTO ips_temp (ip) VALUES ${values}`,
                    batch
                );
            }
            this.logger.log('Insertion complete');

            // 3. Swap tables atomically
            this.logger.log('Swapping tables');
            await queryRunner.startTransaction();
            try {

                // Let's try the detach approach.
                const seqName = 'ips_id_seq'; // Assumption based on standard naming

                try {
                    await queryRunner.query(`ALTER SEQUENCE ${seqName} OWNED BY NONE`);
                } catch (e) {
                    // Ignore if sequence doesn't exist or other minor error
                    this.logger.warn('Could not detach sequence, maybe it does not exist or named differently', e);
                }

                await queryRunner.query(`DROP TABLE ips`);
                await queryRunner.query(`ALTER TABLE ips_temp RENAME TO ips`);

                try {
                    await queryRunner.query(`ALTER SEQUENCE ${seqName} OWNED BY ips.id`);
                } catch (e) {
                    this.logger.warn('Could not reattach sequence', e);
                }

                await queryRunner.commitTransaction();
                this.logger.log('Table swap successful');

                this.logger.log('Flushing Redis cache');
                await this.cacheService.flush();
            } catch (err) {
                this.logger.error('Transaction failed, rolling back', err);
                await queryRunner.rollbackTransaction();
                throw err;
            }

        } catch (error) {
            this.logger.error('Ingestion failed', error);
            throw error;
        } finally {

            try {
                await queryRunner.query(`DROP TABLE IF EXISTS ips_temp`);
            } catch (e) { /* ignore */ }

            await queryRunner.release();
        }
    }
}
