interface TestCase {
    category: string;
    categoryName: string;
    code: string;
    candidateName: string;
    jobTitle: string;
    jobRequirements: any;
    candidateData: any;
    expectedMin: number;
    expectedMax: number;
    expectedLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}
export declare const ADVERSARIAL_50_CASES: TestCase[];
export {};
