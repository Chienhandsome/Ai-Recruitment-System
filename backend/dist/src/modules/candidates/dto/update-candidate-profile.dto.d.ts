export declare class WorkExperienceInputDto {
    companyName: string;
    positionTitle: string;
    startDate?: string;
    endDate?: string | null;
    isCurrent?: boolean;
    description?: string | null;
    achievements?: string | null;
}
export declare class EducationInputDto {
    schoolName: string;
    major?: string | null;
    degree?: string | null;
    startDate?: string | null;
    endDate?: string | null;
}
export declare class ProjectInputDto {
    projectName: string;
    projectRole?: string | null;
    description?: string | null;
    technologies?: string[] | string | null;
    projectUrl?: string | null;
    startDate?: string | null;
    endDate?: string | null;
}
export declare class CertificateInputDto {
    certificateName: string;
    issuingOrganization?: string | null;
    issueDate?: string | null;
}
export declare class UpdateCandidateProfileDto {
    fullName?: string;
    phone?: string | null;
    address?: string | null;
    desiredTitle?: string | null;
    professionalSummary?: string | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    portfolioUrl?: string | null;
    workExperiences?: WorkExperienceInputDto[];
    educations?: EducationInputDto[];
    projects?: ProjectInputDto[];
    certificates?: CertificateInputDto[];
}
