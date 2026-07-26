import { EmploymentType, ExperienceLevel, SkillRequirementType, WorkingModel, ProofType } from '@prisma/client';
export declare class JobSkillDto {
    skillId: string;
    requirementType: SkillRequirementType;
}
export declare class JobCertificateDto {
    certificateName: string;
    requirementType: SkillRequirementType;
}
export declare class JobScreeningQuestionDto {
    questionText: string;
    isRequired?: boolean;
}
export declare class CreateJobDto {
    title: string;
    departmentId?: string;
    description: string;
    requirements?: string;
    benefits?: string;
    employmentType?: EmploymentType;
    experienceLevel?: ExperienceLevel;
    minSalary?: number;
    maxSalary?: number;
    currency?: string;
    location?: string;
    workingModel?: WorkingModel;
    requiresProofOfWork?: boolean;
    proofOfWorkType?: ProofType;
    requiredExperienceYears?: number;
    autoShortlistThreshold?: number;
    autoRejectThreshold?: number;
    rejectOnMissingMandatory?: boolean;
    skillWeight?: number;
    experienceWeight?: number;
    educationWeight?: number;
    otherWeight?: number;
    skills?: JobSkillDto[];
    certificates?: JobCertificateDto[];
    screeningQuestions?: JobScreeningQuestionDto[];
}
