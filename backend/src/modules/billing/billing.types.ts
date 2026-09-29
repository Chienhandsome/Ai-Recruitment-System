export const PACKAGE_CODES = {
  HR_FREE: 'HR_FREE',
  HR_PRO: 'HR_PRO',
  HR_PREMIUM: 'HR_PREMIUM',
} as const;

export type PackageCode = (typeof PACKAGE_CODES)[keyof typeof PACKAGE_CODES];

export type EntitlementFeatures = {
  packageCode: string;
  packageName: string;
  maxActiveJobs: number | null;
  cvUnlockRemaining: number;
  aiRanking: boolean;
  advancedFilters: boolean;
  recruitmentStats: boolean;
  talentPoolAccess: boolean;
  startsAt: Date;
  endsAt: Date | null;
  entitlementId: string;
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
      `Gói hiện tại chỉ cho phép tối đa ${maxActiveJobs} tin tuyển dụng đang hoạt động (hiện có ${currentActiveJobs}). Nâng cấp HR Pro hoặc Premium để đăng thêm tin.`,
    );
    this.name = 'ActiveJobQuotaExceededError';
  }
}
