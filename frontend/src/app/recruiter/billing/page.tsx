import { requireProfile } from "@/lib/server-profile";
import { createClient } from "@/lib/supabase/server";
import { BillingWorkspace } from "@/components/recruiter/billing/BillingWorkspace";
import {
  getMyEntitlement,
  listBillingPackages,
  listMyOrders,
  listMyTransactions,
  type EntitlementStatus,
  type PackageOrder,
  type ServicePackage,
} from "@/lib/billing-api";

export const dynamic = "force-dynamic";

export default async function RecruiterBillingPage() {
  await requireProfile("RECRUITER");
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? "";

  let packages: ServicePackage[] = [];
  let entitlement: EntitlementStatus | null = null;
  let orders: PackageOrder[] = [];
  let transactions: Awaited<ReturnType<typeof listMyTransactions>> = [];

  if (token) {
    try {
      [packages, entitlement, orders, transactions] = await Promise.all([
        listBillingPackages(),
        getMyEntitlement(token),
        listMyOrders(token),
        listMyTransactions(token),
      ]);
    } catch (error) {
      console.error("Failed to load billing data", error);
    }
  }

  return (
    <BillingWorkspace
      token={token}
      packages={packages}
      entitlement={entitlement}
      orders={orders}
      transactions={transactions}
    />
  );
}
