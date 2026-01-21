import { PrismaClient } from "@prisma/client";

const db = globalThis.PrismaClient || new PrismaClient({
    log:[ "query", "info", "error", "warn"]
});

if(process.env.NODE_ENV === "development"){
    globalThis.prisma = db
};

export default db;