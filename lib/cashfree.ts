import { Cashfree } from "cashfree-pg";

const appId = process.env.CASHFREE_APP_ID;
const secretKey = process.env.CASHFREE_SECRET_KEY;

if (!appId) {
  throw new Error("CASHFREE_APP_ID is not configured");
}

if (!secretKey) {
  throw new Error("CASHFREE_SECRET_KEY is not configured");
}

export const cashfree = new Cashfree(
  1,
  appId,
  secretKey
);
