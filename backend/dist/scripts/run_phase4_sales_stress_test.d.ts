import 'dotenv/config';
interface CandidateDefinition {
    code: string;
    archetype: string;
    name: string;
    email: string;
    phone: string;
    desiredTitle: string;
    summary: string;
    expectedLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    expectedOrderTier: string;
    profile: {
        desired_title: string;
        professional_summary: string;
    };
    educations: Array<{
        school_name: string;
        major: string;
        degree: string;
        start_date?: string;
        end_date?: string;
    }>;
    work_experiences: Array<{
        company_name: string;
        position_title: string;
        start_date: string;
        end_date: string;
        description: string;
        achievements: string;
    }>;
    skills: Array<{
        skill_name: string;
        proficiency_level: string;
        normalized_name?: string;
    }>;
    certificates: Array<{
        certificate_name: string;
    }>;
}
export declare const CANDIDATES_PHASE_4_6: CandidateDefinition[];
export {};
