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
    githubUrl: string | null;
    linkedinUrl: string | null;
  } | null;
  recruiterProfile: {
    id: string;
    companyName?: string | null;
    title: string | null;
  } | null;
}

export interface PendingSignup {
  email: string;
  role: PublicSignupRole;
}
