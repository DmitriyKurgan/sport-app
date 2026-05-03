import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetTokens1713000300000 implements MigrationInterface {
  name = 'AddPasswordResetTokens1713000300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id"     uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash"  varchar(64) NOT NULL,
        "expires_at"  timestamp NOT NULL,
        "used_at"     timestamp,
        "created_at"  timestamp NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_prt_token_hash" ON "password_reset_tokens" ("token_hash");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_prt_user" ON "password_reset_tokens" ("user_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens";`);
  }
}
