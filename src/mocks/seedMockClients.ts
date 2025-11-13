import "dotenv/config";
import { connectDB, disconnectDB } from "../config/database";
import Client from "../models/clientModel";
import { faker } from "@faker-js/faker";
import { Funding } from "../models/fundingModel";
import { IAddFunding } from "../validations/fundingValidation";
import { IAddClient } from "../validations/clientValidation";

async function run(): Promise<void> {
  try {
    await connectDB();

    // Parse command line arguments
    const args = process.argv.slice(2);
    let clientCount = 0;

    for (const arg of args) {
      if (arg.startsWith("clientCount=")) {
        clientCount = parseInt(arg.split("=")[1]);
      }
    }

    const religionCodes = [
      "CHR", // Christian
      "MUS", // Muslim
      "HIN", // Hindu
      "BUD", // Buddhist
      "SIK", // Sikh
      "JWI", // Jewish
      "ATH", // Atheist
      "OTH", // Other/Prefer not to say
    ];
    const clientMartialStatus = [
      "single",
      "married",
      "de_facto",
      "divorced",
      "separated",
      "widowed",
    ];
    const clientGender = ["male", "female", "intersex", "non_binary", "unspecified", "other"];
    const salutations = ["Mr", "Mrs", "Ms", "Miss", "Mx", "Dr", "Prof", "Them", "They", ""];
    const mockClients: IAddClient[] = Array.from({ length: clientCount }, () => {
      const rand = Math.random() * 100000000;
      const randomMartialStatus =
        clientMartialStatus[Math.floor(rand) % clientMartialStatus.length];
      const randomGender = clientGender[Math.floor(rand) % clientGender.length];
      const randomSalutation = salutations[Math.floor(rand) % salutations.length];
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const middleName = faker.person.middleName();
      const preferredName = `${firstName} ${lastName}`;
      const noOfLanguages = (Math.floor(rand) % 5) + 1;
      const languages = Array.from(
        { length: noOfLanguages },
        () => faker.location.language().alpha2,
      );
      const randomReligionCode = religionCodes[Math.floor(rand) % religionCodes.length];
      return {
        firstName,
        lastName,
        middleName,
        preferredName,
        gender: randomGender,
        email: faker.internet.email(),
        birthdate: faker.date.birthdate(),
        address: `${faker.location.streetAddress(true)}, ${faker.location.city()}, ${faker.location.state()}`,
        apartmentNumber: faker.location.buildingNumber(),
        mobileNumber: faker.phone.number(),
        phoneNumber: faker.phone.number(),
        isArchived: false,
        salutation: randomSalutation,
        nationality: faker.location.country(),
        languages,
        status: "active",
        maritalStatus: randomMartialStatus,
        religion: randomReligionCode,
      };
    });

    for (const client of mockClients) {
      const addedClient = await Client.create(client);
      console.log(`✅ Client "${addedClient.email}" created.`);
      const rand = Math.random() * 100000000;
      const funds: IAddFunding[] = Array.from({ length: (Math.floor(rand) % 5) + 1 }, (_, i) => {
        const isDefault = i === 0;
        return {
          client: addedClient._id!.toString(),
          name: faker.finance.accountName(),
          startDate: faker.date.past(),
          expireDate: faker.date.future(),
          amount: faker.number.int({ min: 100, max: 10000 }),
          isDefault: isDefault,
        };
      });
      await Funding.insertMany(funds);
      console.log(`✅ ${funds.length} of ${addedClient.email}'s funds created.`);
    }
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run().then(() => {
  console.log("Seed completed.");
});
