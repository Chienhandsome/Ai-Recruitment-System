import { EmploymentType, ExperienceLevel, LevelRequirementMode, SkillRequirementType, WorkingModel, ProofType } from '@prisma/client';
export declare class JobSkillDto {
    skillId: string;
    requirementType: SkillRequirementType;
}
export declare class JobCertificateDto {
    certificateName: string;
    requirementType: SkillRequirementType;
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
    categoryId?: string;
    expiryDate?: string;
    requiredExperienceYears?: number;
    levelRequirementMode?: LevelRequirementMode;
    autoShortlistThreshold?: number;
    autoRejectThreshold?: number;
    rejectOnMissingMandatory?: boolean;
    skillWeight?: number;
    experienceWeight?: number;
    educationWeight?: number;
    otherWeight?: number;
    skills?: JobSkillDto[];
    certificates?: JobCertificateDto[];
}
