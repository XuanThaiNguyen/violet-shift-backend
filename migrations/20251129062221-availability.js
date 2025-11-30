const { createIndexIfNotExists } = require("../migration-helpers");

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script

    const collections = await fetchCollections(db);

    // Create collections
    console.log("🚀 ~ Creating Availability collection...");
    // Availability collections
    await createCollectionIfNotExists(db, collections, "availability", {
      bsonType: "object",
      required: ["staff", "timeFrom", "timeTo", "type"],
      properties: {
        staff: {
          bsonType: "objectId",
          description: "Staff Id refered to User collection",
        },
        type: {
          bsonType: "string",
          description: "Type of this leave or availability",
          enum: ["available", "unavailable"],
        },
        timeFrom: {
          bsonType: "number",
          description: "Starting time of this leave or availability",
        },
        timeTo: {
          bsonType: "number",
          description: "Ending time of this leave or availability",
        },
        note: {
          bsonType: "string",
          description: "Note of this leave or availability",
        },
        isDeleted: {
          bsonType: "boolean",
          description: "Soft delete flag",
        },
        isApproved: {
          bsonType: "boolean",
          description: "This leave is approved or not",
        },
        createdAt: {
          bsonType: "date",
          description: "Created at timestamp",
        },
        updatedAt: {
          bsonType: "date",
          description: "Updated at timestamp",
        },
      },
      additionalProperties: true,
    });

    // Turns schedules into 1-1 relation with shift
    console.log("🚀 ~ Creating shift unique index for staffSchedules collection...");
    await createIndexIfNotExists(
      db,
      collections,
      "staffSchedules",
      {
        shift: 1,
      },
      {
        unique: true,
      },
    );
    console.log("🚀 ~ Creating shift unique index for clientSchedules collection...");
    await createIndexIfNotExists(
      db,
      collections,
      "clientSchedules",
      {
        shift: 1,
      },
      {
        unique: true,
      },
    );
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
