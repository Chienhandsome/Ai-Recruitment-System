"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSkillCatalog = seedSkillCatalog;
const client_1 = require("@prisma/client");
const skill_catalog_1 = require("./skill-catalog");
const LEGACY_COMPOSITE_SKILL_MIGRATIONS = {
    'react-nextjs': ['react', 'next.js'],
    'node-nestjs': ['node.js', 'nestjs'],
    'python-backend': ['python', 'django', 'fastapi'],
    'java-springboot': ['java', 'spring-boot'],
    'docker-k8s-devops': ['docker', 'kubernetes', 'cicd'],
    'ai-ml-llm': ['machine-learning', 'large-language-models', 'generative-ai'],
    'dotnet-csharp': ['c-sharp', 'dotnet', 'aspnet-core'],
    'mobile-crossplatform': ['flutter', 'react-native'],
    'figma-uiux-design': ['figma', 'ui-design', 'ux-design'],
    'adobe-ps-ai': ['adobe-photoshop', 'adobe-illustrator', 'graphic-design'],
    'blender-3d-maya': ['blender', 'autodesk-maya', '3d-modeling'],
    'video-editing-pr-ae': ['premiere-pro', 'after-effects', 'video-editing'],
    'financial-reporting-bctc': ['financial-reporting'],
    'accounting-misa-sap': ['misa-accounting', 'sap-erp', 'sap-fico'],
    'corporate-finance-analysis': ['financial-analysis', 'fpa'],
    'b2b-sales-closing': ['b2b-sales', 'sales-closing'],
    'telesales-consulting': ['telesales', 'consultative-selling'],
    'seo-google-content': ['seo', 'content-marketing'],
    'fb-tiktok-ads': ['facebook-ads', 'tiktok-ads'],
    'content-copywriting': ['content-creation', 'copywriting'],
    'talent-acquisition-hr': ['talent-acquisition', 'recruitment', 'cv-screening'],
    'compensation-benefits-cb': ['compensation-benefits', 'payroll-processing'],
    'labor-law-legal': ['vietnam-labor-law', 'contract-management'],
    'pharma-sales-consultant': ['pharmacy-operations', 'consultative-selling'],
    'nursing-patient-care': ['nursing', 'patient-care'],
    'warehouse-inventory-mgmt': ['warehouse-management', 'inventory-management'],
    'import-export-customs': ['import-export', 'customs-declaration'],
    'autocad-revit-drawing': ['autocad', 'revit', 'bim'],
    'site-construction-supervision': ['construction-supervision', 'project-management'],
    'communication-teamwork': ['communication', 'teamwork'],
    'leadership-team-management': ['leadership', 'people-management'],
    'problem-solving-logic': ['problem-solving', 'logical-thinking'],
};
async function seedSkillCatalog(prisma, catalog = skill_catalog_1.SKILL_CATALOG) {
    (0, skill_catalog_1.validateSkillCatalog)(catalog);
    const categoryNames = [...new Set(catalog.map((skill) => skill.category))];
    await prisma.skillCategory.createMany({
        data: categoryNames.map((name) => ({ name })),
        skipDuplicates: true,
    });
    const seededCategories = await prisma.skillCategory.findMany({
        where: { name: { in: categoryNames } },
        select: { id: true, name: true },
    });
    const categoryIds = new Map(seededCategories.map((category) => [category.name, category.id]));
    const existingSkills = await prisma.skill.findMany({
        where: {
            normalizedName: { in: catalog.map((skill) => skill.normalizedName) },
        },
    });
    const existingSkillByNormalizedName = new Map(existingSkills.map((skill) => [skill.normalizedName, skill]));
    const newSkills = catalog.filter((skill) => !existingSkillByNormalizedName.has(skill.normalizedName));
    if (newSkills.length > 0) {
        await prisma.skill.createMany({
            data: newSkills.map((skill) => {
                const categoryId = requiredCategoryId(categoryIds, skill);
                return {
                    name: skill.name,
                    normalizedName: skill.normalizedName,
                    categoryId,
                    type: toPrismaSkillType(skill.type),
                    status: client_1.SkillStatus.ACTIVE,
                };
            }),
            skipDuplicates: true,
        });
    }
    const skillUpdates = catalog.flatMap((skill) => {
        const existing = existingSkillByNormalizedName.get(skill.normalizedName);
        if (!existing)
            return [];
        const categoryId = categoryIds.get(skill.category);
        if (!categoryId) {
            throw new Error(`Missing seeded category "${skill.category}".`);
        }
        const type = toPrismaSkillType(skill.type);
        if (existing.name === skill.name &&
            existing.categoryId === categoryId &&
            existing.type === type &&
            existing.status === client_1.SkillStatus.ACTIVE) {
            return [];
        }
        return [
            prisma.skill.update({
                where: { id: existing.id },
                data: { name: skill.name, categoryId, type, status: client_1.SkillStatus.ACTIVE },
            }),
        ];
    });
    await executeInChunks(prisma, skillUpdates);
    const seededSkills = await prisma.skill.findMany({
        where: {
            normalizedName: { in: catalog.map((skill) => skill.normalizedName) },
        },
    });
    const skillRecords = new Map(seededSkills.map((skill) => [skill.normalizedName, skill]));
    const legacyMigrationResult = await migrateLegacyCompositeSkills(prisma, skillRecords);
    const canonicalSkillByLabel = new Map([...skillRecords.values()].map((skill) => [
        skill.name.trim().toLocaleLowerCase('vi'),
        skill.id,
    ]));
    const existingAliases = await prisma.skillAlias.findMany({
        select: { id: true, skillId: true, aliasName: true },
    });
    const aliasGroups = new Map();
    for (const alias of existingAliases) {
        const key = normalizeLabel(alias.aliasName);
        aliasGroups.set(key, [...(aliasGroups.get(key) ?? []), alias]);
    }
    const aliasIdsToDelete = new Set();
    for (const alias of existingAliases) {
        if (canonicalSkillByLabel.has(normalizeLabel(alias.aliasName))) {
            aliasIdsToDelete.add(alias.id);
        }
    }
    const desiredAliases = catalog.flatMap((skill) => {
        const skillRecord = skillRecords.get(skill.normalizedName);
        if (!skillRecord) {
            throw new Error(`Missing seeded skill "${skill.name}".`);
        }
        return skill.aliases.map((aliasName) => ({ aliasName, skillId: skillRecord.id }));
    });
    const aliasesToCreate = [];
    const aliasesToUpdate = [];
    for (const desiredAlias of desiredAliases) {
        const existingGroup = (aliasGroups.get(normalizeLabel(desiredAlias.aliasName)) ?? [])
            .filter((alias) => !aliasIdsToDelete.has(alias.id));
        if (existingGroup.length === 0) {
            aliasesToCreate.push(desiredAlias);
            continue;
        }
        const keeper = existingGroup.find((alias) => alias.aliasName === desiredAlias.aliasName) ??
            existingGroup[0];
        for (const duplicate of existingGroup) {
            if (duplicate.id !== keeper.id)
                aliasIdsToDelete.add(duplicate.id);
        }
        if (keeper.aliasName !== desiredAlias.aliasName ||
            keeper.skillId !== desiredAlias.skillId) {
            aliasesToUpdate.push(prisma.skillAlias.update({
                where: { id: keeper.id },
                data: desiredAlias,
            }));
        }
    }
    if (aliasIdsToDelete.size > 0) {
        await prisma.skillAlias.deleteMany({
            where: { id: { in: [...aliasIdsToDelete] } },
        });
    }
    await executeInChunks(prisma, aliasesToUpdate);
    if (aliasesToCreate.length > 0) {
        await prisma.skillAlias.createMany({
            data: aliasesToCreate,
            skipDuplicates: true,
        });
    }
    return {
        categories: categoryNames.length,
        skills: catalog.length,
        aliases: desiredAliases.length,
        removedAmbiguousAliases: aliasIdsToDelete.size,
        ...legacyMigrationResult,
    };
}
function toPrismaSkillType(type) {
    return type === 'SOFT' ? client_1.SkillType.SOFT : client_1.SkillType.HARD;
}
function requiredCategoryId(categoryIds, skill) {
    const categoryId = categoryIds.get(skill.category);
    if (!categoryId) {
        throw new Error(`Missing seeded category "${skill.category}".`);
    }
    return categoryId;
}
function normalizeLabel(label) {
    return label.trim().toLocaleLowerCase('vi');
}
async function executeInChunks(prisma, operations, chunkSize = 100) {
    for (let index = 0; index < operations.length; index += chunkSize) {
        await prisma.$transaction(operations.slice(index, index + chunkSize));
    }
}
async function migrateLegacyCompositeSkills(prisma, canonicalSkills) {
    const legacySkills = await prisma.skill.findMany({
        where: {
            normalizedName: {
                in: Object.keys(LEGACY_COMPOSITE_SKILL_MIGRATIONS),
            },
            OR: [
                { status: { not: client_1.SkillStatus.INACTIVE } },
                { candidateSkills: { some: {} } },
                { jobSkills: { some: {} } },
            ],
        },
        include: { candidateSkills: true, jobSkills: true },
    });
    if (legacySkills.length === 0) {
        return {
            deprecatedLegacySkills: 0,
            migratedCandidateSkillLinks: 0,
            migratedJobSkillLinks: 0,
        };
    }
    const candidateLinks = [];
    const jobLinks = [];
    for (const legacySkill of legacySkills) {
        const targetKeys = LEGACY_COMPOSITE_SKILL_MIGRATIONS[legacySkill.normalizedName];
        const targetSkillIds = targetKeys.map((targetKey) => {
            const target = canonicalSkills.get(targetKey);
            if (!target) {
                throw new Error(`Legacy skill migration target "${targetKey}" is not in the canonical catalog.`);
            }
            return target.id;
        });
        for (const link of legacySkill.candidateSkills) {
            for (const skillId of targetSkillIds) {
                candidateLinks.push({
                    candidateId: link.candidateId,
                    resumeId: link.resumeId,
                    skillId,
                    proficiencyLevel: link.proficiencyLevel,
                    isPrimary: link.isPrimary,
                    source: link.source,
                    isInferred: link.isInferred,
                    sourceText: link.sourceText,
                    createdAt: link.createdAt,
                });
            }
        }
        for (const link of legacySkill.jobSkills) {
            for (const skillId of targetSkillIds) {
                jobLinks.push({
                    jobId: link.jobId,
                    skillId,
                    requirementType: link.requirementType,
                    minimumProficiency: link.minimumProficiency,
                    weight: link.weight,
                    minYearsExperience: link.minYearsExperience,
                    createdAt: link.createdAt,
                });
            }
        }
    }
    if (candidateLinks.length > 0) {
        await prisma.candidateSkill.createMany({
            data: candidateLinks,
            skipDuplicates: true,
        });
    }
    if (jobLinks.length > 0) {
        await prisma.jobSkill.createMany({ data: jobLinks, skipDuplicates: true });
    }
    const legacySkillIds = legacySkills.map((skill) => skill.id);
    await prisma.$transaction([
        prisma.candidateSkill.deleteMany({
            where: { skillId: { in: legacySkillIds } },
        }),
        prisma.jobSkill.deleteMany({ where: { skillId: { in: legacySkillIds } } }),
        prisma.skill.updateMany({
            where: { id: { in: legacySkillIds } },
            data: { status: client_1.SkillStatus.INACTIVE },
        }),
    ]);
    return {
        deprecatedLegacySkills: legacySkills.length,
        migratedCandidateSkillLinks: legacySkills.reduce((sum, skill) => sum + skill.candidateSkills.length, 0),
        migratedJobSkillLinks: legacySkills.reduce((sum, skill) => sum + skill.jobSkills.length, 0),
    };
}
//# sourceMappingURL=seed-skill-catalog.js.map