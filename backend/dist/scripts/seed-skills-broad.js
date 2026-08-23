"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const seed_skill_catalog_1 = require("../prisma/seed-skill-catalog");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding canonical multi-industry skill catalog...');
    const result = await (0, seed_skill_catalog_1.seedSkillCatalog)(prisma);
    console.log(`Skill catalog ready: ${result.categories} categories, ` +
        `${result.skills} skills, ${result.aliases} aliases.`);
    if (result.removedAmbiguousAliases > 0) {
        console.log(`Removed ${result.removedAmbiguousAliases} ambiguous legacy aliases.`);
    }
    if (result.deprecatedLegacySkills > 0) {
        console.log(`Migrated ${result.migratedCandidateSkillLinks} candidate links and ` +
            `${result.migratedJobSkillLinks} job links from ` +
            `${result.deprecatedLegacySkills} legacy composite skills.`);
    }
}
main()
    .catch((error) => {
    console.error('Error seeding skill catalog:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-skills-broad.js.map