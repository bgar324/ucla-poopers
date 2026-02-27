import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use a direct Postgres connection for schema operations (db push/migrate).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
