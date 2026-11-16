import { setRequestLocale } from "next-intl/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  AdminDashboard,
  AdminBugReport,
  AdminCatalogService,
} from "@/app/components/admin/admin-dashboard";

export const instant = false;

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const adminSupabase = createAdminClient();

  const [{ data: bugReportsData }, { data: catalogData }] = await Promise.all([
    adminSupabase
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false }),
    adminSupabase
      .from("catalog_subscriptions")
      .select(
        `
        id,
        name,
        slug,
        category,
        catalog_subscription_plans (
          id,
          name,
          default_cost,
          currency,
          interval
        )
      `,
      )
      .order("name", { ascending: true }),
  ]);

  const bugReports = (bugReportsData as unknown as AdminBugReport[]) || [];
  const catalog = (catalogData as unknown as AdminCatalogService[]) || [];

  return (
    <AdminDashboard bugReports={bugReports} catalog={catalog} locale={locale} />
  );
}
