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

  try {
    packages = await listBillingPackages("EMPLOYER");
  } catch (error) {
    console.error("Failed to load billing packages", error);
  }

  if (token) {
    const [entitlementRes, ordersRes, transactionsRes] =
      await Promise.allSettled([
        getMyEntitlement(token, "EMPLOYER"),
        listMyOrders(token, "EMPLOYER"),
        listMyTransactions(token, "EMPLOYER"),
      ]);

    if (entitlementRes.status === "fulfilled") {
      entitlement = entitlementRes.value;
    } else {
      console.error("Failed to load entitlement", entitlementRes.reason);
    }

    if (ordersRes.status === "fulfilled") {
      orders = ordersRes.value;
    } else {
      console.error("Failed to load orders", ordersRes.reason);
    }

    if (transactionsRes.status === "fulfilled") {
      transactions = transactionsRes.value;
    } else {
      console.error("Failed to load transactions", transactionsRes.reason);
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
