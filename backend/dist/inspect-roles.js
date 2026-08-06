"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const roles = await prisma.role.findMany();
    console.log("Roles in DB:", roles);
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=inspect-roles.js.map