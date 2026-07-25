import {
  PrismaClient,
  DepartmentStatus,
  SkillStatus,
  SkillType,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Roles
  const roles = [
    { code: 'ADMIN', name: 'Administrator', description: 'System Administrator' },
    { code: 'RECRUITER', name: 'Recruiter', description: 'HR / Recruitment Staff' },
    { code: 'CANDIDATE', name: 'Candidate', description: 'Job Applicant' },
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
  }
  console.log(`Seeded ${roles.length} roles.`);

  // 2. Company
  const company = await prisma.company.upsert({
    where: { code: 'ABC' },
    update: {},
    create: {
      name: 'Công ty ABC',
      code: 'ABC',
      website: 'https://abc.com',
      description: 'Công ty công nghệ hàng đầu',
    },
  });
  console.log(`Seeded company: ${company.name}`);

  // 3. Departments
  const departments = [
    { code: 'HR', name: 'Human Resources', companyId: company.id, status: DepartmentStatus.ACTIVE },
    { code: 'IT', name: 'Information Technology', companyId: company.id, status: DepartmentStatus.ACTIVE },
    { code: 'MKT', name: 'Marketing', companyId: company.id, status: DepartmentStatus.ACTIVE },
    { code: 'SALES', name: 'Sales', companyId: company.id, status: DepartmentStatus.ACTIVE },
    { code: 'FIN', name: 'Finance', companyId: company.id, status: DepartmentStatus.ACTIVE },
  ];
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }
  console.log(`Seeded ${departments.length} departments.`);

  // 4. Skill categories
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
  const categories = new Map<string, string>();
  for (const name of categoryNames) {
    const category = await prisma.skillCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories.set(name, category.id);
  }
  console.log(`Seeded ${categories.size} skill categories.`);

  // 5. Skills
  const skillsData = [
    { name: 'React', normalizedName: 'react', category: 'Frontend', type: SkillType.HARD },
    { name: 'Node.js', normalizedName: 'node.js', category: 'Backend', type: SkillType.HARD },
    { name: 'Python', normalizedName: 'python', category: 'AI & Data', type: SkillType.HARD },
    { name: 'Java', normalizedName: 'java', category: 'Backend', type: SkillType.HARD },
    { name: 'SQL', normalizedName: 'sql', category: 'Database', type: SkillType.HARD },
    { name: 'TypeScript', normalizedName: 'typescript', category: 'Programming Language', type: SkillType.HARD },
    { name: 'AWS', normalizedName: 'aws', category: 'Cloud', type: SkillType.HARD },
    { name: 'Docker', normalizedName: 'docker', category: 'DevOps', type: SkillType.HARD },
    { name: 'Kubernetes', normalizedName: 'kubernetes', category: 'DevOps', type: SkillType.HARD },
    { name: 'Communication', normalizedName: 'communication', category: 'Soft Skill', type: SkillType.SOFT },
    { name: 'Leadership', normalizedName: 'leadership', category: 'Soft Skill', type: SkillType.SOFT },
  ];

  const skillRecords = [];
  for (const skill of skillsData) {
    const record = await prisma.skill.upsert({
      where: { normalizedName: skill.normalizedName },
      update: {
        name: skill.name,
        categoryId: categories.get(skill.category)!,
        type: skill.type,
        status: SkillStatus.ACTIVE,
      },
      create: {
        name: skill.name,
        normalizedName: skill.normalizedName,
        categoryId: categories.get(skill.category)!,
        type: skill.type,
        status: SkillStatus.ACTIVE,
      },
    });
    skillRecords.push(record);
  }
  console.log(`Seeded ${skillRecords.length} skills.`);

  // 6. Skill Aliases
  const skillAliasesData = [
    { skillNormalized: 'react', alias: 'reactjs' },
    { skillNormalized: 'react', alias: 'react.js' },
    { skillNormalized: 'node.js', alias: 'nodejs' },
    { skillNormalized: 'node.js', alias: 'node' },
    { skillNormalized: 'typescript', alias: 'ts' },
  ];

  let aliasCount = 0;
  for (const item of skillAliasesData) {
    const skill = skillRecords.find(s => s.normalizedName === item.skillNormalized);
    if (skill) {
      await prisma.skillAlias.upsert({
        where: { aliasName: item.alias },
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

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
