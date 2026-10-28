export const PUBLIC_ROUTE_KEY = 'auth:is-public';
export const REQUIRED_ROLES_KEY = 'auth:required-roles';
export const BOOTSTRAP_ROUTE_KEY = 'auth:bootstrap';

export const AUTH_ROLES = ['ADMIN', 'RECRUITER', 'CANDIDATE'] as const;
export const PUBLIC_SIGNUP_ROLES = ['RECRUITER', 'CANDIDATE'] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];
export type PublicSignupRole = (typeof PUBLIC_SIGNUP_ROLES)[number];

export const ROLE_DETAILS: Record<
  AuthRole,
  { name: string; description: string }
> = {
  ADMIN: {
    name: 'Administrator',
    description: 'System Administrator',
  },
  RECRUITER: {
    name: 'Recruiter',
    description: 'Recruitment Staff',
  },
  CANDIDATE: {
    name: 'Candidate',
    description: 'Job Applicant',
  },
};
