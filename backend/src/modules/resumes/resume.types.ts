export interface ExtractionEvidence {
  is_inferred?: boolean;
  source_text?: string | null;
}

/** Payload shape published by the AI resume worker. */
export interface ParsedResumeData {
  summary?: string | null;
  desired_title?: string | null;
  total_years_experience?: number | null;
  overall_confidence?: number;
  llm_model?: string | null;
  prompt_version?: string | null;
  parser_version?: string | null;
  raw_text_hash?: string | null;
  extraction_duration_ms?: number | null;
  skills: Array<
    ExtractionEvidence & {
      name: string;
      proficiency_level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
      category_hint?:
        | 'IT'
        | 'Soft Skill'
        | 'Language'
        | 'Business'
        | 'Marketing'
        | 'Finance'
        | 'Other';
    }
  >;
  work_experiences: Array<
    ExtractionEvidence & {
      company_name: string;
      position_title: string;
      start_date?: string | null;
      end_date?: string | null;
      is_current: boolean;
      description?: string | null;
      achievements?: string | null;
    }
  >;
  educations: Array<
    ExtractionEvidence & {
      school_name: string;
      major?: string | null;
      degree?: string | null;
      start_date?: string | null;
      end_date?: string | null;
      description?: string | null;
    }
  >;
  projects: Array<
    ExtractionEvidence & {
      project_name: string;
      project_role?: string | null;
      description?: string | null;
      technologies?: string[] | null;
      project_url?: string | null;
      start_date?: string | null;
      end_date?: string | null;
    }
  >;
  certificates: Array<
    ExtractionEvidence & {
      certificate_name: string;
      issuing_organization: string;
      issue_date?: string | null;
      expiry_date?: string | null;
      credential_url?: string | null;
    }
  >;
  languages?: Array<
    ExtractionEvidence & {
      language: string;
      proficiency: string;
    }
  >;
}

export interface ResolvedResumeSkill {
  skillId: string;
  proficiencyLevel: ParsedResumeData['skills'][number]['proficiency_level'];
  isInferred: boolean;
  sourceText: string | null;
}
