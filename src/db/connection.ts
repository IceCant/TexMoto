import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { schema } from "@/db/schema";

declare global {
  var texMotoSql: ReturnType<typeof postgres> | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  return databaseUrl;
}

const sql = globalThis.texMotoSql ?? postgres(getDatabaseUrl(), { max: 10 });
if (process.env.NODE_ENV !== "production") globalThis.texMotoSql = sql;

export const db = drizzle(sql, { schema });
export { sql };

