import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CacheService } from '../redis/cache.service';
import { from as copyFrom } from 'pg-copy-streams';
import { Readable } from 'stream';

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

      // 2. Remove temp table if exists
      await queryRunner.query(`DROP TABLE IF EXISTS ips_temp`);

      // 3. Copy table structure
      await queryRunner.query(`CREATE TABLE ips_temp (LIKE ips INCLUDING ALL)`);


      this.logger.log(`Copying ${ips.length} IPs into ips_temp using COPY`);

      // Access the native PostgreSQL client
      const pool = (queryRunner.connection.driver as any).master;
      const client = await pool.connect();

      try {
        // 4. Create COPY stream
        const copyStream = client.query(
          copyFrom('COPY ips_temp (ip) FROM STDIN'),
        );

        // 5. Create readable stream from IP array
        const dataStream = Readable.from(ips.map((ip) => `${ip}\n`));

        // 6. Pipe data to COPY stream
        await new Promise((resolve, reject) => {
          dataStream.pipe(copyStream);
          copyStream.on('finish', resolve);
          copyStream.on('error', reject);
          dataStream.on('error', reject);
        });

        this.logger.log('COPY operation complete');
      } finally {
        // 7. Release the client back to the pool
        client.release();
      }

      // 8. Swap tables atomically
      this.logger.log('Swapping tables');
      await queryRunner.startTransaction();
      try {
        const seqName = 'ips_id_seq';

        // 9. Detach sequence
        try {
          await queryRunner.query(`ALTER SEQUENCE ${seqName} OWNED BY NONE`);
        } catch (e) {
          this.logger.warn(
            'Could not detach sequence, maybe it does not exist or named differently',
            e,
          );
        }

        // 10. Drop old table
        await queryRunner.query(`DROP TABLE ips`);

        // 11. Rename temp table to ips
        await queryRunner.query(`ALTER TABLE ips_temp RENAME TO ips`);

        // 12. Reattach sequence
        try {
          await queryRunner.query(`ALTER SEQUENCE ${seqName} OWNED BY ips.id`);
        } catch (e) {
          this.logger.warn('Could not reattach sequence', e);
        }

        // 13. Commit transaction
        await queryRunner.commitTransaction();
        this.logger.log('Table swap successful');

        this.logger.log('Flushing Redis cache');
        await this.cacheService.flush();
      } catch (err) {
        this.logger.error('Transaction failed, rolling back', err);
        // 14. Rollback transaction if failed
        await queryRunner.rollbackTransaction();
        throw err;
      }
    } catch (error) {
      this.logger.error('Ingestion failed', error);
      throw error;
    } finally {
      try {
        // 15. Drop temp table if exists
        await queryRunner.query(`DROP TABLE IF EXISTS ips_temp`);
      } catch (e) {
        /* ignore */
      }

      await queryRunner.release();
    }
  }
}
