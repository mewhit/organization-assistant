import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

const databaseUrl =
  process.env.DATABASE_URL ??
  `mysql://${process.env.DATABASE_USERNAME ?? "root"}:${process.env.DATABASE_PASSWORD ?? ""}@${process.env.DATABASE_HOST ?? "127.0.0.1"}:${process.env.DATABASE_PORT ?? "3306"}/personal_assistant`;

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
