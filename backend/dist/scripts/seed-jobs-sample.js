"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding sample jobs for Admin Job Moderation testing...');
    const company = await prisma.company.upsert({
        where: { code: 'TECHNOVA' },
        update: {},
        create: {
            name: 'TechNova Solutions Vietnam',
            code: 'TECHNOVA',
            website: 'https://technova.vn',
            description: 'Tập đoàn Giải pháp Công nghệ & Trí tuệ Nhân tạo',
        },
    });
    const dept = await prisma.department.upsert({
        where: { code: 'IT-DEV' },
        update: {},
        create: {
            name: 'Phát triển Phần mềm (Engineering)',
            code: 'IT-DEV',
            companyId: company.id,
        },
    });
    const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@admin.com' },
    });
    if (!adminUser) {
        throw new Error('Default admin user admin@admin.com not found. Run seed script first.');
    }
    const recruiter = await prisma.recruiterProfile.upsert({
        where: { userId: adminUser.id },
        update: {
            companyId: company.id,
            departmentId: dept.id,
        },
        create: {
            userId: adminUser.id,
            companyId: company.id,
            departmentId: dept.id,
        },
    });
    const sampleJobs = [
        {
            jobCode: 'JOB-AI-001',
            title: 'Senior AI Engineer (Python, LLM, RAG)',
            description: 'Xây dựng mô hình AI So khớp CV và Trích xuất Kỹ năng tự động.',
            requirements: 'Ít nhất 3 năm kinh nghiệm Python, LangChain, PyTorch, RAG Architecture.',
            benefits: 'Lương up to $3000, Thưởng KPI, Bảo hiểm PVI Premium.',
            status: client_1.JobStatus.PUBLISHED,
            minSalary: 40000000,
            maxSalary: 70000000,
            currency: 'VND',
            location: 'Hà Nội / Remote',
            requiredExperienceYears: 3,
            employmentType: client_1.EmploymentType.FULL_TIME,
            experienceLevel: client_1.ExperienceLevel.SENIOR,
        },
        {
            jobCode: 'JOB-FE-002',
            title: 'Senior Frontend Developer (Next.js 15, Tailwind)',
            description: 'Phát triển Giao diện Portal Tuyển dụng & Admin Dashboard.',
            requirements: 'Thành thạo ReactJS, Next.js App Router, TypeScript, TailwindCSS.',
            benefits: 'Lương up to $2500, Thưởng lễ tết 14 tháng lương/năm.',
            status: client_1.JobStatus.DRAFT,
            minSalary: 30000000,
            maxSalary: 55000000,
            currency: 'VND',
            location: 'TP. Hồ Chí Minh',
            requiredExperienceYears: 3,
            employmentType: client_1.EmploymentType.FULL_TIME,
            experienceLevel: client_1.ExperienceLevel.SENIOR,
        },
        {
            jobCode: 'JOB-BE-003',
            title: 'NestJS Microservices Backend Lead',
            description: 'Lập trình RESTful API, tích hợp RabbitMQ và Supabase PostgreSQL.',
            requirements: 'Sử dụng thành thạo NestJS, Prisma ORM, Microservices, Message Queue.',
            benefits: 'Lương cạnh tranh $2000 - $3500, chế độ đãi ngộ tốt.',
            status: client_1.JobStatus.PUBLISHED,
            minSalary: 45000000,
            maxSalary: 80000000,
            currency: 'VND',
            location: 'Hà Nội',
            requiredExperienceYears: 4,
            employmentType: client_1.EmploymentType.FULL_TIME,
            experienceLevel: client_1.ExperienceLevel.LEAD,
        },
        {
            jobCode: 'JOB-SPAM-004',
            title: 'Nhân viên Marketing Online (Tin chứa từ khóa Spam)',
            description: 'Tuyển gấp việc nhẹ lương cao không cần kinh nghiệm.',
            requirements: 'Không yêu cầu bằng cấp hay kinh nghiệm.',
            benefits: 'Hoa hồng hấp dẫn.',
            status: client_1.JobStatus.PAUSED,
            minSalary: 10000000,
            maxSalary: 15000000,
            currency: 'VND',
            location: 'Toàn quốc',
            requiredExperienceYears: 0,
            employmentType: client_1.EmploymentType.PART_TIME,
            experienceLevel: client_1.ExperienceLevel.FRESHER,
        },
        {
            jobCode: 'JOB-UIUX-005',
            title: 'Product UI/UX Designer (Figma, Design System)',
            description: 'Thiết kế Design System và User Flow cho nền tảng Recruitment Portal.',
            requirements: 'Thành thạo Figma, Wireframing, User Testing, Prototyping.',
            benefits: 'Lương $1500 - $2200, làm việc Hybrid.',
            status: client_1.JobStatus.CLOSED,
            minSalary: 25000000,
            maxSalary: 45000000,
            currency: 'VND',
            location: 'Đà Nẵng',
            requiredExperienceYears: 2,
            employmentType: client_1.EmploymentType.FULL_TIME,
            experienceLevel: client_1.ExperienceLevel.MIDDLE,
        },
    ];
    for (const j of sampleJobs) {
        await prisma.jobPosting.upsert({
            where: { jobCode: j.jobCode },
            update: {
                title: j.title,
                status: j.status,
                description: j.description,
            },
            create: {
                jobCode: j.jobCode,
                title: j.title,
                description: j.description,
                requirements: j.requirements,
                benefits: j.benefits,
                status: j.status,
                minSalary: j.minSalary,
                maxSalary: j.maxSalary,
                currency: j.currency,
                location: j.location,
                requiredExperienceYears: j.requiredExperienceYears,
                employmentType: j.employmentType,
                experienceLevel: j.experienceLevel,
                recruiterId: recruiter.id,
                departmentId: dept.id,
            },
        });
    }
    console.log('Successfully seeded sample jobs for Admin Moderation testing.');
}
main()
    .catch((e) => {
    console.error('Error seeding sample jobs:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-jobs-sample.js.map