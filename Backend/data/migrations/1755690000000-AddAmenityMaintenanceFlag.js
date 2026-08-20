module.exports = class AddAmenityMaintenanceFlag1755690000000 {
  name = "AddAmenityMaintenanceFlag1755690000000";

  async up(queryRunner) {
    await queryRunner.query(`
      ALTER TABLE "amenities" ADD COLUMN "under_maintenance" boolean NOT NULL DEFAULT false
    `);
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "amenities" DROP COLUMN "under_maintenance"`);
  }
};
