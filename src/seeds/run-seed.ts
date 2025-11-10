import { execSync } from "child_process";

const seeds = {
  roles: "src/seeds/addRoles.ts",
  admin: "src/seeds/addSuperAdmin.ts",
  client: "src/seeds/addClient.ts",
  "time-rules": "src/seeds/addTimeRules.ts",
};

const arg = process.argv[2]; // e.g. yarn seed roles
if (!arg) {
  console.log("🧩 Available seeds:");
  Object.keys(seeds).forEach((k) => console.log(" -", k));
  console.log("Usage: yarn seed:<seed-name>");
  console.log("Example: yarn seed:roles");
  process.exit(0);
}

const file = seeds[arg as keyof typeof seeds] as string;
if (!file) {
  console.error(`❌ Unknown seed: ${arg}`);
  process.exit(1);
}

console.log(`🌱 Running seed: ${arg} (${file})`);
execSync(`ts-node ${file}`, { stdio: "inherit" });
