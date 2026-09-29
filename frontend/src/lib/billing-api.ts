const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://ai-recruitment-system-test-deploy.onrender.com/api";

export type ServicePackage = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  audience: string;
  priceVnd: number;
  durationDays: number | null;
  maxActiveJobs: number | null;
  cvUnlockQuota: number;
  aiRanking: boolean;
  advancedFilters: boolean;
  recruitmentStats: boolean;
  talentPoolAccess: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type EntitlementStatus = {
  packageCode: string;
  packageName: string;
  maxActiveJobs: number | null;
  cvUnlockRemaining: number;
  aiRanking: boolean;
  advancedFilters: boolean;
  recruitmentStats: boolean;
  talentPoolAccess: boolean;
  startsAt: string;
  endsAt: string | null;
  entitlementId: string;
  activeJobCount: number;
  canPublishMoreJobs: boolean;
  disclaimer: string;
};

export type PackageOrder = {
  id: string;
  orderCode: string;
  amountVnd: number;
  currency: string;
  status: string;
  paymentProvider: string;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
  package: {
    id: string;
    code: string;
    name: string;
    durationDays: number | null;
  };
};

export type CheckoutSession = {
  orderId: string;
  orderCode: string;
  amountVnd: number;
  provider: string;
  checkoutUrl: string;
  providerSessionId: string;
};

export type TalentPoolCard = {
  id: string;
  displayName: string;
  desiredTitle: string | null;
  professionalSummary: string | null;
  locationHint: string | null;
  skills: Array<{
    skill: { id: string; name: string };
    proficiencyLevel: string;
    isPrimary: boolean;
  }>;
  contactUnlocked: boolean;
  contact: {
    email: string;
    phone: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    address: string | null;
  } | null;
  privacyNote: string | null;
};

async function billingRequest<T>(
  path: string,
  accessToken?: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Yêu cầu billing thất bại.";
    try {
      const payload = (await response.json()) as {
        message?: string | string[];
      };
      message = Array.isArray(payload.message)
        ? payload.message.join(", ")
        : payload.message ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export function listBillingPackages() {
  return billingRequest<ServicePackage[]>("/billing/packages");
}

export function getMyEntitlement(accessToken: string) {
  return billingRequest<EntitlementStatus>("/billing/me", accessToken);
}

export function createPackageOrder(
  accessToken: string,
  packageCode: "HR_PRO" | "HR_PREMIUM",
) {
  return billingRequest<PackageOrder>("/billing/orders", accessToken, {
    method: "POST",
    body: JSON.stringify({ packageCode }),
  });
}

export function checkoutOrder(accessToken: string, orderId: string) {
  return billingRequest<CheckoutSession>(
    `/billing/orders/${orderId}/checkout`,
    accessToken,
    { method: "POST" },
  );
}

export function mockPayOrder(accessToken: string, orderId: string) {
  return billingRequest<{
    order: PackageOrder;
    entitlement: EntitlementStatus;
    alreadyPaid: boolean;
  }>(`/billing/orders/${orderId}/mock-pay`, accessToken, { method: "POST" });
}

export function getOrder(accessToken: string, orderId: string) {
  return billingRequest<PackageOrder>(
    `/billing/orders/${orderId}`,
    accessToken,
  );
}

export function listMyOrders(accessToken: string) {
  return billingRequest<PackageOrder[]>("/billing/orders", accessToken);
}

export function listMyTransactions(accessToken: string) {
  return billingRequest<
    Array<{
      id: string;
      provider: string;
      providerTxnId: string | null;
      amountVnd: number;
      status: string;
      paidAt: string | null;
      createdAt: string;
      order: {
        id: string;
        orderCode: string;
        status: string;
        package: { code: string; name: string };
      };
    }>
  >("/billing/transactions", accessToken);
}

export function searchTalentPool(
  accessToken: string,
  params: { search?: string; skill?: string; page?: number },
) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.skill) qs.set("skill", params.skill);
  if (params.page) qs.set("page", String(params.page));
  const query = qs.toString();
  return billingRequest<{
    data: TalentPoolCard[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(`/billing/talent-pool${query ? `?${query}` : ""}`, accessToken);
}

export function unlockTalentProfile(
  accessToken: string,
  candidateProfileId: string,
) {
  return billingRequest<TalentPoolCard>(
    `/billing/talent-pool/${candidateProfileId}/unlock`,
    accessToken,
    { method: "POST" },
  );
}

export function adminListPackages(accessToken: string) {
  return billingRequest<ServicePackage[]>("/admin/packages", accessToken);
}

export function adminUpdatePackage(
  accessToken: string,
  packageId: string,
  body: Partial<ServicePackage>,
) {
  return billingRequest<ServicePackage>(
    `/admin/packages/${packageId}`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}
