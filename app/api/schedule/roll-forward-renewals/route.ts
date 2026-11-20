import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { rollForwardDueRenewals } from "@/app/lib/payments/sync-payments";

function isAuthorizedScheduleRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const expected = `Bearer ${secret}`;
  const providedBuf = Buffer.from(authHeader);
  const expectedBuf = Buffer.from(expected);

  if (providedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(providedBuf, expectedBuf);
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedScheduleRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { processedSubscriptions, recordedPayments } =
      await rollForwardDueRenewals(supabase);

    return NextResponse.json({
      ok: true,
      processedSubscriptions,
      recordedPayments,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[schedule/roll-forward-renewals] Execution failed:", err);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
