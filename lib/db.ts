import "dotenv/config";
import { Temporal } from "@js-temporal/polyfill";
import postgres from "@prisma/orm-postgres/runtime";

import type { Contract } from "../prisma/contract.d";
import contractJson from "../prisma/contract.json" with {
  type: "json",
};

/*
 * Prisma 8 RC uses Temporal for PostgreSQL
 * timestamp fields.
 *
 * Next.js does not provide Temporal globally,
 * so we install the polyfill before creating
 * the database client.
 */
(
  globalThis as typeof globalThis & {
    Temporal: typeof Temporal;
  }
).Temporal = Temporal;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not configured"
  );
}

export const db = postgres<Contract>({
  contractJson,
  url: process.env.DATABASE_URL,
});