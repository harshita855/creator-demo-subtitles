import { PrismaClient } from "@prisma/client";

// A single shared Prisma Client instance for the whole API process.
// Creating a new PrismaClient per request would exhaust database
// connections under load - this pattern is the standard fix.
export const prisma = new PrismaClient();