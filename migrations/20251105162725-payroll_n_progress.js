module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // TODO write your migration here.

    // Collection: Fundings
    // Change field userId to client
    const fStatus = await db
      .collection("fundings")
      .updateMany({}, { $rename: { userId: "client" } });
    console.log(`🚀 Migration: Fundings - Status: ${fStatus.modifiedCount} row(s) updated`);

    // Collection: shifts
    // Add field timezone also update timezone to default timezone if not exists
    const sStatus = await db
      .collection("shifts")
      .updateMany({}, { $set: { timezone: process.env.TZ || "Australia/Sydney" } });
    console.log(`🚀 Migration: Shifts - Status: ${sStatus.modifiedCount} row(s) updated`);

    // Collection: Staff Schedules
    // Change clientSignatures: [string] -> clientSignature: { url, note, createdAt }
    // Change signature: string -> signature: { url, note, createdAt }
    const ssStatus = await db
      .collection("staff_schedules")
      .updateMany({}, { $rename: { clientSignatures: "clientSignature" } });
    console.log(`🚀 Migration: Staff Schedules - Status: ${ssStatus.modifiedCount} row(s) updated`);
    // due to no signature field in staff_schedules collection, we don't need to migrate signature field

    // Collection: Worklogs
    // Sync all staff schedules to worklogs collection

    // Collection: Worklog Segments
    // break worklog into segments
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  },
};
