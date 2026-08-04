import type { CandidateEmploymentType, CandidateWorkingModel } from '@/lib/candidate-api';

export const employmentTypeLabels: Record<CandidateEmploymentType, string> = {
  FULL_TIME: 'Toàn thời gian',
  PART_TIME: 'Bán thời gian',
  CONTRACT: 'Hợp đồng',
  INTERNSHIP: 'Thực tập',
  REMOTE: 'Làm việc từ xa',
  HYBRID: 'Linh hoạt',
};

export const workingModelLabels: Record<CandidateWorkingModel, string> = {
  ON_SITE: 'Tại văn phòng',
  HYBRID: 'Kết hợp',
  REMOTE: 'Từ xa',
  SHIFT: 'Theo ca',
};

export const experienceLevelLabels: Record<string, string> = {
  INTERN: 'Thực tập sinh',
  FRESHER: 'Fresher',
  JUNIOR: 'Junior',
  MIDDLE: 'Middle',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  MANAGER: 'Quản lý',
  DIRECTOR: 'Giám đốc',
};

export function formatSalary(minSalary: number | null, maxSalary: number | null, currency: string) {
  if (minSalary === null && maxSalary === null) return 'Thỏa thuận';

  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  if (minSalary !== null && maxSalary !== null) {
    return `${formatter.format(minSalary)} - ${formatter.format(maxSalary)}`;
  }
  if (minSalary !== null) return `Từ ${formatter.format(minSalary)}`;
  return `Đến ${formatter.format(maxSalary as number)}`;
}

export function formatJobDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}
