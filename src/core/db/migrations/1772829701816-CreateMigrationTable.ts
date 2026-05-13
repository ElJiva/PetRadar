import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMigrationTable1772829701816 implements MigrationInterface {
    name = 'CreateMigrationTable1772829701816'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
        await queryRunner.query(`CREATE TABLE "incident" ("id" SERIAL NOT NULL, "location" geometry(Point,4326) NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "type" integer NOT NULL, "created_ad" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5f90b28b0b8238d89ee8edcf96e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "incident"`);
    }

}
