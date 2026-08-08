"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const skills = await prisma.skill.findMany({
        take: 50,
    });
    console.log("Existing Skills:", skills.map(s => ({ id: s.id, name: s.name, normalizedName: s.normalizedName })));
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=inspect-skills.js.map