"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const midAppId = "ce24bcbc-7b8c-4a29-b601-22239fe48067";
    await prisma.aiMatchingResult.deleteMany({
        where: { applicationId: midAppId },
    });
    const result = await prisma.aiMatchingResult.create({
        data: {
            applicationId: midAppId,
            overallScore: 51.28,
            matchLevel: client_1.MatchLevel.MEDIUM,
            skillScore: 60.42,
            experienceScore: 31.39,
            educationScore: 78.0,
            projectScore: 40.0,
            strengths: [
                "Sở hữu kỹ năng React ở mức INTERMEDIATE",
                "Có kinh nghiệm thực tế với Git",
                "Có học vấn phù hợp ngành Tin học ứng dụng"
            ],
            gaps: [
                "Thiếu kỹ năng bắt buộc: TypeScript (Cần trình độ INTERMEDIATE)",
                "Số năm kinh nghiệm (1.5 năm) thấp hơn yêu cầu tối thiểu (2.0 năm)"
            ],
            matchedSkills: [
                { name: "React", isMandatory: true },
                { name: "Git", isMandatory: true }
            ],
            missingSkills: [
                { name: "TypeScript", isMandatory: true },
                { name: "Tailwind CSS", isMandatory: false }
            ],
            missingRequiredSkills: ["TypeScript"],
            reasoningSummary: "Ứng viên Nguyễn Trung Bình đạt 51.28 điểm. Đã đáp ứng được React và Git nhưng còn thiếu kỹ năng bắt buộc TypeScript và chưa đủ 2 năm kinh nghiệm.",
            evidence: [
                { skillName: "React", evidenceText: "Xây dựng website bán hàng bằng ReactJS và Git", source: "WorkExperience" },
                { skillName: "Git", evidenceText: "Xây dựng website bán hàng bằng ReactJS và Git", source: "WorkExperience" }
            ],
            confidenceScore: 0.95,
        },
    });
    await prisma.application.update({
        where: { id: midAppId },
        data: { processingStatus: client_1.ApplicationProcessingStatus.COMPLETED },
    });
    console.log("✅ Successfully created AI Matching Result for Mid Candidate!", result);
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=save-mid-result.js.map