export const AUTH_ROLES = ["ADMIN", "RECRUITER", "CANDIDATE"] as const;
export const PUBLIC_SIGNUP_ROLES = ["RECRUITER", "CANDIDATE"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];
export type PublicSignupRole = (typeof PUBLIC_SIGNUP_ROLES)[number];

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface WorkExperienceData {
  id: string;
  companyName: string;
  positionTitle: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  achievements: string | null;
}

export interface EducationData {
  id: string;
  schoolName: string;
  major: string | null;
  degree: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface ProjectData {
  id: string;
  projectName: string;
  projectRole: string | null;
  description: string | null;
  technologies: string[] | null;
  projectUrl: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface CertificateData {
  id: string;
  certificateName: string;
  issuingOrganization: string;
  issueDate: string | null;
  expiryDate: string | null;
  credentialUrl: string | null;
}

export interface AuthProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: "ACTIVE" | "SUSPENDED" | "LOCKED";
  roles: AuthRole[];
  candidateProfile: {
    id: string;
    address: string | null;
    desiredTitle: string | null;
    professionalSummary: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    workExperiences?: WorkExperienceData[];
    educations?: EducationData[];
    projects?: ProjectData[];
    certificates?: CertificateData[];
  } | null;
  recruiterProfile: {
    id: string;
    departmentId: string | null;
    title: string | null;
  } | null;
}

export interface PendingSignup {
  email: string;
  role: PublicSignupRole;
}
