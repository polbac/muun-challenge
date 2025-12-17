import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIpsTable1702480000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "ips" (
                "id" SERIAL NOT NULL,
                "ip" inet NOT NULL,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT "UQ_ips_ip" UNIQUE ("ip"),
                CONSTRAINT "PK_ips_id" PRIMARY KEY ("id")
            )`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_ips_ip" ON "ips" ("ip")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_ips_ip"`);
    await queryRunner.query(`DROP TABLE "ips"`);
  }
}
