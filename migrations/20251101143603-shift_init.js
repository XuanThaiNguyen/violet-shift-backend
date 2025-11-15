const {
  fetchCollections,
  createIndexIfNotExists,
  createCollectionIfNotExists,
} = require("../migration-helpers");

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const collections = await fetchCollections(db);

    // Create collections
    console.log("Creating collections...");
    // User collections
    await createCollectionIfNotExists(db, collections, "roles", {
      bsonType: "object",
      required: ["name"],
      properties: {
        name: {
          bsonType: "string",
          description: "Role name must be a string and is required",
        },
        description: {
          bsonType: "string",
          description: "Role description must be a string",
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
    await createCollectionIfNotExists(db, collections, "users", {
      bsonType: "object",
      required: ["email", "role"],
      properties: {
        email: {
          bsonType: "string",
          description: "User email address",
        },
        role: {
          bsonType: "objectId",
          description: "Reference to roles collection",
        },
        firstName: {
          bsonType: "string",
          description: "User first name",
        },
        lastName: {
          bsonType: "string",
          description: "User last name",
        },
        middleName: {
          bsonType: "string",
          description: "User middle name",
        },
        fullName: {
          bsonType: "string",
          description: "User full name",
        },
        preferredName: {
          bsonType: "string",
          description: "User preferred name",
        },
        gender: {
          bsonType: "string",
          enum: ["male", "female", "intersex", "non-binary", "unspecified", "other"],
          description: "User gender",
        },
        birthdate: {
          bsonType: "date",
          description: "User birthdate",
        },
        joinedAt: {
          bsonType: "date",
          description: "Date user joined",
        },
        languages: {
          bsonType: "array",
          items: { bsonType: "string" },
          description: "User languages array",
        },
        hasSetProfile: {
          bsonType: "bool",
          description: "Whether user has set up profile",
        },
        mobileNumber: {
          bsonType: "string",
          description: "User mobile number",
        },
        phoneNumber: {
          bsonType: "string",
          description: "User phone number",
        },
        employmentType: {
          bsonType: "string",
          enum: ["full_time", "part_time", "contract", "casual", "other"],
          description: "Employment type",
        },
        address: {
          bsonType: "string",
          description: "User address",
        },
        isArchived: {
          bsonType: "bool",
          description: "Whether user is archived",
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
    await createCollectionIfNotExists(db, collections, "member_invitations", {
      bsonType: "object",
      required: ["userId", "address"],
      properties: {
        userId: {
          bsonType: "objectId",
          description: "Reference to users collection",
        },
      },
      additionalProperties: true,
    });
    // Client collections
    await createCollectionIfNotExists(db, collections, "clients", {
      bsonType: "object",
      required: ["email", "status"],
      properties: {
        salutation: {
          bsonType: "string",
          enum: ["Mr", "Mrs", "Ms", "Miss", "Mx", "Dr", "Prof", "Them", "They", ""],
          description: "Client salutation",
        },
        firstName: {
          bsonType: "string",
          description: "Client first name",
        },
        lastName: {
          bsonType: "string",
          description: "Client last name",
        },
        middleName: {
          bsonType: "string",
          description: "Client middle name",
        },
        preferredName: {
          bsonType: "string",
          description: "Client preferred name",
        },
        gender: {
          bsonType: "string",
          enum: ["male", "female", "intersex", "non_binary", "unspecified", "other"],
          description: "Client gender",
        },
        email: {
          bsonType: "string",
          description: "Client email address",
        },
        birthdate: {
          bsonType: "date",
          description: "Client birthdate",
        },
        address: {
          bsonType: "string",
          description: "Client address",
        },
        apartmentNumber: {
          bsonType: "string",
          description: "Apartment number",
        },
        mobileNumber: {
          bsonType: "string",
          description: "Client mobile number",
        },
        phoneNumber: {
          bsonType: "string",
          description: "Client phone number",
        },
        religion: {
          bsonType: "string",
          description: "Client religion",
        },
        maritalStatus: {
          bsonType: "string",
          enum: ["single", "married", "de_facto", "divorced", "separated", "widowed"],
          description: "Marital status",
        },
        nationality: {
          bsonType: "string",
          description: "Client nationality",
        },
        languages: {
          bsonType: "array",
          items: { bsonType: "string" },
          description: "Client languages array",
        },
        status: {
          bsonType: "string",
          enum: ["active", "inactive", "prospect"],
          description: "Client status",
        },
        isArchived: {
          bsonType: "bool",
          description: "Whether client is archived",
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
    await createCollectionIfNotExists(db, collections, "price_books", {
      bsonType: "object",
      required: ["name"],
      properties: {
        name: {
          bsonType: "string",
          description: "Price book name",
        },
        isArchived: {
          bsonType: "bool",
          description: "Whether price book is archived",
        },
        rules: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["dayOfWeek", "timeFrom", "timeTo", "perHour", "perKm", "effectiveDate"],
            properties: {
              dayOfWeek: {
                bsonType: "string",
                enum: ["holidays", "weekdays", "saturday", "sunday"],
                description: "Day of week",
              },
              timeFrom: {
                bsonType: "number",
                description: "Time from in minutes",
              },
              timeTo: {
                bsonType: "number",
                description: "Time to in minutes",
              },
              perHour: {
                bsonType: "number",
                description: "Rate per hour",
              },
              referenceNumberHour: {
                bsonType: "number",
                description: "Reference number for hour",
              },
              perKm: {
                bsonType: "number",
                description: "Rate per kilometer",
              },
              referenceNumberKm: {
                bsonType: "number",
                description: "Reference number for km",
              },
              effectiveDate: {
                bsonType: "date",
                description: "Effective date",
              },
            },
          },
          description: "Price book rules array",
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
    await createCollectionIfNotExists(db, collections, "fundings", {
      bsonType: "object",
      required: ["userId", "name"],
      properties: {
        userId: {
          bsonType: "objectId",
          description: "Reference to users collection",
        },
        name: {
          bsonType: "string",
          description: "Funding name",
        },
        startDate: {
          bsonType: "date",
          description: "Funding start date",
        },
        expireDate: {
          bsonType: "date",
          description: "Funding expiration date",
        },
        amount: {
          bsonType: "number",
          description: "Funding amount",
        },
        balance: {
          bsonType: "number",
          description: "Funding balance",
        },
        isDefault: {
          bsonType: "bool",
          description: "Whether this is the default funding",
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

    // Shift collections
    await createCollectionIfNotExists(db, collections, "shifts", {
      bsonType: "object",
      properties: {
        shiftType: {
          bsonType: "string",
          enum: [
            "personal_care",
            "board_n_lodging",
            "domestic_assistance",
            "night_shift",
            "on_call",
            "recall_to_work",
            "remote_work",
            "respite_care",
            "sleepover",
            "support_coordination",
            "transport",
            "24_hour_care",
          ],
          description: "Shift type",
        },
        additionalShiftTypes: {
          bsonType: "array",
          items: {
            bsonType: "string",
            enum: [
              "personal_care",
              "board_n_lodging",
              "domestic_assistance",
              "night_shift",
              "on_call",
              "recall_to_work",
              "remote_work",
              "respite_care",
              "sleepover",
              "support_coordination",
              "transport",
              "24_hour_care",
            ],
          },
          description: "Additional shift types",
        },
        allowances: {
          bsonType: "array",
          items: {
            bsonType: "string",
            enum: ["expense", "mileage", "sleepover"],
          },
          description: "Shift allowances",
        },
        mileageInvoicing: {
          bsonType: "array",
          items: { bsonType: "objectId" },
          description: "Mileage invoicing clients",
        },
        shiftMileage: {
          bsonType: "number",
          description: "Shift mileage",
        },
        additionalCost: {
          bsonType: "number",
          description: "Additional cost",
        },
        ignoreStaffCount: {
          bsonType: "bool",
          description: "Ignore staff count",
        },
        confirmationRequired: {
          bsonType: "bool",
          description: "Confirmation required",
        },
        acceptedDeclinable: {
          bsonType: "bool",
          description: "Accepted declinable",
        },
        timeFrom: {
          bsonType: "number",
          description: "Start time unix timestamp",
        },
        timeTo: {
          bsonType: "number",
          description: "End time unix timestamp",
        },
        breakTime: {
          bsonType: "number",
          description: "Break time in minutes",
        },
        address: {
          bsonType: "string",
          description: "Shift address",
        },
        unitNumber: {
          bsonType: "string",
          description: "Unit number",
        },
        bonus: {
          bsonType: "number",
          description: "Bonus amount",
        },
        dropOffAddress: {
          bsonType: "string",
          description: "Drop off address",
        },
        dropOffUnitNumber: {
          bsonType: "string",
          description: "Drop off unit number",
        },
        repeat: {
          bsonType: "objectId",
          description: "Reference to shift_repeats collection",
        },
        instruction: {
          bsonType: "string",
          description: "Shift instruction rich text",
        },
        mileageCap: {
          bsonType: "number",
          description: "Mileage cap in miles",
        },
        mileage: {
          bsonType: "number",
          description: "Mileage in miles",
        },
        isCompanyVehicle: {
          bsonType: "bool",
          description: "Is company vehicle",
        },
        clientClockOutRequired: {
          bsonType: "bool",
          description: "Client clock out required",
        },
        staffClockOutRequired: {
          bsonType: "bool",
          description: "Staff clock out required",
        },
        isDeleted: {
          bsonType: "bool",
          description: "Soft delete flag",
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
    await createCollectionIfNotExists(db, collections, "shift_tasks", {
      bsonType: "object",
      required: ["shift", "name"],
      properties: {
        shift: {
          bsonType: "objectId",
          description: "Reference to shifts collection",
        },
        repetitiveId: {
          bsonType: "string",
          description: "Repetitive ID for bulk operations",
        },
        name: {
          bsonType: "string",
          description: "Task name",
        },
        description: {
          bsonType: "string",
          description: "Task description",
        },
        isMandatory: {
          bsonType: "bool",
          description: "Whether task is mandatory",
        },
        isCompleted: {
          bsonType: "bool",
          description: "Whether task is completed",
        },
        completedAt: {
          bsonType: "date",
          description: "Completion date",
        },
        isDeleted: {
          bsonType: "bool",
          description: "Soft delete flag",
        },
      },
      additionalProperties: true,
    });
    await createCollectionIfNotExists(db, collections, "staff_schedules", {
      bsonType: "object",
      required: ["shift", "staff", "paymentMethod", "timeFrom", "timeTo", "clientNames"],
      properties: {
        shift: {
          bsonType: "objectId",
          description: "Reference to shifts collection",
        },
        staff: {
          bsonType: "objectId",
          description: "Reference to users collection",
        },
        paymentMethod: {
          bsonType: "string",
          enum: ["default", "cash"],
          description: "Payment method",
        },
        timeFrom: {
          bsonType: "number",
          description: "Start time unix timestamp",
        },
        timeTo: {
          bsonType: "number",
          description: "End time unix timestamp",
        },
        clientNames: {
          bsonType: "array",
          items: { bsonType: "string" },
          description: "Client names array",
        },
        clocksInAt: {
          bsonType: "number",
          description: "Clock in time unix timestamp",
        },
        clocksOutAt: {
          bsonType: "number",
          description: "Clock out time unix timestamp",
        },
        signature: {
          bsonType: "string",
          description: "Staff signature",
        },
        clientSignature: {
          bsonType: "string",
          description: "Client signature",
        },
        isDeleted: {
          bsonType: "bool",
          description: "Soft delete flag",
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
    await createCollectionIfNotExists(db, collections, "client_schedules", {
      bsonType: "object",
      required: ["shift", "client", "priceBook", "fund", "timeFrom", "timeTo"],
      properties: {
        shift: {
          bsonType: "objectId",
          description: "Reference to shifts collection",
        },
        client: {
          bsonType: "objectId",
          description: "Reference to clients collection",
        },
        priceBook: {
          bsonType: "objectId",
          description: "Reference to price_books collection",
        },
        fund: {
          bsonType: "objectId",
          description: "Reference to fundings collection",
        },
        repetitiveId: {
          bsonType: "string",
          description: "Repetitive ID for bulk operations",
        },
        timeFrom: {
          bsonType: "number",
          description: "Start time unix timestamp",
        },
        timeTo: {
          bsonType: "number",
          description: "End time unix timestamp",
        },
        isDeleted: {
          bsonType: "bool",
          description: "Soft delete flag",
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
    await createCollectionIfNotExists(db, collections, "shift_repeats", {
      bsonType: "object",
      required: ["pattern", "endDate", "tz"],
      properties: {
        pattern: {
          bsonType: "string",
          description: "Cron pattern for repeat schedule",
        },
        endDate: {
          bsonType: "number",
          description: "End date unix timestamp",
        },
        tz: {
          bsonType: "string",
          description: "Timezone",
        },
        isDeleted: {
          bsonType: "bool",
          description: "Soft delete flag",
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

    console.log("\nCreating indexes...");

    // Users indexes
    console.log("Setting up indexes for users...");
    await createIndexIfNotExists(db, collections, "users", { email: 1 }, { unique: true });
    await createIndexIfNotExists(db, collections, "users", { mobileNumber: 1 });
    await createIndexIfNotExists(db, collections, "users", { phoneNumber: 1 });
    await createIndexIfNotExists(db, collections, "users", { role: 1 });
    await createIndexIfNotExists(db, collections, "users", { isArchived: 1 });
    await createIndexIfNotExists(db, collections, "users", { createdAt: -1 });

    // Roles indexes
    console.log("Setting up indexes for roles...");
    await createIndexIfNotExists(db, collections, "roles", { name: 1 }, { unique: true });

    // Clients indexes
    console.log("Setting up indexes for clients...");
    await createIndexIfNotExists(db, collections, "clients", { email: 1 });
    await createIndexIfNotExists(db, collections, "clients", { isArchived: 1 });
    await createIndexIfNotExists(db, collections, "clients", { createdAt: -1 });

    // Shifts indexes
    console.log("Setting up indexes for shifts...");
    await createIndexIfNotExists(db, collections, "shifts", { repeat: 1 });
    await createIndexIfNotExists(db, collections, "shifts", { timeFrom: 1, timeTo: 1 });
    await createIndexIfNotExists(db, collections, "shifts", { isDeleted: 1 });
    await createIndexIfNotExists(db, collections, "shifts", { shiftType: 1 });
    await createIndexIfNotExists(db, collections, "shifts", { createdAt: -1 });

    // Shift Tasks indexes
    console.log("Setting up indexes for shift_tasks...");
    await createIndexIfNotExists(db, collections, "shift_tasks", { shift: 1 });
    await createIndexIfNotExists(db, collections, "shift_tasks", { repetitiveId: 1 });
    await createIndexIfNotExists(db, collections, "shift_tasks", { isDeleted: 1 });
    await createIndexIfNotExists(db, collections, "shift_tasks", { isCompleted: 1 });

    // Staff Schedules indexes
    console.log("Setting up indexes for staff_schedules...");
    await createIndexIfNotExists(db, collections, "staff_schedules", { shift: 1 });
    await createIndexIfNotExists(db, collections, "staff_schedules", { staff: 1 });
    await createIndexIfNotExists(
      db,
      collections,
      "staff_schedules",
      { shift: 1, staff: 1 },
      { unique: true },
    );
    await createIndexIfNotExists(db, collections, "staff_schedules", { timeFrom: 1, timeTo: 1 });
    await createIndexIfNotExists(db, collections, "staff_schedules", { isDeleted: 1 });
    await createIndexIfNotExists(db, collections, "staff_schedules", { createdAt: -1 });

    // Client Schedules indexes
    console.log("Setting up indexes for client_schedules...");
    await createIndexIfNotExists(db, collections, "client_schedules", { shift: 1 });
    await createIndexIfNotExists(db, collections, "client_schedules", { client: 1 });
    await createIndexIfNotExists(db, collections, "client_schedules", { priceBook: 1 });
    await createIndexIfNotExists(db, collections, "client_schedules", { fund: 1 });
    await createIndexIfNotExists(db, collections, "client_schedules", { repetitiveId: 1 });
    await createIndexIfNotExists(db, collections, "client_schedules", { timeFrom: 1, timeTo: 1 });
    await createIndexIfNotExists(db, collections, "client_schedules", { isDeleted: 1 });
    await createIndexIfNotExists(db, collections, "client_schedules", { createdAt: -1 });

    // Shift Repeats indexes
    console.log("Setting up indexes for shift_repeats...");
    await createIndexIfNotExists(db, collections, "shift_repeats", { pattern: 1 });
    await createIndexIfNotExists(db, collections, "shift_repeats", { endDate: 1 });
    await createIndexIfNotExists(db, collections, "shift_repeats", { tz: 1 });
    await createIndexIfNotExists(db, collections, "shift_repeats", { createdAt: -1 });

    // Price Books indexes
    console.log("Setting up indexes for price_books...");
    await createIndexIfNotExists(db, collections, "price_books", { name: 1 });
    await createIndexIfNotExists(db, collections, "price_books", { isArchived: 1 });
    await createIndexIfNotExists(db, collections, "price_books", { createdAt: -1 });

    // Fundings indexes
    console.log("Setting up indexes for fundings...");
    await createIndexIfNotExists(db, collections, "fundings", { userId: 1 });
    await createIndexIfNotExists(db, collections, "fundings", { name: 1 });
    await createIndexIfNotExists(db, collections, "fundings", { createdAt: -1 });

    console.log("\n✓ Migration completed successfully!");
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    console.log("Rolling back migration...");

    // Drop indexes (in reverse order)
    const collections = [
      "users",
      "roles",
      "clients",
      "price_books",
      "fundings",
      "shifts",
      "shift_tasks",
      "staff_schedules",
      "client_schedules",
      "shift_repeats",
    ];

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        await collection.dropIndexes();
        console.log(`✓ Dropped indexes from ${collectionName}`);
      } catch (error) {
        console.log(`- Could not drop indexes from ${collectionName}: ${error.message}`);
      }
    }

    // Optionally drop collections (commented out for safety)
    // Uncomment if you want to drop collections on rollback
    /*
    for (const collectionName of collections) {
      try {
        await db.collection(collectionName).drop();
        console.log(`✓ Dropped collection: ${collectionName}`);
      } catch (error) {
        console.log(`- Could not drop ${collectionName}: ${error.message}`);
      }
    }
    */

    console.log("✓ Rollback completed");
  },
};
