"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Start seeding...');
    const categoryNames = [
        'Frontend',
        'Backend',
        'AI & Data',
        'Database',
        'Programming Language',
        'Cloud',
        'DevOps',
        'Soft Skill',
    ];
    const categories = new Map();
    for (const name of categoryNames) {
        const category = await prisma.skillCategory.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        categories.set(name, category.id);
    }
    console.log(`Seeded ${categories.size} skill categories.`);
    const skillsData = [
        { name: 'React', category: 'Frontend', type: client_1.SkillType.HARD },
        { name: 'Node.js', category: 'Backend', type: client_1.SkillType.HARD },
        { name: 'Python', category: 'AI & Data', type: client_1.SkillType.HARD },
        { name: 'Java', category: 'Backend', type: client_1.SkillType.HARD },
        { name: 'SQL', category: 'Database', type: client_1.SkillType.HARD },
        { name: 'TypeScript', category: 'Programming Language', type: client_1.SkillType.HARD },
        { name: 'AWS', category: 'Cloud', type: client_1.SkillType.HARD },
        { name: 'Docker', category: 'DevOps', type: client_1.SkillType.HARD },
        { name: 'Kubernetes', category: 'DevOps', type: client_1.SkillType.HARD },
        { name: 'Communication', category: 'Soft Skill', type: client_1.SkillType.SOFT },
        { name: 'Leadership', category: 'Soft Skill', type: client_1.SkillType.SOFT },
    ];
    const skillRecords = [];
    for (const skill of skillsData) {
        const record = await prisma.skill.upsert({
            where: { name: skill.name },
            update: {
                categoryId: categories.get(skill.category),
                type: skill.type,
            },
            create: {
                name: skill.name,
                categoryId: categories.get(skill.category),
                type: skill.type,
            },
        });
        skillRecords.push(record);
    }
    console.log(`Seeded ${skillRecords.length} skills.`);
    const skillAliasesData = [
        { skillName: 'React', alias: 'reactjs' },
        { skillName: 'React', alias: 'react.js' },
        { skillName: 'Node.js', alias: 'nodejs' },
        { skillName: 'Node.js', alias: 'node' },
        { skillName: 'TypeScript', alias: 'ts' },
    ];
    let aliasCount = 0;
    for (const item of skillAliasesData) {
        const skill = skillRecords.find((s) => s.name === item.skillName);
        if (skill) {
            await prisma.skillAlias.upsert({
                where: { skillId_aliasName: { skillId: skill.id, aliasName: item.alias } },
                update: {},
                create: {
                    aliasName: item.alias,
                    skillId: skill.id,
                },
            });
            aliasCount++;
        }
    }
    console.log(`Seeded ${aliasCount} skill aliases.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map