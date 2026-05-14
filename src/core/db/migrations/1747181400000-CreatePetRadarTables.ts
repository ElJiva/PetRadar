import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePetRadarTables1747181400000 implements MigrationInterface {
  name = 'CreatePetRadarTables1747181400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    await queryRunner.query(`
      CREATE TABLE "lost_pets" (
        "id" SERIAL NOT NULL,
        "petName" character varying NOT NULL,
        "species" integer NOT NULL,
        "description" character varying NOT NULL,
        "ownerContact" character varying NOT NULL,
        "location" geometry(Point,4326) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lost_pets" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_lost_pets_location" ON "lost_pets" USING GIST ("location")`,
    );

    await queryRunner.query(`
      CREATE TABLE "found_pets" (
        "id" SERIAL NOT NULL,
        "description" character varying NOT NULL,
        "species" integer NOT NULL,
        "reporterContact" character varying NOT NULL,
        "location" geometry(Point,4326) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_found_pets" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_found_pets_location" ON "found_pets" USING GIST ("location")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_found_pets_location"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "found_pets"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lost_pets_location"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lost_pets"`);
  }
}
