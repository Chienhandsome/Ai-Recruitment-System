import { PackageAudience } from '@prisma/client';

export const PACKAGE_CODES = {
  HR_FREE: 'HR_FREE',
  HR_PRO: 'HR_PRO',
  /** @deprecated Merged into HR_PRO — kept for legacy orders/entitlements */
  HR_PREMIUM: 'HR_PREMIUM',
  CANDIDATE_FREE: 'CANDIDATE_FREE',
  CANDIDATE_PRO: 'CANDIDATE_PRO',
  CANDIDATE_PREMIUM: 'CANDIDATE_PREMIUM',
} as const;

export type PackageCode = (typeof PACKAGE_CODES)[keyof typeof PACKAGE_CODES];

export const USAGE_FEATURES = {
  JD_FIT_ANALYSIS: 'JD_FIT_ANALYSIS',
  AI_MOCK_INTERVIEW: 'AI_MOCK_INTERVIEW',
  CV_UNLOCK: 'CV_UNLOCK',
} as const;

export type UsageFeatureCode =
  (typeof USAGE_FEATURES)[keyof typeof USAGE_FEATURES];

export type EntitlementFeatures = {
  audience: PackageAudience;
  packageCode: string;
  packageName: string;
  entitlementId: string | null;
  isVirtualFree: boolean;
  maxActiveJobs: number | null;
  monthlyJobCreateLimit: number | null;
  maxApplicantsPerJob: number | null;
  cvUnlockRemaining: number;
  aiRanking: boolean;
  advancedFilters: boolean;
  recruitmentStats: boolean;
  talentPoolAccess: boolean;
  jdFitAnalysis: boolean;
  cvImproveSuggestions: boolean;
  jdFitRemaining: number;
  aiMockInterview: boolean;
  mockInterviewRemaining: number;
  startsAt: Date | null;
  endsAt: Date | null;
};

export type PackageFeaturesSnapshot = {
  maxActiveJobs: number | null;
  monthlyJobCreateLimit: number | null;
  maxApplicantsPerJob: number | null;
  cvUnlockQuota: number;
  aiRanking: boolean;
  advancedFilters: boolean;
  recruitmentStats: boolean;
  talentPoolAccess: boolean;
  jdFitAnalysis: boolean;
  cvImproveSuggestions: boolean;
  jdFitQuota: number;
  aiMockInterview: boolean;
  mockInterviewQuota: number;
};

export class PackageFeatureDeniedError extends Error {
  constructor(
    public readonly feature: string,
    public readonly requiredPackage: string,
    message?: string,
  ) {
    super(
      message ??
        `Tính năng "${feature}" yêu cầu gói ${requiredPackage}. Vui lòng nâng cấp để tiếp tục.`,
    );
    this.name = 'PackageFeatureDeniedError';
  }
}

export class ActiveJobQuotaExceededError extends Error {
  constructor(
    public readonly maxActiveJobs: number,
    public readonly currentActiveJobs: number,
  ) {
    super(
      `Gói hiện tại chỉ cho phép tối đa ${maxActiveJobs} tin tuyển dụng đang hoạt động (hiện có ${currentActiveJobs}). Nâng cấp HR Pro để đăng thêm tin.`,
    );
    this.name = 'ActiveJobQuotaExceededError';
  }
}

export class MonthlyJobCreateQuotaExceededError extends Error {
  constructor(
    public readonly monthlyLimit: number,
    public readonly createdThisMonth: number,
  ) {
    super(
      `Gói Free chỉ cho phép tạo tối đa ${monthlyLimit} tin tuyển dụng mỗi tháng (đã tạo ${createdThisMonth}). Nâng cấp HR Pro để tạo không giới hạn.`,
    );
    this.name = 'MonthlyJobCreateQuotaExceededError';
  }
}

export class ApplicantCapReachedError extends Error {
  constructor(
    public readonly maxApplicants: number,
    public readonly currentApplicants: number,
  ) {
    super(
      `Tin này đã đạt giới hạn ${maxApplicants} ứng viên của gói Free (hiện có ${currentApplicants}). Tin đã ẩn với ứng viên — nâng cấp HR Pro để mở lại không giới hạn.`,
    );
    this.name = 'ApplicantCapReachedError';
  }
}

export class QuotaExceededError extends Error {
  constructor(public readonly feature: string) {
    super(`Đã hết lượt sử dụng tính năng "${feature}" trong gói hiện tại.`);
    this.name = 'QuotaExceededError';
  }
}

export function isMockPaymentAllowed(): boolean {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  if (nodeEnv === 'production') {
    return process.env.ALLOW_MOCK_PAYMENT === 'true';
  }
  return true;
}

export function tierRank(code: string): number {
  switch (code) {
    case PACKAGE_CODES.HR_PREMIUM:
    case PACKAGE_CODES.CANDIDATE_PREMIUM:
      return 3;
    case PACKAGE_CODES.HR_PRO:
    case PACKAGE_CODES.CANDIDATE_PRO:
      return 2;
    case PACKAGE_CODES.HR_FREE:
    case PACKAGE_CODES.CANDIDATE_FREE:
      return 1;
    default:
      return 0;
  }
}

export function freeCodeForAudience(audience: PackageAudience): string {
  return audience === PackageAudience.CANDIDATE
    ? PACKAGE_CODES.CANDIDATE_FREE
    : PACKAGE_CODES.HR_FREE;
}

/** Calendar month window in Asia/Ho_Chi_Minh (start inclusive, end exclusive). */
export function vietnamMonthWindow(now = new Date()): {
  start: Date;
  end: Date;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const start = new Date(
    `${year}-${String(month).padStart(2, '0')}-01T00:00:00+07:00`,
  );
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = new Date(
    `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00+07:00`,
  );
  return { start, end };
}

export function snapshotFromPackage(pkg: {
  maxActiveJobs: number | null;
  monthlyJobCreateLimit?: number | null;
  maxApplicantsPerJob?: number | null;
  cvUnlockQuota: number;
  aiRanking: boolean;
  advancedFilters: boolean;
  recruitmentStats: boolean;
  talentPoolAccess: boolean;
  jdFitAnalysis: boolean;
  cvImproveSuggestions: boolean;
  jdFitQuota: number;
  aiMockInterview: boolean;
  mockInterviewQuota: number;
}): PackageFeaturesSnapshot {
  return {
    maxActiveJobs: pkg.maxActiveJobs,
    monthlyJobCreateLimit: pkg.monthlyJobCreateLimit ?? null,
    maxApplicantsPerJob: pkg.maxApplicantsPerJob ?? null,
    cvUnlockQuota: pkg.cvUnlockQuota,
    aiRanking: pkg.aiRanking,
    advancedFilters: pkg.advancedFilters,
    recruitmentStats: pkg.recruitmentStats,
    talentPoolAccess: pkg.talentPoolAccess,
    jdFitAnalysis: pkg.jdFitAnalysis,
    cvImproveSuggestions: pkg.cvImproveSuggestions,
    jdFitQuota: pkg.jdFitQuota,
    aiMockInterview: pkg.aiMockInterview,
    mockInterviewQuota: pkg.mockInterviewQuota,
  };
}
