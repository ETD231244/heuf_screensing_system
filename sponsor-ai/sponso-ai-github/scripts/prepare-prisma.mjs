import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const url = process.env.DATABASE_URL ?? "";
const wantsPostgres = url.startsWith("postgres://") || url.startsWith("postgresql://");

let schema = readFileSync(schemaPath, "utf8");
if (wantsPostgres) {
  schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
  writeFileSync(schemaPath, schema);
  console.log("Prisma provider: postgresql");
} else {
  console.log("Prisma provider: sqlite (local)");
}
