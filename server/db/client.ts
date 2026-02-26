import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { schema } from "./schema.js";

const databaseUrl =
  process.env.DATABASE_URL ??
  `mysql://${process.env.DATABASE_USERNAME ?? "root"}:${process.env.DATABASE_PASSWORD ?? ""}@${process.env.DATABASE_HOST ?? "127.0.0.1"}:${process.env.DATABASE_PORT ?? "3306"}/personal_assistant`;

const queryClient = mysql.createPool(databaseUrl);

export const db = drizzle(queryClient, { schema, mode: "default" });
