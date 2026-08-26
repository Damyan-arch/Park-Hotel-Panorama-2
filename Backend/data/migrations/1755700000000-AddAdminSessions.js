module.exports = class AddAdminSessions1755700000000 {
  name = "AddAdminSessions1755700000000";

  async up(queryRunner) {
    await queryRunner.query(`
      CREATE TABLE "admin_sessions" (
        "token" varchar(64) PRIMARY KEY,
        "expires_at" timestamptz NOT NULL
      )
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP TABLE "admin_sessions"`);
  }
};
